const express = require('express');
const router  = express.Router();
const fs      = require('fs');
const path    = require('path');
const multer  = require('multer');
const archiver = require('archiver');

const PROJECTS_DIR = path.join(__dirname, '../../projects');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } });

function projPath(id, ...rest) {
  const p = path.resolve(PROJECTS_DIR, id, ...rest);
  if (!p.startsWith(path.resolve(PROJECTS_DIR, id))) throw new Error('Path traversal blocked');
  return p;
}

function buildTree(dir, baseDir) {
  const nodes = [];
  if (!fs.existsSync(dir)) return nodes;
  const items = fs.readdirSync(dir).sort();
  for (const item of items) {
    if (item.startsWith('.')) continue;
    const full = path.join(dir, item);
    const rel  = path.relative(baseDir, full);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      nodes.push({ name: item, path: rel, type: 'folder', children: buildTree(full, baseDir) });
    } else {
      nodes.push({ name: item, path: rel, type: 'file', size: stat.size });
    }
  }
  return nodes;
}

// GET tree
router.get('/:id/tree', (req, res) => {
  try {
    const dir = projPath(req.params.id);
    res.json(buildTree(dir, dir));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET read file
router.get('/:id/read', (req, res) => {
  try {
    const fp = projPath(req.params.id, req.query.path);
    if (!fs.existsSync(fp)) return res.status(404).json({ error: 'File not found' });
    const content = fs.readFileSync(fp, 'utf8');
    res.json({ content });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST write file
router.post('/:id/write', (req, res) => {
  try {
    const { path: filePath, content } = req.body;
    const fp = projPath(req.params.id, filePath);
    fs.mkdirSync(path.dirname(fp), { recursive: true });
    fs.writeFileSync(fp, content, 'utf8');
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST create file/folder
router.post('/:id/create', (req, res) => {
  try {
    const { path: filePath, type } = req.body;
    const fp = projPath(req.params.id, filePath);
    if (type === 'folder') {
      fs.mkdirSync(fp, { recursive: true });
    } else {
      fs.mkdirSync(path.dirname(fp), { recursive: true });
      if (!fs.existsSync(fp)) fs.writeFileSync(fp, '', 'utf8');
    }
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST rename
router.post('/:id/rename', (req, res) => {
  try {
    const { oldPath, newPath } = req.body;
    const src = projPath(req.params.id, oldPath);
    const dst = projPath(req.params.id, newPath);
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.renameSync(src, dst);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE file
router.delete('/:id/delete', (req, res) => {
  try {
    const fp = projPath(req.params.id, req.query.path);
    if (fs.statSync(fp).isDirectory()) fs.rmSync(fp, { recursive: true });
    else fs.unlinkSync(fp);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST upload files
router.post('/:id/upload', upload.array('files'), (req, res) => {
  try {
    const dest   = req.body.dest || '';
    const relPaths = Array.isArray(req.body.relativePaths) ? req.body.relativePaths : [req.body.relativePaths || ''];
    req.files.forEach((file, i) => {
      const rel = relPaths[i] || file.originalname;
      const fp  = projPath(req.params.id, dest, rel);
      fs.mkdirSync(path.dirname(fp), { recursive: true });
      fs.writeFileSync(fp, file.buffer);
    });
    res.json({ ok: true, count: req.files.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET serve file (images, pdfs)
router.get('/:id/serve', (req, res) => {
  try {
    const fp = projPath(req.params.id, req.query.path);
    if (!fs.existsSync(fp)) return res.status(404).send('Not found');
    res.sendFile(fp);
  } catch (e) { res.status(500).send(e.message); }
});

// GET export zip
router.get('/:id/export/zip', (req, res) => {
  try {
    const dir = projPath(req.params.id);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="project-${req.params.id}.zip"`);
    const archive = archiver('zip');
    archive.pipe(res);
    archive.directory(dir, false);
    archive.finalize();
  } catch (e) { res.status(500).send(e.message); }
});

// GET export pdf
router.get('/:id/export/pdf', (req, res) => {
  try {
    const pdfPath = projPath(req.params.id, '.output', 'report.pdf');
    if (!fs.existsSync(pdfPath)) return res.status(404).send('No PDF compiled yet');
    res.sendFile(pdfPath);
  } catch (e) { res.status(500).send(e.message); }
});

// POST clipboard image
router.post('/:id/clipboard-image', (req, res) => {
  try {
    const { data, filename } = req.body;
    const base64 = data.replace(/^data:image\/\w+;base64,/, '');
    const fp = projPath(req.params.id, 'img', filename);
    fs.mkdirSync(path.dirname(fp), { recursive: true });
    fs.writeFileSync(fp, Buffer.from(base64, 'base64'));
    res.json({ path: `img/${filename}` });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
