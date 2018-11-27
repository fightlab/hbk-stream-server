require('dotenv').config()
// set up express/socket.io
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const challonge = require('challonge');
const { URL } = require('url')
const _ = require('lodash')

const challongeClient = challonge.createClient({
  apiKey: process.env.CHALLONGE_API_KEY
});

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
  },
  curl: '',
  participants: []
}

const getChallongeParticipants = url => new Promise((resolve, reject) => {
  const bracket = new URL(url)
  const subdomain = bracket.hostname.split('.')[0]
  const path = bracket.pathname.replace('/', '')
  
  challongeClient.participants.index({
    id: `${subdomain}-${path}`,
    callback: (err, response) => {
      if (err) {
        return reject(err)
      }

      data.participants = _.map(response, ({ participant }) => ({
        displayName: participant.displayName,
        challongeUsername: participant.challongeUsername
      }))

      return resolve(data.participants)
    }
  })
})

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

  socket.on('participants-get', () => [
    io.emit('participants', { curl: data.curl, participants: data.participants })
  ])

  socket.on('challonge-participants-req', async url => {
    data.curl = url
    socket.emit('challonge-participants-res', await getChallongeParticipants(url))
  })
});

http.listen(process.env.PORT || 3000, () => {
  console.log('listening on *:3000');
});