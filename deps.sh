#!/bin/bash
# RepDown — Dependency Installer
# Supports: Debian/Ubuntu/Kali · Arch/Manjaro · Fedora/RHEL/CentOS

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; GRAY='\033[0;90m'; BOLD='\033[1m'; NC='\033[0m'

ok()   { echo -e "  ${GREEN}✓${NC} $1"; }
warn() { echo -e "  ${YELLOW}⚠${NC} $1"; }
err()  { echo -e "  ${RED}✗${NC} $1"; }
info() { echo -e "  ${CYAN}→${NC} $1"; }

echo ""
echo -e "  ${BOLD}Rep${CYAN}Down${NC}${BOLD} — Dependency Installer${NC}"
echo -e "  ${GRAY}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# ── Detect distro ─────────────────────────────────────────────────────────────
if [ -f /etc/os-release ]; then
  . /etc/os-release
  DISTRO_ID="${ID,,}"
  DISTRO_LIKE="${ID_LIKE,,}"
else
  err "Cannot detect distro — /etc/os-release not found"
  exit 1
fi

detect_family() {
  case "$DISTRO_ID" in
    debian|ubuntu|kali|mint|pop|elementary|zorin|raspbian|parrot) echo "debian" ;;
    arch|manjaro|endeavouros|garuda|artix) echo "arch" ;;
    fedora|rhel|centos|rocky|alma|ol) echo "fedora" ;;
    *) 
      case "$DISTRO_LIKE" in
        *debian*|*ubuntu*) echo "debian" ;;
        *arch*)            echo "arch"   ;;
        *fedora*|*rhel*)   echo "fedora" ;;
        *)                 echo "unknown" ;;
      esac
    ;;
  esac
}

FAMILY=$(detect_family)

echo -e "  ${GRAY}Detected:${NC} $PRETTY_NAME"
echo -e "  ${GRAY}Family  :${NC} $FAMILY"
echo ""

if [ "$FAMILY" = "unknown" ]; then
  warn "Unknown distro family — see manual install section below"
fi

# ── Install functions ─────────────────────────────────────────────────────────

install_debian() {
  info "Updating package list..."
  sudo apt update -qq

  info "Installing system packages..."
  sudo apt install -y \
    curl \
    unzip \
    git \
    pandoc \
    texlive-xetex \
    texlive-latex-extra \
    texlive-fonts-recommended \
    texlive-fonts-extra \
    texlive-lang-spanish \
    wkhtmltopdf

  info "Installing Node.js (via NodeSource)..."
  if ! command -v node &>/dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
  else
    ok "Node.js already installed: $(node -v)"
  fi
}

install_arch() {
  info "Updating package list..."
  sudo pacman -Sy --noconfirm

  info "Installing system packages..."
  sudo pacman -S --noconfirm \
    curl \
    unzip \
    git \
    pandoc \
    texlive-xetex \
    texlive-latexextra \
    texlive-fontsrecommended \
    texlive-fontsextra \
    wkhtmltopdf \
    nodejs \
    npm

  # AUR helper check for wkhtmltopdf if not in repos
  if ! command -v wkhtmltopdf &>/dev/null; then
    warn "wkhtmltopdf not found in repos — try: yay -S wkhtmltopdf-static"
  fi
}

install_fedora() {
  info "Installing system packages..."

  # Detect dnf vs yum
  PKG_MGR="dnf"
  command -v dnf &>/dev/null || PKG_MGR="yum"

  sudo $PKG_MGR install -y \
    curl \
    unzip \
    git \
    pandoc \
    texlive-xetex \
    texlive-collection-latexextra \
    texlive-collection-fontsrecommended \
    texlive-collection-fontsextra

  info "Installing Node.js (via NodeSource)..."
  if ! command -v node &>/dev/null; then
    curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
    sudo $PKG_MGR install -y nodejs
  else
    ok "Node.js already installed: $(node -v)"
  fi

  # wkhtmltopdf on Fedora needs manual install
  if ! command -v wkhtmltopdf &>/dev/null; then
    warn "wkhtmltopdf not in default repos"
    info "Download from: https://wkhtmltopdf.org/downloads.html"
    info "Or: sudo dnf install wkhtmltopdf (if available in your version)"
  fi
}

# ── Run installer ─────────────────────────────────────────────────────────────
case "$FAMILY" in
  debian) install_debian ;;
  arch)   install_arch   ;;
  fedora) install_fedora ;;
  *)
    echo ""
    echo -e "  ${YELLOW}Manual install — required packages:${NC}"
    echo ""
    echo -e "  ${GRAY}  • curl${NC}"
    echo -e "  ${GRAY}  • unzip${NC}"
    echo -e "  ${GRAY}  • git${NC}"
    echo -e "  ${GRAY}  • pandoc${NC}"
    echo -e "  ${GRAY}  • texlive-xetex  (or full texlive)${NC}"
    echo -e "  ${GRAY}  • texlive-latex-extra${NC}"
    echo -e "  ${GRAY}  • texlive-fonts-recommended${NC}"
    echo -e "  ${GRAY}  • texlive-fonts-extra${NC}"
    echo -e "  ${GRAY}  • wkhtmltopdf${NC}"
    echo -e "  ${GRAY}  • Node.js 18+  →  https://nodejs.org${NC}"
    echo ""
    exit 0
    ;;
esac

# ── Verify ────────────────────────────────────────────────────────────────────
echo ""
info "Verifying installations..."
echo ""

check() {
  local name="$1" cmd="$2"
  if command -v $cmd &>/dev/null; then
    ok "$name — $($cmd --version 2>&1 | head -1)"
  else
    err "$name — NOT FOUND"
  fi
}

check "Node.js"      "node"
check "npm"          "npm"
check "pandoc"       "pandoc"
check "xelatex"      "xelatex"
check "wkhtmltopdf"  "wkhtmltopdf"
check "unzip"        "unzip"
check "curl"         "curl"
check "git"          "git"

echo ""
echo -e "  ${GREEN}${BOLD}✓ Done!${NC} Now run:"
echo ""
echo -e "  ${CYAN}  ./build.sh${NC}"
echo ""
