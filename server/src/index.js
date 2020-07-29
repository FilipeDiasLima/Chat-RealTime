const express = require('express');
const socketio = require('socket.io');
const http = require('http');
const cors = require('cors');

const { addUser, getUser, getUsersInRoom, removeUser } = require('./users');

const PORT = 3333;
const router = require('./routes')

const app = express();
const server = http.createServer(app);
const io = socketio(server);

io.on('connection', (socket) => {
  socket.on('join', ({ name, room }, cb) => {
    const { error, user } = addUser({ id: socket.id, name, room });

    if (error) return cb(error);

    socket.emit('message', { user: 'bot', text: `${user.name}, welcome to the room ${user.room}` });
    socket.broadcast.to(user.room).emit('message', { user: 'bot', text: `${user.name} has joined!` });

    socket.join(user.room);

    io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) })

    cb();
  });

  socket.on('sendMessage', (message, cb) => {
    const user = getUser(socket.id);

    io.to(user.room).emit('message', { user: user.name, text: message });
    io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) });

    cb();
  })

  socket.on('disconnect', () => {
    const user = removeUser(socket.id);

    if (user) {
      io.to(user.room).emit('message', { user: 'bot', text: `${user.name} has left.` })
    }
  })
});

app.use(router);
app.use(cors());

server.listen(PORT, () => console.log(`Server has started on port ${PORT}`));