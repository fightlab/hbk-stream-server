require('dotenv').config()
// set up express/socket.io
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const challonge = require('challonge');
const { URL } = require('url')
const axios = require('axios')
const _ = require('lodash')

const challongeClient = challonge.createClient({
  apiKey: process.env.CHALLONGE_API_KEY
});
const smashAPI = `https://api.smash.gg/gql/alpha`
const smashToken = process.env.SMASHGG_API_KEY

const callGraphQL = ({ url = smashAPI, query, variables }) => axios({
  url,
  method: 'post',
  headers: {
    Authorization: `Bearer ${smashToken}`
  },
  data: {
    query,
    variables
  }
})


const getTournament = ({ slug }) => callGraphQL({
  query: `
    query TournamentInformation($tournamentSlug: String!){
      tournament(slug: $tournamentSlug){
        id
        name
        slug
        events {
          id
          name
          slug
        }
      }
    }
  `,
  variables: {
    tournamentSlug: slug
  }
})

const getParticipants = async ({ eventId, page = 1, perPage = 25, participants = [] }) => {
  const event = await callGraphQL({
    query: `
      query EventEntrants($eventId: ID!, $page: Int!, $perPage: Int!){
        event(id: $eventId){
          id
          name
          slug
          entrants (query:{
            page: $page,
            perPage: $perPage
          }) {
            pageInfo {
              total
              totalPages
              page
              perPage
            }
            nodes {
              id
              participants {
                id
                prefix
                gamerTag
                contactInfo {
                  id
                  name
                }
              }
            }
          }
        }
      }
    `,
    variables: {
      eventId,
      page,
      perPage
    }
  })
  
  if (_.get(event, 'data.data.event.entrants')) {
    const entrants = _.get(event, 'data.data.event.entrants')
    const pageInfo = entrants.pageInfo
    participants = participants.concat(entrants.nodes.map(entrant => _.get(entrant, 'participants[0]', null)))
    
    if (page < pageInfo.totalPages) {
      return await getParticipants({ eventId, page: page + 1, perPage, participants })
    }
  }

  return _.compact(participants)
}

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

const getChallongeParticipants = url => new Promise(async (resolve, reject) => {
  const bracket = new URL(url)

  if (bracket.host.indexOf('challonge') !== -1) {
    const subdomain = bracket.hostname.split('.')[0]
    const path = bracket.pathname.replace('/', '')
    
    challongeClient.participants.index({
      id: `${subdomain}-${path}`,
      callback: (err, response) => {
        if (err) {
          return reject(err)
        }
  
        data.participants = [{
          displayName: '',
          challongeUsername: ''
        },
        ..._.map(response, ({ participant }) => ({
          displayName: participant.displayName,
          challongeUsername: participant.challongeUsername
        }))]
  
        return resolve(data.participants)
      }
    })
  } else if (bracket.host.indexOf('smash.gg') !== -1) {
    const info = _(bracket.pathname).split('/').compact().chunk(2).fromPairs().value()
    
    if (info.tournament && info.events) {
      const tournament = await getTournament({ slug: info.tournament })
      
      if (_.get(tournament, `data.data.tournament.slug`, '') === `tournament/${info.tournament}`) {
        const event = _.find(tournament.data.data.tournament.events, event => event.slug === `tournament/${info.tournament}/event/${info.events}`)
        const participants = await getParticipants({ eventId: event.id })
        return resolve([{
          displayName: '',
          challongeUsername: ''
        }, ...participants.map(participant => ({
          displayName: `${_.get(participant, 'prefix') ? `${_.get(participant, 'prefix')} | ` : ''}${_.get(participant, 'gamerTag', '')}`,
          challongeUsername: _.get(participant, 'contactInfo.name', '')
        }))])
      }

      return resolve([])
    }

    return resolve([])
  } else {
    return resolve([])
  }
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