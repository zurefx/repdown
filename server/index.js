const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const PORT = process.env.PORT || 3000;

// Ensure dirs
['projects', 'templates'].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, '../public')));

// Routes
const projectsRoute = require('./routes/projects');
const filesRoute    = require('./routes/files');
const compileRoute  = require('./routes/compile');
const templatesRoute= require('./routes/templates');
const backupRouter = require('./routes/backup');
app.use('/api/projects', backupRouter);
app.use('/api/projects',  projectsRoute);
app.use('/api/files',     filesRoute);
app.use('/api/compile',   compileRoute);
app.use('/api/templates', templatesRoute);

// Editor page
app.get('/editor', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/editor.html'));
});

// Socket.io collaboration
require('./socket/collaboration')(io);

server.listen(PORT, () => {
  console.log(`\n  RepDown Studio`);
  console.log(`  http://localhost:${PORT}\n`);
});

module.exports = { io };
