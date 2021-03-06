import * as _ from 'lodash';
import axios from 'axios';
import Challonge from '../services/challonge';

class Data {
  private smashAPI: string = 'https://api.smash.gg/gql/alpha';

  private smashToken: string = process.env.SMASHGG_API_KEY;

  private challonge = new Challonge();

  private scoreboard: IDataScoreboard = {
    p1n: '',
    p2n: '',
    p1s: 0,
    p2s: 0,
    p1l: false,
    p2l: false,
    tl: 'HBK',
    tr: '#000',
    bl: 'Brewdog',
    br: 'Brighton',
    lTag: '[L]',
  };

  private camera: IDataCamera = {
    hbk: 'Habrewken #000',
    brewdog: 'Brewdog Brighton',
    fgc: 'Brighton Fighting Game Community',
    date: 'Wednesday Xth MONTH 20XX',
    game: 'GAME NAME',
    bg: 'hbk',
  };

  private social: IDataSocial = {
    web: 'hbk.gg',
    facebook: 'fightlabbrighton',
    twitter: 'fight_lab',
  }

  private participants: Array<IDataParticipant> = [];

  private bracket: string = '';

  private nightbot: IDataNightbot = {
    bracket: 'https://hbk.challonge.com',
    social: '• FOLLOW US ON • WEB: https://hbk.gg • FACEBOOK: https://www.facebook.com/FightLabBrighton/ • TWITTER: https://twitter.com/fight_lab • DISCORD: https://discord.gg/rjpDJdz •',
  };

  private prestream: IDataPreStream = {
    event: 'Habrewken #000',
    game: 'Game Fighter Name',
    bg: 'hbk',
    countdown: 300,
    venue: 'BrewDog Brighton',
    showTimer: true,
    startText: 'Starts',
  }

  private callGraphQL = ({ query, variables }) => axios({
    url: this.smashAPI,
    method: 'post',
    headers: {
      Authorization: `Bearer ${this.smashToken}`,
    },
    data: {
      query,
      variables,
    },
  })

  private getTournamentSmash = ({ slug }: { slug: string }) => this.callGraphQL({
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
      tournamentSlug: slug,
    },
  })

  private getParticipantsSmash = async ({
    eventId, page = 1, perPage = 25, participants = [],
  }) => {
    const event = await this.callGraphQL({
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
        perPage,
      },
    });

    if (_.get(event, 'data.data.event.entrants')) {
      const entrants = _.get(event, 'data.data.event.entrants');
      const { pageInfo } = entrants;
      // eslint-disable-next-line no-param-reassign
      participants = participants.concat(entrants.nodes.map((entrant) => _.get(entrant, 'participants[0]', null)));

      if (page < pageInfo.totalPages) {
        return this.getParticipantsSmash({
          eventId, page: page + 1, perPage, participants,
        });
      }
    }

    return _.compact(participants);
  }

  constructor({
    scoreboard,
    camera,
    bracket,
    participants,
    prestream,
  }: {
    scoreboard?: IDataScoreboard,
    camera?: IDataCamera,
    bracket?: string,
    participants?: Array<IDataParticipant>,
    prestream?:IDataPreStream
  } = {}) {
    if (scoreboard) this.scoreboard = scoreboard;
    if (camera) this.camera = camera;
    if (bracket) this.bracket = bracket;
    if (participants) this.participants = participants;
    if (prestream) this.prestream = prestream;
  }

  public getScoreboard = (): IDataScoreboard => this.scoreboard;

  public getCamera = (): IDataCamera => this.camera;

  public getSocial = (): IDataSocial => this.social;

  public getBracket = (): string => this.bracket;

  public getParticipants = (): Array<IDataParticipant> => this.participants;

  public getNightbot = (key?: string): string|IDataNightbot => {
    if (key) return this.nightbot[key] || '';
    return this.nightbot;
  };

  public getPrestream = (): IDataPreStream => this.prestream;

  public setScoreboard = (scoreboard: object): void => {
    this.scoreboard = scoreboard as IDataScoreboard;
  };

  public setCamera = (camera: object): void => {
    this.camera = camera as IDataCamera;
  };

  public setSocial = (social: object): void => {
    this.social = social as IDataSocial;
  }

  public setBracket = (bracket: string): void => {
    this.bracket = bracket;
  };

  public setParticipants = (participants: Array<object>): void => {
    this.participants = participants as Array<IDataParticipant>;
  };

  public setNightbot = (nightbot: object): void => {
    this.nightbot = nightbot as IDataNightbot;
  }

  public setPrestream = (prestream: object): void => {
    this.prestream = prestream as IDataPreStream;
  };

  // eslint-disable-next-line no-async-promise-executor
  public getParticipantsFromBracket = (bracket: string): Promise<Array<IDataParticipant>> => new Promise(async (resolve, reject) => {
    try {
      const url: URL = new URL(bracket);

      if (url.host.includes('challonge')) {
        const participantsFromChallonge = await this.challonge.getParticipants(url);

        const participants = [{
          displayName: '',
          username: '',
        },
        ..._.map(participantsFromChallonge, (participant) => ({
          displayName: participant.displayName,
          username: participant.challongeUsername,
        }))] as Array<IDataParticipant>;

        this.setParticipants(participants);

        return resolve(participants);
      }

      if (url.host.includes('smash.gg')) {
        const info = _(url.pathname).split('/').compact().chunk(2)
          .fromPairs()
          .value();

        if (info.tournament && info.events) {
          const tournament = await this.getTournamentSmash({ slug: info.tournament });

          if (_.get(tournament, 'data.data.tournament.slug', '') === `tournament/${info.tournament}`) {
            const event = _.find(tournament.data.data.tournament.events, (e) => e.slug === `tournament/${info.tournament}/event/${info.events}`);

            const participantsSmash = await this.getParticipantsSmash({ eventId: event.id });

            const participants = [{
              displayName: '',
              username: '',
            }, ...participantsSmash.map((participant) => ({
              displayName: `${_.get(participant, 'prefix') ? `${_.get(participant, 'prefix')} | ` : ''}${_.get(participant, 'gamerTag', '')}`,
              username: _.get(participant, 'contactInfo.name', ''),
            }))] as Array<IDataParticipant>;

            this.setParticipants(participants);
            return resolve(participants);
          }
        }
      }

      return resolve([]);
    } catch (error) {
      return reject(error);
    }
  })
}

export default Data;
