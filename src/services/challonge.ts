import { createClient } from 'challonge';
import { map } from 'lodash';

class Challonge {
  public static getScoresFromCsv = (scoreCsv: string): Array<IChallongeScore> => {
    // scoreCsv = "2-1,1-0,3-2"
    const split = scoreCsv.split(',');
    // split = ["2-1", "1-0", "3-2"]
    return split.map((score) => {
      // score = "2-1"
      const scoreSplit = score.split('-');
      // scoreSplit = ["2", "1"]
      return {
        p1s: +scoreSplit[0],
        p2s: +scoreSplit[1],
      };
    });
  }

  private client = createClient({
    apiKey: process.env.CHALLONGE_API_KEY,
  })

  private getTournamentId = (url: URL): string => {
    try {
      let subdomain = url.hostname.split('.')[0];
      const path = url.pathname.replace('/', '');

      // check if url has team/group subdomain
      subdomain = subdomain === 'challonge' ? '' : subdomain;

      return `${subdomain ? `${subdomain}-` : ''}${path}`;
    } catch (error) {
      console.error(error);
      return '';
    }
  }

  public getParticipants = (url: URL): Promise<Array<IChallongeParticipant>> => new Promise((resolve, reject) => {
    const id = this.getTournamentId(url);

    this.client.participants.index({
      id,
      callback: (err, data) => {
        if (err) {
          return reject(err);
        }

        return resolve(map(data, ({ participant }) => participant));
      },
    });
  })

  public getMatches = (url: URL): Promise<Array<IChallongeMatch>> => new Promise((resolve, reject) => {
    const id = this.getTournamentId(url);

    this.client.matches.index({
      id,
      callback: (err, data) => {
        if (err) {
          return reject(err);
        }

        return resolve(map(data, ({ match }) => match));
      },
    });
  })
}

export default Challonge;
