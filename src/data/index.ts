class Data {
  private scoreboard: IDataScoreboard = {
    p1n: 'Player 1',
    p2n: 'Player 2',
    p1s: 0,
    p2s: 0,
    tl: 'HBK',
    tr: '#000',
    bl: 'Brewdog',
    br: 'Brighton',
  };

  private camera: IDataCamera = {
    hbk: 'Habrewken #000',
    brewdog: 'Brewdog Brighton',
    fgc: 'Brighton Fighting Game Community',
    date: 'Wednesday Xth MONTH 20XX',
    facebook: 'fightlabbrighton',
    twitter: 'fight_lab',
    web: 'hbk.gg',
    game: 'GAME NAME',
  };

  private participants: Array<IDataParticipant> = [];

  private bracket: string = '';

  constructor({
    scoreboard,
    camera,
    bracket,
    participants,
  }: {
    scoreboard?: IDataScoreboard,
    camera?: IDataCamera,
    bracket?: string,
    participants?: Array<IDataParticipant>
  } = {}) {
    if (scoreboard) this.scoreboard = scoreboard;
    if (camera) this.camera = camera;
    if (bracket) this.bracket = bracket;
    if (participants) this.participants = participants;
  }

  public getScoreboard = (): IDataScoreboard => this.scoreboard;

  public getCamera = (): IDataCamera => this.camera;

  public getBracket = (): string => this.bracket;

  public getParticipants = (): Array<IDataParticipant> => this.participants;

  public setScoreboard = (scoreboard: object): void => {
    this.scoreboard = scoreboard as IDataScoreboard;
  };

  public setCamera = (camera: object): void => {
    this.camera = camera as IDataCamera;
  };

  public setBracket = (bracket: string): void => {
    this.bracket = bracket;
  };

  public setParticipants = (participants: Array<object>): void => {
    this.participants = participants as Array<IDataParticipant>;
  };
}

export default Data;
