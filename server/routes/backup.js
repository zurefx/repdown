// server/routes/backup.js
// Endpoint: POST /api/projects/backup
// Zips every project folder into its own .zip, then bundles all into one master .zip

const express  = require('express');
const router   = express.Router();
const path     = require('path');
const fs       = require('fs');
const archiver = require('archiver');

// Projects live at  <repo-root>/projects/<uuid>/
const PROJECTS_DIR = path.resolve(__dirname, '../../projects');

/**
 * POST /api/projects/backup
 * Streams a ZIP that contains one ZIP per project:
 *   repdown-backup-YYYYMMDD.zip
 *     ├── My Report (abc123).zip
 *     ├── OSCP Report (def456).zip
 *     └── …
 */
router.post('/backup', async (req, res) => {
  try {
    // ── 1. Discover project folders ──────────────────────────────────────
    if (!fs.existsSync(PROJECTS_DIR)) {
      return res.status(404).json({ error: 'Projects directory not found' });
    }

    const entries = fs.readdirSync(PROJECTS_DIR, { withFileTypes: true });
    const projectDirs = entries
      .filter(e => e.isDirectory())
      .map(e => e.name);

    if (projectDirs.length === 0) {
      return res.status(404).json({ error: 'No projects found' });
    }

    // ── 2. Build date stamp for filename ─────────────────────────────────
    const now  = new Date();
    const yyyy = now.getFullYear();
    const mm   = String(now.getMonth() + 1).padStart(2, '0');
    const dd   = String(now.getDate()).padStart(2, '0');
    const filename = `repdown-backup-${yyyy}${mm}${dd}.zip`;

    // ── 3. Stream the master ZIP directly to the response ────────────────
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const master = archiver('zip', { zlib: { level: 6 } });
    master.on('error', err => {
      console.error('[backup] archiver error:', err);
      // Headers already sent — nothing we can do but end the stream
      res.end();
    });
    master.pipe(res);

    // ── 4. For each project, create an in-memory sub-ZIP and append it ───
    for (const id of projectDirs) {
      const projPath = path.join(PROJECTS_DIR, id);

      // Try to read a human-friendly name from template.json or report.md
      let projName = id;
      const tplFile = path.join(projPath, 'template.json');
      if (fs.existsSync(tplFile)) {
        try {
          const tpl = JSON.parse(fs.readFileSync(tplFile, 'utf8'));
          if (tpl.name) projName = tpl.name;
        } catch (_) { /* keep uuid */ }
      }

      // Sanitise name for use as a zip entry filename
      const safeName = projName.replace(/[/\\:*?"<>|]/g, '_').trim() || id;
      const subZipName = `${safeName} (${id.slice(0, 8)}).zip`;

      // Build the sub-zip in memory as a Buffer
      const subZipBuffer = await buildSubZip(projPath);

      // Append the buffer as a file entry in the master zip
      master.append(subZipBuffer, { name: subZipName });
    }

    // ── 5. Finalise and let archiver flush + close the response ──────────
    await master.finalize();

  } catch (err) {
    console.error('[backup] unexpected error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || 'Backup failed' });
    }
  }
});

/**
 * Recursively zips a project directory into a Buffer.
 * @param {string} dirPath  Absolute path to the project folder
 * @returns {Promise<Buffer>}
 */
function buildSubZip(dirPath) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const archive = archiver('zip', { zlib: { level: 6 } });

    archive.on('error', reject);
    archive.on('data',  chunk  => chunks.push(chunk));
    archive.on('end',   ()     => resolve(Buffer.concat(chunks)));

    // Add the entire project directory (files + sub-folders) at root level
    archive.directory(dirPath, false);
    archive.finalize();
  });
}

module.exports = router;
