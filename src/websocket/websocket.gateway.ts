import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { EXAMPLE_EVENT, ExampleMessage } from 'src/message/example-message';
import { ModelService } from 'src/model/model.service';
import { PubsubService } from 'src/pubsub/pubsub.service';

@WebSocketGateway()
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {

  constructor(private modelService: ModelService, private pubsubService: PubsubService) {}

  @WebSocketServer()
  server: Server;

  handleConnection(client: any, ...args: any[]) {
    console.log('WebSocket connected');
  }

  handleDisconnect(client: any) {
    console.log('WebSocket disconnected');
  }

  @SubscribeMessage(EXAMPLE_EVENT)
  handleMessage(@MessageBody() message: ExampleMessage, @ConnectedSocket() client: Socket): void {
    console.log('Received: ', message);
    this.modelService.handleExampleMessage(message);
    this.server.emit('example', "Ok");
    this.pubsubService.publishForwardedMessage(message);

  }

}
