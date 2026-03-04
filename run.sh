#!/bin/bash
# RepDown — CLI Compile Runner
# Usage: ./run.sh <project-id> [engine]

PORT=${REPDOWN_PORT:-3000}
BASE="http://localhost:$PORT"

# ── Colors ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'
CYAN='\033[0;36m'; GRAY='\033[0;90m'; BOLD='\033[1m'; NC='\033[0m'

# ── Header ────────────────────────────────────────────────────────────────────
echo ""
echo -e "  ${BOLD}Rep${CYAN}Down${NC}${BOLD} — Compile Runner${NC}"
echo -e "  ${GRAY}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ -z "$1" ]; then
  echo ""
  echo -e "  ${YELLOW}Usage:${NC} ./run.sh <project-id> [engine]"
  echo ""
  echo -e "  ${GRAY}Engines: xelatex (default) · pdflatex · lualatex · wkhtmltopdf${NC}"
  echo ""
  echo -e "  ${GRAY}List projects:${NC}"
  echo -e "  ${GRAY}  curl $BASE/api/projects | python3 -m json.tool${NC}"
  echo ""
  exit 1
fi

PID="$1"
ENGINE="${2:-xelatex}"
PROJ_DIR="projects/$PID"
REPORT_MD="$PROJ_DIR/report.md"

echo ""
echo -e "  ${GRAY}Project :${NC} $PID"
echo -e "  ${GRAY}Engine  :${NC} $ENGINE"
echo ""

# ── Pre-flight: check report.md exists ───────────────────────────────────────
if [ ! -f "$REPORT_MD" ]; then
  echo -e "  ${RED}✗ report.md not found${NC}"
  echo -e "  ${GRAY}  Expected: $REPORT_MD${NC}"
  echo ""
  exit 1
fi

# ── Pre-flight: validate YAML frontmatter ────────────────────────────────────
# Detect unclosed frontmatter (--- open but no closing ---)
FRONTMATTER_OPEN=$(head -1 "$REPORT_MD" | grep -c "^---")
if [ "$FRONTMATTER_OPEN" -eq 1 ]; then
  # Count --- delimiters in file
  DELIMITERS=$(grep -c "^---" "$REPORT_MD" 2>/dev/null || echo 0)
  if [ "$DELIMITERS" -lt 2 ]; then
    echo -e "  ${RED}✗ Frontmatter error in report.md${NC}"
    echo -e "  ${YELLOW}  → Opened with '---' but missing closing '---'${NC}"
    echo -e "  ${GRAY}  Make sure your YAML block looks like:${NC}"
    echo -e "  ${GRAY}    ---${NC}"
    echo -e "  ${GRAY}    title: \"My Report\"${NC}"
    echo -e "  ${GRAY}    ---${NC}"
    echo ""
    exit 1
  fi

  # Check for undefined/bare variables (lines like:  key: )
  BARE_VARS=$(awk '/^---/{f++} f==1 && /^[a-zA-Z_]+:[ \t]*$/{print NR": "$0}' "$REPORT_MD")
  if [ -n "$BARE_VARS" ]; then
    echo -e "  ${YELLOW}⚠ Possible empty YAML variables in frontmatter:${NC}"
    while IFS= read -r line; do
      echo -e "  ${YELLOW}  line $line${NC}"
    done <<< "$BARE_VARS"
    echo -e "  ${GRAY}  These may cause pandoc errors. Wrap values in quotes.${NC}"
    echo ""
  fi
fi

# ── Compile via API ───────────────────────────────────────────────────────────
echo -e "  ${GRAY}Compiling...${NC}"
echo ""

RESULT=$(curl -s -X POST "$BASE/api/compile/$PID" \
  -H "Content-Type: application/json" \
  -d "{\"engine\":\"$ENGINE\",\"mainFile\":\"report.md\"}")

if [ -z "$RESULT" ]; then
  echo -e "  ${RED}✗ No response from server${NC}"
  echo -e "  ${GRAY}  Is RepDown running on port $PORT?${NC}"
  echo -e "  ${GRAY}  Try: node server/index.js${NC}"
  echo ""
  exit 1
fi

SUCCESS=$(echo "$RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('success','false'))" 2>/dev/null)
LOG=$(echo "$RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('log',''))" 2>/dev/null)

# ── Success ───────────────────────────────────────────────────────────────────
if [ "$SUCCESS" = "True" ] || [ "$SUCCESS" = "true" ]; then
  echo -e "  ${GREEN}✓ Compiled successfully!${NC}"
  echo ""
  echo -e "  ${GRAY}PDF → ${NC}$PROJ_DIR/.output/report.pdf"
  echo ""
  if command -v xdg-open &>/dev/null; then
    xdg-open "$PROJ_DIR/.output/report.pdf" 2>/dev/null &
  fi
  exit 0
fi

# ── Failure — parse log for known error patterns ──────────────────────────────
echo -e "  ${RED}✗ Compilation failed${NC}"
echo ""

# Helper: print a categorized error block
print_error() {
  local category="$1" detail="$2"
  echo -e "  ${RED}▸ $category${NC}"
  echo -e "  ${YELLOW}  $detail${NC}"
  echo ""
}

CATEGORIZED=0

# ── 1. Frontmatter / YAML errors (pandoc) ────────────────────────────────────
if echo "$LOG" | grep -qi "yaml\|frontmatter\|could not parse\|mapping values are not allowed"; then
  print_error "YAML Frontmatter Error" "Invalid syntax in the --- block at the top of report.md"
  echo -e "  ${GRAY}  Common causes:${NC}"
  echo -e "  ${GRAY}  · Missing closing ---${NC}"
  echo -e "  ${GRAY}  · Unquoted special characters in values${NC}"
  echo -e "  ${GRAY}  · Indentation errors${NC}"
  CATEGORIZED=1
fi

# ── 2. Undefined LaTeX command ────────────────────────────────────────────────
UNDEF=$(echo "$LOG" | grep -o "Undefined control sequence.*" | head -3)
if [ -n "$UNDEF" ]; then
  print_error "Undefined LaTeX Command" "$(echo "$UNDEF" | head -1)"
  echo -e "  ${GRAY}  → A LaTeX command doesn't exist or package is missing${NC}"
  CATEGORIZED=1
fi

# ── 3. Missing LaTeX package ─────────────────────────────────────────────────
MISSING_PKG=$(echo "$LOG" | grep -o "File '.*\.sty' not found\|Package .* not found" | head -3)
if [ -n "$MISSING_PKG" ]; then
  PKG=$(echo "$MISSING_PKG" | grep -o "'[^']*'" | head -1)
  print_error "Missing LaTeX Package" "$MISSING_PKG"
  echo -e "  ${GRAY}  → Install with: sudo tlmgr install ${PKG//\'/}${NC}"
  CATEGORIZED=1
fi

# ── 4. Missing image / file ──────────────────────────────────────────────────
MISSING_FILE=$(echo "$LOG" | grep -o "File '.*' not found\|cannot find image\|No such file" | head -3)
if [ -n "$MISSING_FILE" ]; then
  print_error "Missing File / Image" "$MISSING_FILE"
  echo -e "  ${GRAY}  → Check that all images exist in the img/ folder${NC}"
  CATEGORIZED=1
fi

# ── 5. Pandoc conversion error ───────────────────────────────────────────────
if echo "$LOG" | grep -qi "pandoc\|Error at.*line\|parse error"; then
  PANDOC_ERR=$(echo "$LOG" | grep -i "pandoc\|Error at\|parse error" | head -3)
  print_error "Pandoc Conversion Error" "$(echo "$PANDOC_ERR" | head -1)"
  echo -e "  ${GRAY}  → Usually bad Markdown syntax or invalid template variable${NC}"
  CATEGORIZED=1
fi

# ── 6. LaTeX runaway / extra } ───────────────────────────────────────────────
if echo "$LOG" | grep -qi "runaway argument\|extra }\|lonely \\\\\|mismatched"; then
  print_error "LaTeX Syntax Error" "Runaway argument or mismatched braces/brackets"
  echo -e "  ${GRAY}  → Check for unclosed { } or [ ] in your markdown${NC}"
  CATEGORIZED=1
fi

# ── 7. Font not found (XeLaTeX) ──────────────────────────────────────────────
FONT_ERR=$(echo "$LOG" | grep -i "font.*not found\|cannot find font\|fontspec error" | head -2)
if [ -n "$FONT_ERR" ]; then
  print_error "Font Not Found (XeLaTeX)" "$(echo "$FONT_ERR" | head -1)"
  echo -e "  ${GRAY}  → Install the font or switch engine to pdflatex${NC}"
  CATEGORIZED=1
fi

# ── 8. Generic: extract ! Error lines from LaTeX log ─────────────────────────
LATEX_ERRS=$(echo "$LOG" | grep "^!" | head -5)
if [ -n "$LATEX_ERRS" ]; then
  echo -e "  ${RED}▸ LaTeX Errors${NC}"
  while IFS= read -r line; do
    echo -e "  ${YELLOW}  $line${NC}"
  done <<< "$LATEX_ERRS"
  echo ""
  CATEGORIZED=1
fi

# ── Full log ──────────────────────────────────────────────────────────────────
if [ "$CATEGORIZED" -eq 0 ]; then
  echo -e "  ${YELLOW}No specific error pattern detected. Full log:${NC}"
  echo ""
fi

echo -e "  ${GRAY}── Full Log ──────────────────────────────────────────────${NC}"
echo ""
echo "$LOG" | while IFS= read -r line; do
  # Highlight error lines in red, warnings in yellow
  if echo "$line" | grep -q "^!"; then
    echo -e "  ${RED}$line${NC}"
  elif echo "$line" | grep -qi "warning\|warn"; then
    echo -e "  ${YELLOW}$line${NC}"
  elif echo "$line" | grep -qi "error"; then
    echo -e "  ${RED}$line${NC}"
  else
    echo -e "  ${GRAY}$line${NC}"
  fi
done

echo ""
echo -e "  ${GRAY}─────────────────────────────────────────────────────────${NC}"
echo ""
exit 1
