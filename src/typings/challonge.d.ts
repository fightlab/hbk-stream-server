interface IChallongeParticipant {
  id?: number
  name?: string
  challongeUsername?: string
  displayName?: string
  username?: string
}

interface IChallongeMatch {
  id?: number
  loserId?: number
  player1Id?: number
  player2Id?: number
  state?: string
  tournamentId?: number
  winnerId?: number
  scoresCsv?: string
}

interface IChallongeScore {
  p1s: number
  p2s: number
}
