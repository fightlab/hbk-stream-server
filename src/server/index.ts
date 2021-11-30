import express from "express";
import { Server as HttpServer } from "http";
import Data from "../data";

class Server {
	private data: Data;

	public app: express.Express;

	public http: HttpServer;

	public port: number;

	constructor(data: Data) {
		this.data = data;
		this.app = express();
		this.setRoutes();
		this.http = new HttpServer(this.app);
		this.port = this.getPort();
		this.start();
	}

	private start = (): void => {
		this.http.listen(this.port, this.onListen);
	};

	private onListen = (): void => {
		if (process.env.NODE_ENV === "development") {
			console.log("> in development");
		}

		console.log(`> listening on port ${this.port}`);
	};

	private getPort = (): number => parseInt(process.env.PORT || "3000", 10);

	private setRoutes = (): void => {
		this.app.get("/", this.getRoot);
		this.app.get("/nightbot", this.getNightbot);
	};

	private getRoot = (
		req: express.Request,
		res: express.Response
	): express.Response => res.send("hbk stream server is alive");

	private getNightbot = (
		req: express.Request,
		res: express.Response
	): express.Response => {
		const { key = "bracket" } = req.query;
		return res.send(this.data.getNightbot(key as string));
	};
}

export default Server;
