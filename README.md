# Habrewken Stream Server

## Brighton Fighting Game Community Stream Tool

### Express/Websocket Server

The stream tool allows us to control and manage overlays (e.g scoreboard/camera) and text displayed on those overlays in real time (websockets) and from anywhere (webserver). It can also manage defined commands for [nightbot](https://nightbot.tv/).

The server acts as the central hub for clients ([coldlink/hbk-stream-front](https://github.com/coldlink/hbk-stream-front)) to connect to, syncronise, and publish data, all using websockets.

## Setup

### Technology

- [Typescript](https://www.typescriptlang.org/)
- [Express](https://expressjs.com/)
- [Socket.io](https://socket.io/)

### Development

Setting the server up for development is straightforward.

1. Clone the repo

```sh
# using ssh
$ git clone git@github.com:coldlink/hbk-stream-server.git
## or using https
$ git clone https://github.com/coldlink/hbk-stream-server.git
```

2. Open the folder

```sh
$ cd hbk-stream-server
```

3. Install Dependencies

```sh
# using yarn (recommened)
$ yarn
# or npm
$ npm install
```

4. Set up environment variables

```sh
# create .env file by copying the .env.example
$ cp .env.example .env
# then add the CHALLONGE_API_KEY and SMASHGG_API_KEY
# if you don't need to work on either of those, then leave them blank
```

5. Start the dev server

```sh
$ yarn dev # or npm run dev

# if everything has worked correctly you should see something like
DONE  Compiled successfully in 134ms

> in development
> listening on port 3000
```

6. Start development, the local server runs by default on `localhost:3000`.

### Deployment

You can create a production build by running

```sh
$ yarn build
```

You can run a production instance by using

```sh
$ yarn start
# which is an alias for "yarn build && node ./build/main.js
```

## Development Tips

### Data Model

The data models is defined under the `./src/data` folder, and the files in there. The `Data` class manages the state of the data, as well as retrieval and updates to the data.

If your adding or changing anything to do with the data state, then this is the place it should go.

### Socket

The socket io config and class is under `./src/socket` folder. All the socket information, such as the listeners and the emitters are in the `Socket` class. It uses the `Data` model for the state information, as well as `Server.http` to attach to the express server.

Use `socket.emit` to send to only that single instance of a socket (a single client), and `this.io.emit` to broadcast to all clients (e.g. making a scoreboard update).

### Server

The express server is defined in `./src/server`. The base class takes the `Data` for the state. Any express configuration should go here, as well as any routes that need to be defined. Routes can return data if required (e.g. `GET /nightbot`)

## Contributing and Further Help

If you feel confident, then please contribute any improvements or features that you think would be good! Raise a PR and we can discuss. If I think of anything that needs to be worked on, I'll leave them in Issues.

If you encounter any problems setting up, feel free to leave an issue, or contact me directly!
