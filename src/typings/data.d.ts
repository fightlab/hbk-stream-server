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
  game: string
  bg: string
}

interface IDataParticipant {
  username: string
  displayName: string
}

interface IDataNightbot {
  bracket: string
  social: string
}

interface IDataPreStream {
  event: string
  game: string
  bg: string
  countdown: number
  venue: string
  showTimer: boolean
  startText: string
}

interface IDataSocial {
  web: string
  facebook: string
  twitter: string
}
