import { Inject, forwardRef } from '@nestjs/common';
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { EXAMPLE_EVENT, ExampleMessage } from 'src/message/example-message';
import { PubsubService } from 'src/pubsub/pubsub.service';
import { SessionService } from 'src/session/session.service';
import { TicketService } from 'src/ticket/ticket.service';
import { Session } from 'src/util/session';

@WebSocketGateway()
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {

  constructor(@Inject(forwardRef(() => PubsubService)) private readonly pubsubService: PubsubService, 
    private readonly ticketService: TicketService,
    private readonly sessionService: SessionService) {}

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {

    // Redeem ticket
    const ticketId: string = (client.handshake.query.ticketId as string);
    const ticket = this.ticketService.redeemTicket(ticketId);
    const room = ticket.getRoom();
    const user = ticket.getUser();

    // Register session
    const session = new Session(client, room, user);
    this.sessionService.register(session);

    // Add user to the room
    room.getUserModifier().addUser(user);

    console.log('WebSocket connected');
  }

  handleDisconnect(client: Socket) {
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
