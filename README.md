# MarkdownPDF Studio

> Professional Markdown → PDF generator (Pandoc + XeLaTeX) with a local web interface.

```
Markdown → Pandoc → XeLaTeX → PDF
```

## Features

- **Multi-user** real-time collaboration via Socket.io
- **6 templates**: OSCP Purple, RedTeam Dark, Corporate Blue, Minimalist, Thesis, OSINT
- **Interactive Markdown toolbar**: Bold, Italic, Headings, Lists, Tables, Code blocks, Links, Images
- **Table builder** with drag-to-select grid
- **Insert menu** with OSCP snippets (findings, nmap blocks, credentials tables)
- **PDF preview** with zoom controls
- **File tree** with drag-and-drop, context menu
- **Compile log** with real-time output
- **Multi-tab editor** with syntax highlighting
- **Auto-save** 1.2s after typing
- **Chat panel** per project
- `run.sh` CLI compile tool (lives outside /projects)
- **SQLite** project database

## Setup

```bash
./build.sh
npm start
# → http://localhost:3000
```

## Structure

```
markdownpdf-studio/
├── server/
│   ├── index.js          # Express + Socket.io
│   ├── database.js       # SQLite (better-sqlite3)
│   ├── routes/
│   │   ├── projects.js   # CRUD + import
│   │   ├── files.js      # Tree, read, write, upload, export
│   │   ├── compile.js    # Pandoc runner
│   │   └── templates.js  # Template list
│   └── socket/
│       └── collaboration.js  # Real-time sync
├── public/
│   ├── index.html        # Dashboard
│   └── editor.html       # Editor
├── templates/
│   ├── oscp-purple/
│   ├── redteam-dark/
│   ├── corporate-blue/
│   ├── minimalist/
│   ├── thesis-style/
│   └── osint-report/
├── projects/             # User projects (auto-generated)
├── run.sh                # CLI compile (OUTSIDE projects)
├── build.sh              # Setup
└── package.json
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Enter` | Compile |
| `Ctrl+S` | Save |
| `Ctrl+B` | Bold |
| `Ctrl+I` | Italic |

## Templates

Each template lives in `/templates/<name>/` and contains:
- `template.tex` — LaTeX template for pandoc
- `template.json` — metadata (name, description, tags, engine)
- `report.md` — starter document
- `lua/` — Lua filters
- `img/` — template assets

## CLI Usage

```bash
# Compile a specific project
./run.sh <project-uuid> xelatex

# List projects
curl http://localhost:3000/api/projects | python3 -m json.tool
```
