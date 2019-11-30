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

      socket.on('participants-get', () => [
        this.io.emit('participants', { bracket: data.getBracket(), participants: data.getParticipants() }),
      ]);

      socket.on('bracket-get', async (url) => {
        data.setBracket(url);
        try {
          const participants = await data.getParticipantsFromBracket(url);
          socket.emit('participants', { bracket: url, participants });
        } catch (e) {
          console.error(e);
        }
      });
    });
  }
}

export default Socket;
