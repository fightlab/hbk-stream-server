import { Server as SocketServer } from "socket.io";
import { Server } from "http";
import Data from "../data";

class Socket {
  private io: SocketServer;

  constructor(http: Server, data: Data) {
    this.io = new SocketServer(http, {
      cors: {
        origin: "http://localhost:1234",
        methods: ["GET", "POST"],
      },
    });

    this.io.on("connection", (socket) => {
      console.log(`connected: ${socket.id}`);

      socket.on("scoreboard-get", () => {
        socket.emit("scoreboard", data.getScoreboard());
      });

      socket.on("scoreboard-update", (scoreboard) => {
        data.setScoreboard(scoreboard);
        this.io.emit("scoreboard", scoreboard);
      });

      socket.on("camera-get", () => {
        socket.emit("camera", data.getCamera());
      });

      socket.on("camera-update", (camera) => {
        data.setCamera(camera);
        this.io.emit("camera", camera);
      });

      socket.on("social-get", () => {
        socket.emit("social", data.getSocial());
      });

      socket.on("social-update", (social) => {
        data.setSocial(social);
        this.io.emit("social", social);
      });

      socket.on("prestream-get", () => {
        socket.emit("prestream", data.getPrestream());
      });

      socket.on("prestream-update", (prestream) => {
        data.setPrestream(prestream);
        this.io.emit("prestream", prestream);
      });

      socket.on("nightbot-get", () => {
        socket.emit("nightbot", data.getNightbot());
      });

      socket.on("nightbot-update", (nightbot) => {
        data.setNightbot(nightbot);
        this.io.emit("nightbot", nightbot);
      });

      socket.on("participants-get", () => [
        this.io.emit("participants", {
          bracket: data.getBracket(),
          participants: data.getParticipants(),
        }),
      ]);

      socket.on("bracket-get", async (url) => {
        data.setBracket(url);
        try {
          const participants = await data.getParticipantsFromBracket(url);
          socket.emit("participants", { bracket: url, participants });
        } catch (e) {
          console.error(e);
        }
      });
    });
  }
}

export default Socket;
