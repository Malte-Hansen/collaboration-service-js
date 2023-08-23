import { Inject, forwardRef } from '@nestjs/common';
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessageFactoryService } from 'src/factory/message-factory/message-factory.service';
import { IdGenerationService } from 'src/id-generation/id-generation.service';
import { EXAMPLE_EVENT, ExampleMessage } from 'src/message/client/receivable/example-message';
import { MENU_DETACHED_EVENT, MenuDetachedMessage } from 'src/message/client/receivable/menu-detached-message';
import { ForwardedMessage } from 'src/message/client/sendable/forwarded-message';
import { INITIAL_LANDSCAPE_EVENT } from 'src/message/client/sendable/initial-landscape-message';
import { MENU_DETACHED_RESPONSE_EVENT, MenuDetachedResponse } from 'src/message/client/sendable/menu-detached-response';
import { SELF_CONNECTED_EVENT } from 'src/message/client/sendable/self-connected-message';
import { USER_CONNECTED_EVENT, UserConnectedMessage } from 'src/message/client/sendable/user-connected-message';
import { PublishedMenuDetachedMessage } from 'src/message/pubsub/published-menu-detached-message';
import { RoomForwardMessage } from 'src/message/pubsub/room-forward-message';
import { Room } from 'src/model/room-model';
import { PubsubService } from 'src/pubsub/pubsub.service';
import { RoomService } from 'src/room/room.service';
import { SessionService } from 'src/session/session.service';
import { TicketService } from 'src/ticket/ticket.service';
import { Session } from 'src/util/session';
import { Ticket } from 'src/util/ticket';

interface ResponseMessage {
  nonce: number
}

@WebSocketGateway()
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {

  constructor(@Inject(forwardRef(() => PubsubService)) private readonly pubsubService: PubsubService,
    @Inject(forwardRef(() => TicketService)) private readonly ticketService: TicketService,
    private readonly sessionService: SessionService,
    private readonly roomService: RoomService,
    private readonly messageFactoryService: MessageFactoryService,
    @Inject(forwardRef(() => IdGenerationService)) private readonly idGenerationService: IdGenerationService) { }

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
    const colorId = room.getColorModifier().nextColorId();
    const user = room.getUserModifier().makeUserModel(ticket.userId, userName, colorId);
    room.getUserModifier().addUser(user);
    this.pubsubService.publishJoinUserEvent({ roomId: room.getRoomId(), message: { userId: ticket.userId, userName, colorId }})

    // Register session
    const session = new Session(client, room, user);
    this.sessionService.register(session);

    // Add socket to IO Room
    client.join(room.getRoomId());

    this.sendInitialUserList(session);
    this.sendLandscape(session);
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

  sendBroadcastMessage(event: string, roomId: string, message: any): void {
    this.sendBroadcastExceptOneMessage(event, roomId, message.userId, message);
  }

  sendBroadcastForwardedMessage(event: string, roomId: string, message: ForwardedMessage<any>): void {
    this.sendBroadcastExceptOneMessage(event, roomId, message.userId, message);
  }

  sendInitialUserList(session: Session): void  {
    const message = this.messageFactoryService.makeSelfConnectedMessage(session.getRoom(), session.getUser());
    this.sendUnicastMessage(SELF_CONNECTED_EVENT, session.getSocket(), message);
  }

  sendLandscape(session: Session): void {
    const message = this.messageFactoryService.makeInitialLandscapeMessage(session.getRoom());
    this.sendUnicastMessage(INITIAL_LANDSCAPE_EVENT, session.getSocket(), message);
  }

  sendUserConnectedMessage(roomId: string, message: UserConnectedMessage): void {
    this.sendBroadcastExceptOneMessage(USER_CONNECTED_EVENT, roomId, message.id, message);
  }

  sendResponse(event: string, client: Socket, response: ResponseMessage) {
    this.sendUnicastMessage(event, client, response);
  }

  // SUBSCRIPTION HANDLERS

  @SubscribeMessage(EXAMPLE_EVENT)
  handleExampleMessage(@MessageBody() message: ExampleMessage, @ConnectedSocket() client: Socket): void {
    const session = this.sessionService.lookupSession(client);
    const forwardMessage: RoomForwardMessage<ExampleMessage> = { roomId: session.getRoom().getRoomId(), userId: session.getUser().getId(), message};
    this.pubsubService.publishRoomForwardMessage(EXAMPLE_EVENT, forwardMessage);
  }

  @SubscribeMessage(MENU_DETACHED_EVENT)
  async handleMenuDetachedMessage(@MessageBody() message: MenuDetachedMessage, @ConnectedSocket() client: Socket): Promise<void> {
    const id = await this.idGenerationService.nextId();
    const roomMessage = this.messageFactoryService.makeRoomForwardMessage<PublishedMenuDetachedMessage>(client, {id: id, message: message});
    this.pubsubService.publishRoomForwardMessage(MENU_DETACHED_EVENT, roomMessage);
    const response: MenuDetachedResponse = { objectId:id, nonce: message.nonce };
    this.sendResponse(MENU_DETACHED_EVENT, client, response);
  }

}
