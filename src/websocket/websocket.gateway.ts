import { Inject, forwardRef } from '@nestjs/common';
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { EXAMPLE_EVENT, ExampleMessage } from 'src/message/example-message';
import { PubsubService } from 'src/pubsub/pubsub.service';

@WebSocketGateway()
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {

  constructor(@Inject(forwardRef(() => PubsubService)) private readonly pubsubService: PubsubService) {}

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
    this.pubsubService.publishForwardedMessage(message);
  }

  sendForwardedMessage(message: ExampleMessage): void {
    this.server.emit('forward', message);
  }

}
