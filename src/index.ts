import './lib/env';
import Server from './server';
import Data from './data';
import Socket from './socket';


const server = new Server();
const data = new Data();
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const socket = new Socket(server.http, data);

export default server.app;
