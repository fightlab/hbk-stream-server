const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);

io.on('connection', socket => {
  console.log('a user connected');
  
  socket.on('scoreboard-update', scoreboard => {
    io.emit('scoreboard', scoreboard)
  })
  
    
  socket.on('camera-update', camera => {
    io.emit('camera', camera)
  })
});

setInterval(() => io.emit('date', new Date().getTime()), 1000)

http.listen(process.env.PORT || 3000, () => {
  console.log('listening on *:3000');
});