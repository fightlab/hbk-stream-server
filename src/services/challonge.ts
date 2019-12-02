import { createClient } from 'challonge';
import { map } from 'lodash';

class Challonge {
  private client = createClient({
    apiKey: process.env.CHALLONGE_API_KEY,
  })

  public getParticipants = (url: URL): Promise<Array<IChallongeParticipant>> => new Promise((resolve, reject) => {
    const subdomain = url.hostname.split('.')[0];
    const path = url.pathname.replace('/', '');

    // check if url has team/group subdomain
    const id = subdomain === 'challonge' ? '' : subdomain;

    this.client.participants.index({
      id: `${id ? `${id}-` : ''}${path}`,
      callback: (err, response) => {
        if (err) {
          return reject(err);
        }
        return resolve(map(response, ({ participant }) => participant));
      },
    });
  })
}

export default Challonge;
