#!/bin/bash
# RepDown — Build & Launch Script
# Installs deps if needed, then starts the server

set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; GRAY='\033[0;90m'; BOLD='\033[1m'; NC='\033[0m'

ok()   { echo -e "  ${GREEN}✓${NC} $1"; }
warn() { echo -e "  ${YELLOW}⚠${NC} $1"; }
err()  { echo -e "  ${RED}✗${NC} $1"; }
info() { echo -e "  ${CYAN}→${NC} $1"; }

echo ""
echo -e "  ${BOLD}Rep${CYAN}Down${NC}${BOLD} — Build & Launch${NC}"
echo -e "  ${GRAY}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# ── CHECK DEPENDENCIES ────────────────────────────────────────────────────────
info "Checking dependencies..."
echo ""

if command -v node &>/dev/null; then
  ok "Node.js $(node -v)"
else
  err "Node.js not found — install: https://nodejs.org"
  exit 1
fi

if command -v npm &>/dev/null; then
  ok "npm $(npm -v)"
else
  err "npm not found"
  exit 1
fi

if command -v pandoc &>/dev/null; then
  ok "pandoc $(pandoc --version | head -1 | cut -d' ' -f2)"
else
  warn "pandoc not found — install: sudo apt install pandoc"
fi

if command -v xelatex &>/dev/null; then
  ok "xelatex found"
elif command -v pdflatex &>/dev/null; then
  warn "xelatex not found, pdflatex available — install xelatex: sudo apt install texlive-xetex"
else
  warn "No LaTeX engine found — install: sudo apt install texlive-xetex texlive-fonts-recommended"
fi

if command -v unzip &>/dev/null; then
  ok "unzip found"
else
  warn "unzip not found — install: sudo apt install unzip"
fi

echo ""

# ── CREATE DIRECTORIES ────────────────────────────────────────────────────────
info "Creating directory structure..."
mkdir -p projects data templates
for tpl in oscp-purple redteam-dark corporate-blue minimalist thesis-style osint-report; do
  mkdir -p "templates/$tpl"/{img,lua,config}
done
ok "Directories ready"
echo ""

# ── INSTALL NPM DEPS ──────────────────────────────────────────────────────────
if [ -d "node_modules" ]; then
  ok "node_modules already installed — skipping"
else
  info "Installing Node.js dependencies..."
  npm install --silent
  ok "Dependencies installed"
fi
echo ""

# ── CHECK IF ALREADY RUNNING ──────────────────────────────────────────────────
PORT=${REPDOWN_PORT:-3000}
BASE="http://localhost:$PORT"

if curl -s --max-time 2 "$BASE/api/projects" >/dev/null 2>&1; then
  echo -e "  ${GREEN}✓ RepDown already running on port $PORT${NC}"
  echo ""
  echo -e "  ${GRAY}  Open: ${NC}http://localhost:$PORT"
  echo ""
  exit 0
fi

# ── START SERVER ──────────────────────────────────────────────────────────────
echo -e "  ${CYAN}→${NC} Starting RepDown on port ${BOLD}$PORT${NC}..."
echo ""

# Trap Ctrl+C to show a clean exit message
trap 'echo ""; echo -e "  ${YELLOW}⚠ RepDown stopped${NC}"; echo ""; exit 0' INT TERM

# Run in foreground so logs are visible and Ctrl+C works naturally
node server/index.js
