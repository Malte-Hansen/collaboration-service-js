import { Inject, forwardRef } from '@nestjs/common';
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ColorService } from 'src/color/color.service';
import { MessageFactoryService } from 'src/factory/message-factory/message-factory.service';
import { EXAMPLE_EVENT, ExampleMessage } from 'src/message/client/receivable/example-message';
import { ForwardedMessage } from 'src/message/client/sendable/forwarded-message';
import { SELF_CONNECTED_EVENT } from 'src/message/client/sendable/self-connected-message';
import { USER_CONNECTED_EVENT, UserConnectedMessage } from 'src/message/client/sendable/user-connected-message';
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
    private readonly roomService: RoomService,
    private readonly colorService: ColorService,
    private readonly messageFactoryService: MessageFactoryService) { }

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
    const colorId = this.colorService.nextColorId();
    const user = room.getUserModifier().makeUserModel(ticket.userId, userName, colorId);
    room.getUserModifier().addUser(user);
    this.pubsubService.publishJoinUserEvent({ roomId: room.getRoomId(), message: { userId: ticket.userId, userName, colorId }})

    // Register session
    const session = new Session(client, room, user);
    this.sessionService.register(session);

    // Add socket to IO Room
    client.join(room.getRoomId());

    this.sendInitialUserList(session);
    // TODO sendLandscape
  }

  handleDisconnect(client: Socket) {
    console.log('WebSocket disconnected');

    const session = this.sessionService.lookupSession(client);

    if (!session) {
      return;
    }

    this.sessionService.unregister(session);
  }

  // UTIL

  private sendUnicastMessage(event: string, client: Socket, message: any): void {
    this.server.to(client.id).emit(event, message);
  }

  private sendBroadcastExceptOneMessage(event: string, roomId: string, userId: string, message: any): void {
    const client = this.sessionService.lookupSocket(userId);
    if (client) {
      // Exclude sender of the message if it is connected to the server
      client.to(roomId).emit(event, message);
    } else {
      // Otherwise send to all clients
      this.server.to(roomId).emit(event, message);
    }
  }

  // SEND EVENT

  sendBroadcastForwardedMessage(event: string, roomId: string, message: ForwardedMessage<any>): void {
    this.sendBroadcastExceptOneMessage(event, roomId, message.userId, message)
  }

  sendInitialUserList(session: Session): void  {
    const message = this.messageFactoryService.makeSelfConnectedMessage(session.getRoom(), session.getUser());
    this.sendUnicastMessage(SELF_CONNECTED_EVENT, session.getSocket(), message);
  }

  sendUserConnectedMessage(roomId: string, message: UserConnectedMessage): void {
    this.sendBroadcastExceptOneMessage(USER_CONNECTED_EVENT, roomId, message.id, message);
  }

  // SUBSCRIPTION HANDLERS

  @SubscribeMessage(EXAMPLE_EVENT)
  handleMessage(@MessageBody() message: ExampleMessage, @ConnectedSocket() client: Socket): void {
    const session = this.sessionService.lookupSession(client);
    const forwardMessage: ForwardedPubsubMessage<ExampleMessage> = { roomId: session.getRoom().getRoomId(), userId: session.getUser().getId(), message};
    this.pubsubService.publishForwardedMessage(EXAMPLE_EVENT, forwardMessage);
  }

}
