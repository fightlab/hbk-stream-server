const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);

io.on('connection', socket => {
  console.log('a user connected');
});

setInterval(() => io.emit('date', new Date().getTime()), 1000)

http.listen(process.env.PORT || 3000, () => {
  console.log('listening on *:3000');
});