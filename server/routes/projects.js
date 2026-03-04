const express  = require('express');
const router   = express.Router();
const { v4: uuidv4 } = require('uuid');
const fs       = require('fs');
const path     = require('path');
const os       = require('os');
const multer   = require('multer');
const { execFile } = require('child_process');
const db       = require('../database');

const PROJECTS_DIR  = path.join(__dirname, '../../projects');
const TEMPLATES_DIR = path.join(__dirname, '../../templates');
const upload = multer({ dest: os.tmpdir(), limits: { fileSize: 500 * 1024 * 1024 } });

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  if (!fs.existsSync(src))  return;
  for (const f of fs.readdirSync(src)) {
    const s = path.join(src, f), d = path.join(dest, f);
    fs.statSync(s).isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d);
  }
}
function safeMkdir(d) { fs.mkdirSync(d, { recursive: true }); }

// Promisified execFile
function run(cmd, args) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) reject(new Error(stderr || err.message));
      else resolve(stdout);
    });
  });
}

// ── GET all ───────────────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM projects ORDER BY updated_at DESC').all();
  res.json(rows.map(p => ({ ...p, tags: JSON.parse(p.tags||'[]'), lastModified: new Date(p.updated_at*1000).toISOString() })));
});

// ── GET one ───────────────────────────────────────────────────────────────────
router.get('/:id', (req, res) => {
  const p = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!p) return res.status(404).json({ error: 'Not found' });
  res.json({ ...p, tags: JSON.parse(p.tags||'[]'), lastModified: new Date(p.updated_at*1000).toISOString() });
});

// ── POST create ───────────────────────────────────────────────────────────────
router.post('/', (req, res) => {
  const { name, template = 'oscp-purple', owner = 'anonymous' } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const id = uuidv4(), projDir = path.join(PROJECTS_DIR, id), tplDir = path.join(TEMPLATES_DIR, template);
  safeMkdir(projDir); safeMkdir(path.join(projDir,'.output')); safeMkdir(path.join(projDir,'img'));
  safeMkdir(path.join(projDir,'lua')); safeMkdir(path.join(projDir,'config'));
  if (fs.existsSync(tplDir)) copyDir(tplDir, projDir);
  else fs.writeFileSync(path.join(projDir,'report.md'), `# ${name}\n\n## Introduction\n\nStart writing your report here.\n`);
  fs.writeFileSync(path.join(projDir,'config','project.json'), JSON.stringify({ id, name, template, owner, created: new Date().toISOString() }, null, 2));
  db.prepare('INSERT INTO projects (id, name, template, owner) VALUES (?, ?, ?, ?)').run(id, name, template, owner);
  res.json({ id, name, template });
});

// ── POST import ZIP ───────────────────────────────────────────────────────────
router.post('/import', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const tmpPath  = req.file.path;
  const id       = uuidv4();
  const stageDir = path.join(os.tmpdir(), 'rd-' + id);
  const projDir  = path.join(PROJECTS_DIR, id);

  try {
    safeMkdir(stageDir);

    // ── Use system unzip — fastest possible, handles any zip ─────────────
    // -q = quiet, -o = overwrite without asking
    await run('unzip', ['-q', '-o', tmpPath, '-d', stageDir]);

    // ── Strip single wrapper folder if present ────────────────────────────
    let srcRoot = stageDir;
    const top = fs.readdirSync(stageDir).filter(f => !f.startsWith('.'));
    if (top.length === 1) {
      const only = path.join(stageDir, top[0]);
      if (fs.statSync(only).isDirectory()) srcRoot = only;
    }

    // ── Read metadata ─────────────────────────────────────────────────────
    let projName = (req.body.name || '').trim();
    let template = 'default';
    for (const f of ['template.json', 'config/project.json']) {
      const fp = path.join(srcRoot, f);
      if (fs.existsSync(fp)) {
        try {
          const o = JSON.parse(fs.readFileSync(fp, 'utf8'));
          if (!projName && o.name)                  projName = o.name;
          if (o.template && template === 'default')  template = o.template;
        } catch (_) {}
      }
    }
    if (!projName) projName = path.basename(req.file.originalname || 'imported', '.zip');

    // ── Move into projects dir (cp+rm works cross-device) ────────────────
    await run('cp', ['-r', srcRoot, projDir]);
    fs.rmSync(stageDir, { recursive: true, force: true });
    safeMkdir(path.join(projDir, '.output'));
    safeMkdir(path.join(projDir, 'img'));
    safeMkdir(path.join(projDir, 'lua'));
    safeMkdir(path.join(projDir, 'config'));

    // ── Write project.json + register DB ─────────────────────────────────
    const owner = (req.body.owner || 'anonymous').trim();
    fs.writeFileSync(
      path.join(projDir, 'config', 'project.json'),
      JSON.stringify({ id, name: projName, template, owner, created: new Date().toISOString() }, null, 2)
    );
    db.prepare('INSERT INTO projects (id, name, template, owner) VALUES (?, ?, ?, ?)').run(id, projName, template, owner);

    res.json({ id, name: projName, template });

  } catch (err) {
    console.error('[import]', err.message);
    try { fs.rmSync(projDir,  { recursive: true, force: true }); } catch (_) {}
    try { fs.rmSync(stageDir, { recursive: true, force: true }); } catch (_) {}
    if (!res.headersSent) res.status(500).json({ error: err.message || 'Import failed' });
  } finally {
    fs.unlink(tmpPath, () => {});
    // cleanup stage wrapper if rename left it
    try { fs.rmSync(stageDir, { recursive: true, force: true }); } catch (_) {}
  }
});

// ── PATCH ─────────────────────────────────────────────────────────────────────
router.patch('/:id', (req, res) => {
  const { name, tags } = req.body;
  const p = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!p) return res.status(404).json({ error: 'Not found' });
  if (name) db.prepare('UPDATE projects SET name=?,updated_at=unixepoch() WHERE id=?').run(name, req.params.id);
  if (tags) db.prepare('UPDATE projects SET tags=?,updated_at=unixepoch() WHERE id=?').run(JSON.stringify(tags), req.params.id);
  res.json({ ok: true });
});

// ── DELETE ────────────────────────────────────────────────────────────────────
router.delete('/:id', (req, res) => {
  const p = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!p) return res.status(404).json({ error: 'Not found' });
  const projDir = path.join(PROJECTS_DIR, req.params.id);
  if (fs.existsSync(projDir)) fs.rmSync(projDir, { recursive: true, force: true });
  db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
