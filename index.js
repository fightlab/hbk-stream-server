// set up express/socket.io
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);

// in memory data score
const data = {
  scoreboard: {
    p1n: 'Player 1',
    p2n: 'Player 2',
    p1s: 0,
    p2s: 0,
    tl: 'HBK',
    tr: '#00',
    bl: 'Brewdog',
    br: 'Brighton'
  },
  camera: {
    hbk: 'Habrewken #00',
    brewdog: 'Brewdog Brighton',
    fgc: 'Brighton Fighting Game Community',
    date: 'Wednesday Xth MONTH 20XX',
    facebook: 'fightlabbrighton',
    twitter: 'fight_lab',
    web: 'hbk.gg'
  }
}

// init connection
io.on('connection', socket => {
  console.log('a user connected');
  
  socket.on('scoreboard-get', () => {
    socket.emit('scoreboard', data.scoreboard)
  })
  
  socket.on('scoreboard-update', scoreboard => {
    data.scoreboard = scoreboard
    io.emit('scoreboard', scoreboard)
  })
  
  socket.on('camera-get', () => {
    socket.emit('camera', data.camera)
  })

  socket.on('camera-update', camera => {
    data.camera = camera
    io.emit('camera', camera)
  })
});

http.listen(process.env.PORT || 3000, () => {
  console.log('listening on *:3000');
});