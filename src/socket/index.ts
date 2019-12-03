import * as socketio from 'socket.io';
import { Server } from 'http';
import Data from '../data';


class Socket {
  private io: socketio.Server;

  private data: Data;

  constructor(http: Server, data: Data) {
    this.io = socketio(http);
    this.data = data;

    this.io.on('connection', (socket: socketio.Socket) => {
      console.log(`connected: ${socket.id}`);

      socket.on('scoreboard-get', () => {
        socket.emit('scoreboard', data.getScoreboard());
      });

      socket.on('scoreboard-update', (scoreboard) => {
        data.setScoreboard(scoreboard);
        this.io.emit('scoreboard', scoreboard);
      });

      socket.on('camera-get', () => {
        socket.emit('camera', data.getCamera());
      });

      socket.on('camera-update', (camera) => {
        data.setCamera(camera);
        this.io.emit('camera', camera);
      });

      socket.on('nightbot-get', () => {
        socket.emit('nightbot', data.getNightbot());
      });

      socket.on('nightbot-update', (nightbot) => {
        data.setNightbot(nightbot);
        this.io.emit('nightbot', nightbot);
      });

      socket.on('participants-get', () => [
        this.io.emit('participants', { bracket: data.getBracket(), participants: data.getParticipants(), matches: data.getMatches() }),
      ]);

      socket.on('bracket-get', async (url) => {
        data.setBracket(url);
        try {
          const participants = await data.getParticipantsFromBracket(url);
          const matches = await data.getMatchesFromBracket(url);
          socket.emit('participants', { bracket: url, participants, matches });
        } catch (e) {
          console.error(e);
        }
      });
    });
  }
}

export default Socket;
