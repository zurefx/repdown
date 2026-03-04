const express = require('express');
const router  = express.Router();
const { execFile } = require('child_process');
const fs   = require('fs');
const path = require('path');
const db   = require('../database');

const PROJECTS_DIR = path.join(__dirname, '../../projects');

function runPandoc(projDir, engine, mainFile) {
  return new Promise((resolve) => {
    const outputDir = path.join(projDir, '.output');
    fs.mkdirSync(outputDir, { recursive: true });

    const mdFile   = path.join(projDir, mainFile || 'report.md');
    const tplFile  = path.join(projDir, 'template.tex');
    const pdfOut   = path.join(outputDir, 'report.pdf');

    if (!fs.existsSync(mdFile)) {
      return resolve({ success: false, log: `Error: ${mainFile || 'report.md'} not found in project` });
    }

    const args = [
      mdFile,
      '--pdf-engine=' + (engine || 'xelatex'),
      '-o', pdfOut,
      '--resource-path=' + projDir,
    ];

    // Add template if exists
    if (fs.existsSync(tplFile)) {
      args.push('--template=' + tplFile);
    }

    // Add lua filters
    const luaDir = path.join(projDir, 'lua');
    if (fs.existsSync(luaDir)) {
      fs.readdirSync(luaDir).filter(f => f.endsWith('.lua')).forEach(f => {
        args.push('--lua-filter=' + path.join(luaDir, f));
      });
    }

    // Add config yaml if exists
    const yamlConf = path.join(projDir, 'config', 'pandoc.yaml');
    if (fs.existsSync(yamlConf)) {
      args.push('--defaults=' + yamlConf);
    }

    args.push('--toc', '-V', 'geometry:margin=2.5cm');

    const start = Date.now();
    execFile('pandoc', args, { cwd: projDir, timeout: 120000 }, (err, stdout, stderr) => {
      const duration = Date.now() - start;
      const log = (stdout || '') + (stderr || '') || (err ? err.message : 'Compiled successfully');
      const success = !err && fs.existsSync(pdfOut);
      resolve({ success, log, duration });
    });
  });
}

// POST compile
router.post('/:id', async (req, res) => {
  const { engine = 'xelatex', mainFile = 'report.md' } = req.body;
  const projDir = path.join(PROJECTS_DIR, req.params.id);

  if (!fs.existsSync(projDir)) return res.status(404).json({ error: 'Project not found' });

  try {
    const result = await runPandoc(projDir, engine, mainFile);
    db.prepare('INSERT INTO compile_logs (project_id, success, log, duration_ms, engine) VALUES (?, ?, ?, ?, ?)').run(
      req.params.id, result.success ? 1 : 0, result.log, result.duration, engine
    );
    if (result.success) {
      db.prepare('UPDATE projects SET updated_at = unixepoch() WHERE id = ?').run(req.params.id);
    }
    res.json(result);
  } catch (e) {
    res.json({ success: false, log: e.message });
  }
});

// GET compiled PDF
router.get('/:id/pdf', (req, res) => {
  const pdfPath = path.join(PROJECTS_DIR, req.params.id, '.output', 'report.pdf');
  if (!fs.existsSync(pdfPath)) return res.status(404).send('No PDF yet');
  res.sendFile(pdfPath);
});

// GET compile logs
router.get('/:id/logs', (req, res) => {
  const logs = db.prepare('SELECT * FROM compile_logs WHERE project_id = ? ORDER BY created_at DESC LIMIT 20').all(req.params.id);
  res.json(logs);
});

module.exports = router;
