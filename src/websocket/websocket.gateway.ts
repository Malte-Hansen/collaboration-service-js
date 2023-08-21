import { Inject, forwardRef } from '@nestjs/common';
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { EXAMPLE_EVENT, ExampleMessage } from 'src/message/client/receivable/example-message';
import { ForwardedMessage } from 'src/message/client/sendable/forwarded-message';
import { ForwardedPubsubMessage } from 'src/message/pubsub/forward-pubsub-message';
import { Room } from 'src/model/room-model';
import { PubsubService } from 'src/pubsub/pubsub.service';
import { RoomService } from 'src/room/room.service';
import { SessionService } from 'src/session/session.service';
import { TicketService } from 'src/ticket/ticket.service';
import { Session } from 'src/util/session';
import { Ticket } from 'src/util/ticket';

@WebSocketGateway()
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {

  constructor(@Inject(forwardRef(() => PubsubService)) private readonly pubsubService: PubsubService,
    @Inject(forwardRef(() => TicketService)) private readonly ticketService: TicketService,
    private readonly sessionService: SessionService,
    private readonly roomService: RoomService) { }

  @WebSocketServer()
  server: Server;

  async handleConnection(client: Socket) {
    console.log('WebSocket connected');

    // Query params
    const ticketId: string = (client.handshake.query.ticketId as string);
    const userName: string = (client.handshake.query.userName as string);
    // TODO query params for user position ? 

    var ticket: Ticket;
    var room: Room;
    
    // Redeem ticket
    try {
      ticket = await this.ticketService.redeemTicket(ticketId);
      room = this.roomService.lookupRoom(ticket.roomId);
    } catch (error) {
      console.log(error);
      client.disconnect();
      return;
    }

    // Join user
    this.pubsubService.publishJoinUserEvent({ roomId: room.getRoomId(), userId: ticket.userId, userName })

    // Register session
    const session = new Session(client, room, ticket.userId);
    this.sessionService.register(session);

    // Add socket to IO Room
    client.join(room.getRoomId());
  }

  handleDisconnect(client: Socket) {
    console.log('WebSocket disconnected');

    const session = this.sessionService.lookupSession(client);

    if (!session) {
      return;
    }

    const room = session.getRoom();
    this.sessionService.unregister(session);

    // User leaves room
    room.getUserModifier().removeUser(session.getUserId());

    // Delete room if empty
    if (room.getUserModifier().getUsers().length == 0) {
      this.roomService.deleteRoom(room.getRoomId());
    }
  }

  broadcastForwardMessage(event: string, roomId: string, message: ForwardedMessage<any>): void {
    const client = this.sessionService.lookupSocket(message.userId);
    if (client) {
      // Exclude sender of the message if it is connected to the server
      client.to(roomId).emit(event, message);
    } else {
      // Otherwise send to all clients
      this.server.to(roomId).emit(event, message);
    }
  }

  @SubscribeMessage(EXAMPLE_EVENT)
  handleMessage(@MessageBody() message: ExampleMessage, @ConnectedSocket() client: Socket): void {
    const session = this.sessionService.lookupSession(client);
    const forwardMessage: ForwardedPubsubMessage<ExampleMessage> = { roomId: session.getRoom().getRoomId(), userId: session.getUserId(), message};
    this.pubsubService.publishForwardedMessage(EXAMPLE_EVENT, forwardMessage);
  }

}
