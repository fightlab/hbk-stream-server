interface IDataScoreboard {
  p1n: string
  p2n: string
  p1s: number
  p2s: number
  tl: string
  tr: string
  bl: string
  br: string
}

interface IDataCamera {
  hbk: string
  brewdog: string
  fgc: string
  date: string
  facebook: string
  twitter: string
  web: string
  game: string
}

interface IDataParticipant {
  id: number
  username: string
  displayName: string
}

interface IDataNightbot {
  bracket: string
  social: string
}

interface IDataMatch {
  id: number
  player1Id: number
  player2Id: number
  winnerId: number
  tournamentId: number
  p1s: number
  p2s: number
}
