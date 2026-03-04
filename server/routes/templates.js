const express = require('express');
const router  = express.Router();
const fs      = require('fs');
const path    = require('path');

const TEMPLATES_DIR = path.join(__dirname, '../../templates');

router.get('/', (req, res) => {
  if (!fs.existsSync(TEMPLATES_DIR)) return res.json([]);
  const dirs = fs.readdirSync(TEMPLATES_DIR).filter(d => {
    return fs.statSync(path.join(TEMPLATES_DIR, d)).isDirectory();
  });
  const templates = dirs.map(d => {
    const jsonPath = path.join(TEMPLATES_DIR, d, 'template.json');
    let meta = { name: d, description: '', engine: 'xelatex', tags: [] };
    if (fs.existsSync(jsonPath)) {
      try { meta = { ...meta, ...JSON.parse(fs.readFileSync(jsonPath, 'utf8')) }; } catch {}
    }
    return { id: d, ...meta };
  });
  res.json(templates);
});

module.exports = router;
