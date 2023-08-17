import { Inject, forwardRef } from '@nestjs/common';
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ExampleMessage } from 'src/message/client/receivable/example-message';
import { ForwardClientMessage } from 'src/message/client/sendable/forward-client-message';
import { PubsubService } from 'src/pubsub/pubsub.service';
import { RoomService } from 'src/room/room.service';
import { SessionService } from 'src/session/session.service';
import { TicketService } from 'src/ticket/ticket.service';
import { Session } from 'src/util/session';

@WebSocketGateway()
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {

  constructor(@Inject(forwardRef(() => PubsubService)) private readonly pubsubService: PubsubService,
    private readonly ticketService: TicketService,
    private readonly sessionService: SessionService,
    private readonly roomService: RoomService) { }

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {

    // Query params
    const ticketId: string = (client.handshake.query.ticketId as string);
    const userName: string = (client.handshake.query.userName as string);
    // TODO query params for user position ? 

    // Redeem ticket
    const ticket = this.ticketService.redeemTicket(ticketId);
    const room = this.roomService.lookupRoom(ticket.getRoomId());

    // Remove ticket
    this.pubsubService.publishUnregisterTicket({ ticketId });

    // Join user
    this.pubsubService.publishJoinUserMessage({ roomId: room.getRoomId(), userId: ticket.getUserId(), userName })

    // Register session
    const session = new Session(client, room, ticket.getUserId());
    this.sessionService.register(session);

    // Add socket to IO Room
    client.join(room.getRoomId());

    console.log('WebSocket connected');
  }

  handleDisconnect(client: Socket) {
    const session = this.sessionService.lookupSession(client);
    this.sessionService.unregister(session);
    console.log('WebSocket disconnected');
  }

  broadcastForwardMessage(event: string, roomId: string, message: ForwardClientMessage<any>): void {
    const client = this.sessionService.lookupSocket(message.userId);
    if (client) {
      // Exclude sender of the message if it is connected to the server
      client.to(roomId).emit(event, message);
    } else {
      // Otherwise send to all clients
      this.server.to(roomId).emit(event, message);
    }
  }

  @SubscribeMessage('example')
  handleMessage(@MessageBody() message: ExampleMessage, @ConnectedSocket() client: Socket): void {
    const session = this.sessionService.lookupSession(client);
    this.pubsubService.publishForwardedMessage(message);
  }

}
