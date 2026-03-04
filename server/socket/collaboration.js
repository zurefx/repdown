const USER_COLORS = ['#ff79c6','#8be9fd','#50fa7b','#ffb86c','#bd93f9','#f1fa8c','#ff5555','#6be5fd'];
const rooms = {}; // roomId -> { users: Map<socketId, userInfo>, chat: [] }

module.exports = function(io) {
  io.on('connection', (socket) => {

    socket.on('join-project', ({ projectId, nickname }) => {
      socket.join(projectId);
      if (!rooms[projectId]) rooms[projectId] = { users: new Map(), chat: [] };
      const room = rooms[projectId];
      const color = USER_COLORS[room.users.size % USER_COLORS.length];
      const user = { socketId: socket.id, nickname, color, projectId };
      room.users.set(socket.id, user);

      socket.emit('users-update', [...room.users.values()]);
      socket.to(projectId).emit('users-update', [...room.users.values()]);
      socket.to(projectId).emit('user-joined', user);

      // Send chat history
      socket.emit('chat-history', room.chat.slice(-50));
    });

    socket.on('text-change', ({ projectId, filePath, content }) => {
      socket.to(projectId).emit('text-change', { filePath, content, socketId: socket.id });
    });

    socket.on('cursor-update', ({ projectId, cursor, filePath }) => {
      const room = rooms[projectId];
      if (!room) return;
      const user = room.users.get(socket.id);
      if (!user) return;
      socket.to(projectId).emit('cursor-update', { socketId: socket.id, cursor, filePath, user });
    });

    socket.on('chat-message', ({ projectId, message }) => {
      const room = rooms[projectId];
      if (!room) return;
      const user = room.users.get(socket.id);
      if (!user) return;
      const msg = { nickname: user.nickname, color: user.color, message, timestamp: Date.now() };
      room.chat.push(msg);
      if (room.chat.length > 200) room.chat.shift();
      io.to(projectId).emit('chat-message', msg);
    });

    socket.on('refresh-tree', ({ projectId }) => {
      socket.to(projectId).emit('tree-changed');
    });

    socket.on('disconnecting', () => {
      for (const projectId of socket.rooms) {
        if (rooms[projectId]) {
          const user = rooms[projectId].users.get(socket.id);
          rooms[projectId].users.delete(socket.id);
          if (user) {
            io.to(projectId).emit('user-left', user);
            io.to(projectId).emit('users-update', [...rooms[projectId].users.values()]);
          }
        }
      }
    });
  });
};
