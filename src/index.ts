import "./lib/env";
import Server from "./server";
import Data from "./data";
import Socket from "./socket";

const data = new Data();
const server = new Server(data);
// eslint-disable-next-line no-new
new Socket(server.http, data);

export default server.app;
