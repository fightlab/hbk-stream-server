import * as express from 'express';
import { Server as HttpServer } from 'http';

class Server {
  public app: express.Express;

  public http: HttpServer;

  public port: number;

  constructor() {
    this.app = express();
    this.http = new HttpServer(this.app);
    this.port = this.getPort();
    this.start();
  }

  private start = (): void => {
    this.http.listen(this.port, this.onListen);
  }

  private onListen = (): void => {
    if (process.env.NODE_ENV === 'development') {
      console.log('> in development');
    }

    console.log(`> listening on port ${this.port}`);
  };

  private getPort = (): number => parseInt(process.env.PORT, 10) || 3000;
}

export default Server;
