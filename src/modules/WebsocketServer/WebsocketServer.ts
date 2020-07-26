import WebSocket, { Server } from 'ws';
import { inject, injectable } from 'inversify';
import * as http from 'http';
import * as url from 'url';
import { WebsocketServerInterface } from './WebsocketServerInterface';
import { WebsocketChannelClusterInterface } from './WebsocketChannelClusterInterface';
import { websocketServerModule } from './serviceIdentifiers';
import { Socket } from 'net';

@injectable()
export class WebsocketServer implements WebsocketServerInterface {
  private wsServer: Server;
  private server: http.Server;

  constructor(
    @inject(websocketServerModule.WebsocketChannelCluster)
    private cluster: WebsocketChannelClusterInterface,
  ) {
    this.wsServer = new WebSocket.Server({ noServer: true });
    this.server = http.createServer();
  }

  async open(port: number): Promise<void> {
    this.server.on('upgrade', this.handleWsHandshake.bind(this));
    this.server.listen(port, () => {
      console.log(`WebSocket server opened on port ${port}...`);
    });
  }

  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.close((err: Error) => {
        if (err) {
          reject(err);
        }
        resolve();
      });
    });
  }

  private handleWsHandshake(
    req: http.IncomingMessage,
    socket: Socket,
    head: Buffer,
  ): void {
    const pathname = url.parse(req.url).pathname;
    const channelId = pathname.substr(1);
    this.wsServer.handleUpgrade(req, socket, head, (ws: WebSocket) => {
      this.cluster.addConnection(channelId, ws);
    });
  }
}
