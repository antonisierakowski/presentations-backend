import './config/dotenv';
import 'reflect-metadata';
import { InversifyExpressServer } from 'inversify-express-utils';
import { applyMiddleware } from './config/expressMddleware';
import container from './config/container';
import { websocketServerModule } from './modules/WebsocketServer/serviceIdentifiers';
import { WebsocketServerInterface } from './modules/WebsocketServer/WebsocketServerInterface';
import { TriggerListenerInterface } from './modules/db/TriggerListenerInterface';
import { dbModule } from './modules/db/serviceIdentifiers';

const restServerPort = process.env.REST_API_PORT || 8000;
const websocketServerPort = process.env.WEBSOCKET_PORT || 8080;

(async () => {
  const server = new InversifyExpressServer(container);
  server.setConfig(applyMiddleware);
  const restApi = server.build();
  const restApiInstance = restApi.listen(restServerPort);
  console.log(`REST server started listening on port ${restServerPort}...`);

  const wsServer = container.get<WebsocketServerInterface>(
    websocketServerModule.WebsocketServer,
  );
  await wsServer.open(websocketServerPort as number);

  const dbTriggerListener = container.get<TriggerListenerInterface>(
    dbModule.TriggerListener,
  );
  await dbTriggerListener.connectAndStartListening();

  process.on('SIGINT', async () => {
    dbTriggerListener.closeConnection();
    console.log('\nReceived SIGINT, initialising grateful shutdown...');
    restApiInstance.close(() => {
      console.log('Rest server closed succesfuly.');
    });
    await wsServer.close();
    console.log('Websocket server closed succesfuly.');
    process.exit();
  });
})();
