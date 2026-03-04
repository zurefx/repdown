<div align="center">

<img src="public/image.png" alt="RepDown Logo" width="80"/>

# RepDown

**A collaborative Markdown → PDF report editor built for security professionals**

[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Linux-FCC624?style=flat-square&logo=linux&logoColor=black)](https://kernel.org)

*Write your pentest reports in Markdown. Compile to professional PDF with XeLaTeX, pdfLaTeX or wkhtmltopdf. Collaborate in real-time.*

---

<img src="img/screenshot-dashboard.png" alt="RepDown Dashboard" width="80%"/>

</div>

---

## ✨ Features

- **Markdown-first editor** — write in clean Markdown with live syntax highlighting
- **Multi-engine PDF compilation** — XeLaTeX · pdfLaTeX · LuaLaTeX · wkhtmltopdf
- **Real-time collaboration** — multiple operators edit the same report simultaneously via WebSocket
- **Project management** — dashboard with search, tags, templates and stats
- **ZIP import/export** — portable project archives, bulk backup of all projects
- **Smart error reporting** — YAML frontmatter validation, LaTeX error parsing with actionable hints
- **6 built-in templates** — OSCP, Red Team, Corporate Blue, Minimalist, Thesis, OSINT
- **No cloud, no account** — runs entirely on your local machine

---

## 📸 Screenshots

<table>
  <tr>
    <td align="center">
      <img src="img/screenshot-dashboard.png" alt="Dashboard" width="100%"/>
      <sub>Project Dashboard</sub>
    </td>
    <td align="center">
      <img src="img/screenshot-editor.png" alt="Editor" width="100%"/>
      <sub>Markdown Editor</sub>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="img/screenshot-pdf.png" alt="PDF Preview" width="100%"/>
      <sub>Live PDF Preview</sub>
    </td>
    <td align="center">
      <img src="img/screenshot-templates.png" alt="Templates" width="100%"/>
      <sub>Template Gallery</sub>
    </td>
  </tr>
</table>

---

## 🗂 Project Structure

```
repdown/
├── server/
│   ├── index.js              # Express + Socket.io entry point
│   ├── database.js           # SQLite via better-sqlite3
│   └── routes/
│       ├── projects.js       # CRUD + ZIP import
│       ├── files.js          # File read/write per project
│       ├── compile.js        # pandoc + LaTeX pipeline
│       ├── templates.js      # Template discovery
│       └── backup.js         # Bulk ZIP backup
├── public/
│   ├── index.html            # Dashboard SPA
│   ├── editor.html           # Editor SPA
│   ├── styles.css            # Shared dark theme
│   └── image.png             # App logo
├── templates/                # Built-in report templates
│   ├── oscp-purple/
│   ├── redteam-dark/
│   ├── corporate-blue/
│   ├── minimalist/
│   ├── thesis-style/
│   └── osint-report/
├── projects/                 # Created at runtime (gitignored)
├── data/                     # SQLite DB (gitignored)
├── build.sh                  # Install + launch script
├── run.sh                    # CLI compile runner
└── deps.sh                   # System dependency installer
```

---

## ⚡ Quick Start

### 1 — Clone the repository

```bash
git clone https://github.com/zurefx/repdown.git
cd repdown
```

### 2 — Install system dependencies

Run the auto-detect installer — it detects your distro and installs everything needed:

```bash
chmod +x deps.sh
./deps.sh
```

<details>
<summary>Manual install by distro</summary>

**Debian / Ubuntu / Kali / Parrot**
```bash
sudo apt update
sudo apt install -y curl unzip git pandoc \
  texlive-xetex texlive-latex-extra \
  texlive-fonts-recommended texlive-fonts-extra \
  wkhtmltopdf
# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

**Arch / Manjaro / EndeavourOS**
```bash
sudo pacman -S --noconfirm curl unzip git pandoc \
  texlive-xetex texlive-latexextra \
  texlive-fontsrecommended nodejs npm
# wkhtmltopdf via AUR
yay -S wkhtmltopdf-static
```

**Fedora / RHEL / Rocky / Alma**
```bash
sudo dnf install -y curl unzip git pandoc \
  texlive-xetex texlive-collection-latexextra \
  texlive-collection-fontsrecommended
# Node.js 20
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs
```

</details>

### 3 — Build and launch

```bash
chmod +x build.sh
./build.sh
```

This single command:
- Verifies all dependencies
- Runs `npm install` (only if `node_modules` is missing)
- Creates required directories
- Starts the RepDown server

### 4 — Open in browser

```
http://localhost:3000
```

> Port can be overridden: `REPDOWN_PORT=8080 ./build.sh`

---

## 🖊 Editor Keybindings

### Text Formatting

| Action | Shortcut |
|---|---|
| Bold | `Ctrl+B` |
| Italic | `Ctrl+I` |
| Strikethrough | `Ctrl+D` |
| Inline Code | `Ctrl+\`` |
| Code Block | `Ctrl+Shift+\`` |
| Link | `Ctrl+K` |

### Structure

| Action | Shortcut |
|---|---|
| Heading 1 | `Ctrl+1` |
| Heading 2 | `Ctrl+2` |
| Heading 3 | `Ctrl+3` |
| Bullet List | `Ctrl+U` |
| Numbered List | `Ctrl+O` |
| Blockquote | `Ctrl+Q` |
| Horizontal Rule | `Ctrl+R` |
| Insert Table | `Ctrl+T` |

### File & Compile

| Action | Shortcut |
|---|---|
| Save | `Ctrl+S` |
| Compile PDF | `Ctrl+Enter` |
| Export ZIP | `Ctrl+Shift+E` |

### Search & Replace

| Action | Shortcut |
|---|---|
| Find (live) | `Ctrl+F` |
| Find & Replace | `Ctrl+H` |
| Next match | `Enter` |
| Previous match | `Shift+Enter` |
| Close search | `Esc` |

### Editor

| Action | Shortcut |
|---|---|
| Undo | `Ctrl+Z` |
| Redo | `Ctrl+Y` |
| Select All | `Ctrl+A` |
| Indent | `Tab` |
| Outdent | `Shift+Tab` |
| Toggle Comment | `Ctrl+/` |

---

## 📄 Report Format

Reports are written in Markdown with a YAML frontmatter block:

```markdown
---
title: "OSCP Penetration Test Report"
author: "Operator"
date: "2025-01-01"
target: "10.10.10.X"
---

# Executive Summary

This document presents the results of a penetration test...

## Scope

| Item | Value |
|------|-------|
| Target IP | 10.10.10.X |
| Engagement | Internal Pentest |
| Duration | 1 day |

## Findings

### Critical — Remote Code Execution

**CVSS Score:** 9.8  
**Affected Host:** 10.10.10.5

![Proof of Concept](img/poc.png)
```

> **Tip:** All images must be placed in the `img/` folder inside your project and referenced as `img/filename.png`

---

## 🗜 Import & Export

### Export a project as ZIP

Click **ZIP** in the editor topbar — downloads the entire project as a portable archive.

### Import a ZIP

From the dashboard, click **Import .zip** and upload any RepDown project archive.

### Backup all projects

Click **Backup All** in the dashboard topbar — downloads a master ZIP containing one ZIP per project:

```
repdown-backup-20250303.zip
  ├── OSCP Report (abc12345).zip
  ├── Red Team Engagement (def67890).zip
  └── ...
```

---

## 🖥 CLI Usage

Compile a project directly from the terminal:

```bash
# Basic usage (XeLaTeX by default)
./run.sh <project-id>

# Specify engine
./run.sh <project-id> pdflatex
./run.sh <project-id> lualatex
./run.sh <project-id> wkhtmltopdf

# List all projects
curl http://localhost:3000/api/projects | python3 -m json.tool
```

The CLI runner automatically:
- Starts the server if it's not already running
- Validates YAML frontmatter before compiling
- Parses LaTeX/pandoc errors and shows actionable hints

**Example error output:**

```
  RepDown — Compile Runner
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ✓ Server already running on port 3000

  Project : d8d3297b-19c7-4ceb-9f5b-607d62d9f8bf
  Engine  : xelatex

  ✗ Compilation failed

  ▸ Missing LaTeX Package
    File 'somepackage.sty' not found
    → Install: sudo tlmgr install somepackage
```

---

## 🎨 Templates

| Template | Description | Best for |
|---|---|---|
| `oscp-purple` | Dark purple header, clean body | OSCP / HTB reports |
| `redteam-dark` | Aggressive dark styling | Red team engagements |
| `corporate-blue` | Professional corporate layout | Client deliverables |
| `minimalist` | Clean, no-frills white | Academic / internal |
| `thesis-style` | Chapter-based long form | Research / thesis |
| `osint-report` | Info-dense, grid layout | OSINT investigations |

<img src="img/screenshot-templates.png" alt="Templates" width="70%"/>

---

## 🔧 Configuration

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `REPDOWN_PORT` | `3000` | HTTP server port |

### Custom Templates

Add a folder to `templates/` with the following structure:

```
templates/my-template/
├── report.md          # starter content
├── template.json      # metadata
├── img/               # template images
├── lua/               # pandoc lua filters
└── config/            # pandoc/LaTeX config
```

`template.json` format:
```json
{
  "id": "my-template",
  "name": "My Template",
  "description": "Short description shown in the UI",
  "tags": ["custom", "pentest"]
}
```

---

## 🏗 Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js + Express |
| Real-time | Socket.io |
| Database | SQLite (better-sqlite3) |
| Editor | CodeMirror 5 |
| PDF pipeline | pandoc + XeLaTeX / pdfLaTeX / LuaLaTeX |
| Archive | archiver + unzipper |
| File upload | multer |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📜 License

MIT © RepDown Contributors

---

<div align="center">
  <sub>Built for operators, by operators.</sub>
</div>
