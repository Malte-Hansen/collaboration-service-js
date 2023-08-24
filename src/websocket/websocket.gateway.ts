import { Inject, forwardRef } from '@nestjs/common';
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessageFactoryService } from 'src/factory/message-factory/message-factory.service';
import { IdGenerationService } from 'src/id-generation/id-generation.service';
import { APP_CLOSED_EVENT, AppClosedMessage } from 'src/message/client/receivable/app-closed-message';
import { APP_OPENED_EVENT, AppOpenedMessage } from 'src/message/client/receivable/app-opened-message';
import { COMPONENT_UPDATE_EVENT, ComponentUpdateMessage } from 'src/message/client/receivable/component-update-message';
import { DETACHED_MENU_CLOSED_EVENT, DetachedMenuClosedMessage } from 'src/message/client/receivable/detached-menu-closed-message';
import { EXAMPLE_EVENT, ExampleMessage } from 'src/message/client/receivable/example-message';
import { HEATMAP_UPDATE_EVENT, HeatmapUpdateMessage } from 'src/message/client/receivable/heatmap-update-message';
import { HIGHLIGHTING_UPDATE_EVENT, HighlightingUpdateMessage } from 'src/message/client/receivable/highlighting-update-message';
import { MENU_DETACHED_EVENT, MenuDetachedMessage } from 'src/message/client/receivable/menu-detached-message';
import { MOUSE_PING_UPDATE_EVENT, MousePingUpdateMessage } from 'src/message/client/receivable/mouse-ping-update-message';
import { OBJECT_GRABBED_EVENT, ObjectGrabbedMessage } from 'src/message/client/receivable/object-grabbed-message';
import { OBJECT_MOVED_EVENT, ObjectMovedMessage } from 'src/message/client/receivable/object-moved-message';
import { OBJECT_RELEASED_EVENT, ObjectReleasedMessage } from 'src/message/client/receivable/object-released-message';
import { PING_UPDATE_EVENT, PingUpdateMessage } from 'src/message/client/receivable/ping-update-message';
import { SPECTATING_UPDATE_EVENT, SpectatingUpdateMessage } from 'src/message/client/receivable/spectating-update-message';
import { TIMESTAMP_UPDATE_EVENT, TimestampUpdateMessage } from 'src/message/client/receivable/timestamp-update-message';
import { USER_CONTROLLER_CONNECT_EVENT, UserControllerConnectMessage } from 'src/message/client/receivable/user-controller-connect-message';
import { USER_CONTROLLER_DISCONNECT_EVENT, UserControllerDisconnectMessage } from 'src/message/client/receivable/user-controller-disconnect-message';
import { USER_POSITIONS_EVENT, UserPositionsMessage } from 'src/message/client/receivable/user-positions-message';
import { ForwardedMessage } from 'src/message/client/sendable/forwarded-message';
import { INITIAL_LANDSCAPE_EVENT } from 'src/message/client/sendable/initial-landscape-message';
import { MENU_DETACHED_RESPONSE_EVENT, MenuDetachedResponse } from 'src/message/client/sendable/menu-detached-response';
import { OBJECT_CLOSED_RESPONSE_EVENT, ObjectClosedResponse } from 'src/message/client/sendable/object-closed-response';
import { OBJECT_GRABBED_RESPONSE_EVENT, ObjectGrabbedResponse } from 'src/message/client/sendable/object-grabbed-response';
import { SELF_CONNECTED_EVENT } from 'src/message/client/sendable/self-connected-message';
import { TIMESTAMP_UPDATE_TIMER_EVENT } from 'src/message/client/sendable/timestamp-update-timer-message';
import { USER_CONNECTED_EVENT, UserConnectedMessage } from 'src/message/client/sendable/user-connected-message';
import { USER_DISCONNECTED_EVENT, UserDisconnectedMessage } from 'src/message/client/sendable/user-disconnected-message';
import { PublishIdMessage } from 'src/message/pubsub/publish-id-message';
import { RoomForwardMessage } from 'src/message/pubsub/room-forward-message';
import { Room } from 'src/model/room-model';
import { PubsubService } from 'src/pubsub/pubsub.service';
import { RoomService } from 'src/room/room.service';
import { SessionService } from 'src/session/session.service';
import { TicketService } from 'src/ticket/ticket.service';
import { GrabbableObjectLock } from 'src/util/grabbable-object-lock';
import { Session } from 'src/util/session';
import { Ticket } from 'src/util/ticket';

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

  private grabbableObjectLocks: Map<string,GrabbableObjectLock> = new Map();

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
    const user = room.getUserModifier().makeUserModel(ticket.userId, userName, colorId, [0,0,0], [0,0,0,0]);
    room.getUserModifier().addUser(user);
    const roomMessage = this.messageFactoryService.makeRoomStatusMessage<UserConnectedMessage>(room.getRoomId(), {
      id: user.getId(), name: user.getUserName(), color: user.getColor(), position: user.getPosition(), quaternion: user.getQuaternion()
    });
    this.pubsubService.publishRoomStatusMessage(USER_CONNECTED_EVENT, roomMessage);

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

    // release locks
    for (var [objectId, grabbableObjectLock] of this.grabbableObjectLocks.entries()) {
      if (grabbableObjectLock.isLockedByUser(session.getUser())) this.grabbableObjectLocks.delete(objectId);
    }
    
    const message: UserDisconnectedMessage = { id: session.getUser().getId() };
    this.pubsubService.publishRoomStatusMessage(USER_DISCONNECTED_EVENT, 
      this.messageFactoryService.makeRoomStatusMessage(session.getRoom().getRoomId(), message));
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

  sendBroadcastMessage(event: string, roomId: string, message: any) {
    this.server.to(roomId).emit(event, message);
  }

  sendBroadcastForwardedMessage(event: string, roomId: string, message: any): void {
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
    const roomMessage = this.messageFactoryService.makeRoomForwardMessage<PublishIdMessage<MenuDetachedMessage>>(client, {id: id, message: message});
    this.pubsubService.publishRoomForwardMessage(MENU_DETACHED_EVENT, roomMessage);
    const response: MenuDetachedResponse = { objectId:id, nonce: message.nonce };
    this.sendResponse(MENU_DETACHED_RESPONSE_EVENT, client, response);
  }

  @SubscribeMessage(APP_OPENED_EVENT)
  handleAppOpenedMessage(@MessageBody() message: AppOpenedMessage, @ConnectedSocket() client: Socket): void {
    const roomMessage = this.messageFactoryService.makeRoomForwardMessage<AppOpenedMessage>(client, message);
    this.pubsubService.publishRoomForwardMessage(APP_OPENED_EVENT, roomMessage);
  }

  @SubscribeMessage(COMPONENT_UPDATE_EVENT)
  handleComponentUpdateMessage(@MessageBody() message: ComponentUpdateMessage, @ConnectedSocket() client: Socket): void {
    const roomMessage = this.messageFactoryService.makeRoomForwardMessage<ComponentUpdateMessage>(client, message);
    this.pubsubService.publishRoomForwardMessage(COMPONENT_UPDATE_EVENT, roomMessage);
  }

  @SubscribeMessage(HEATMAP_UPDATE_EVENT)
  handleHeatmapUpdateMessage(@MessageBody() message: HeatmapUpdateMessage, @ConnectedSocket() client: Socket): void {
    const roomMessage = this.messageFactoryService.makeRoomForwardMessage<HeatmapUpdateMessage>(client, message);
    this.pubsubService.publishRoomForwardMessage(HEATMAP_UPDATE_EVENT, roomMessage);
  }

  @SubscribeMessage(HIGHLIGHTING_UPDATE_EVENT)
  handleHighlightingUpdateMessage(@MessageBody() message: HighlightingUpdateMessage, @ConnectedSocket() client: Socket): void {
    const roomMessage = this.messageFactoryService.makeRoomForwardMessage<HighlightingUpdateMessage>(client, message);
    this.pubsubService.publishRoomForwardMessage(HIGHLIGHTING_UPDATE_EVENT, roomMessage);
  }

  @SubscribeMessage(MOUSE_PING_UPDATE_EVENT)
  handleMousePingUpdateMessage(@MessageBody() message: MousePingUpdateMessage, @ConnectedSocket() client: Socket): void {
    const roomMessage = this.messageFactoryService.makeRoomForwardMessage<MousePingUpdateMessage>(client, message);
    this.pubsubService.publishRoomForwardMessage(MOUSE_PING_UPDATE_EVENT, roomMessage);
  }

  @SubscribeMessage(PING_UPDATE_EVENT)
  handlePingUpdateMessage(@MessageBody() message: PingUpdateMessage, @ConnectedSocket() client: Socket): void {
    const roomMessage = this.messageFactoryService.makeRoomForwardMessage<PingUpdateMessage>(client, message);
    this.pubsubService.publishRoomForwardMessage(PING_UPDATE_EVENT, roomMessage);
  }

  @SubscribeMessage(SPECTATING_UPDATE_EVENT)
  handleSpectatingUpdateMessage(@MessageBody() message: SpectatingUpdateMessage, @ConnectedSocket() client: Socket): void {
    const roomMessage = this.messageFactoryService.makeRoomForwardMessage<SpectatingUpdateMessage>(client, message);
    this.pubsubService.publishRoomForwardMessage(SPECTATING_UPDATE_EVENT, roomMessage);
  }

  @SubscribeMessage(TIMESTAMP_UPDATE_EVENT)
  handleTimestampUpdateMessage(@MessageBody() message: TimestampUpdateMessage, @ConnectedSocket() client: Socket): void {
    const roomMessage = this.messageFactoryService.makeRoomForwardMessage<TimestampUpdateMessage>(client, message);
    this.pubsubService.publishRoomForwardMessage(TIMESTAMP_UPDATE_EVENT, roomMessage);
  }

  @SubscribeMessage(USER_CONTROLLER_CONNECT_EVENT)
  async handleUserControllerConnectMessage(@MessageBody() message: UserControllerConnectMessage, @ConnectedSocket() client: Socket): Promise<void> {
    const id = await this.idGenerationService.nextId();
    const roomMessage = this.messageFactoryService.makeRoomForwardMessage<PublishIdMessage<UserControllerConnectMessage>>(client, {id, message});
    this.pubsubService.publishRoomForwardMessage(USER_CONTROLLER_CONNECT_EVENT, roomMessage);
  }

  @SubscribeMessage(USER_CONTROLLER_DISCONNECT_EVENT)
  handleUserControllerDisconnectMessage(@MessageBody() message: UserControllerDisconnectMessage, @ConnectedSocket() client: Socket): void {
    const roomMessage = this.messageFactoryService.makeRoomForwardMessage<UserControllerDisconnectMessage>(client, message);
    this.pubsubService.publishRoomForwardMessage(USER_CONTROLLER_DISCONNECT_EVENT, roomMessage);
  }

  @SubscribeMessage(USER_POSITIONS_EVENT)
  handleUserPositionsMessage(@MessageBody() message: UserPositionsMessage, @ConnectedSocket() client: Socket): void {
    const roomMessage = this.messageFactoryService.makeRoomForwardMessage<UserPositionsMessage>(client, message);
    this.pubsubService.publishRoomForwardMessage(USER_POSITIONS_EVENT, roomMessage);
  }

  @SubscribeMessage(OBJECT_GRABBED_EVENT)
  async handleObjectGrabbedMessage(@MessageBody() message: ObjectGrabbedMessage, @ConnectedSocket() client: Socket): Promise<void> {
    const session = this.sessionService.lookupSession(client);
    const object = session.getRoom().getGrabModifier().getGrabbableObject(message.objectId);
    var success = false;
    if (object) {
      const lock = await this.pubsubService.lockGrabbableObject(object);
      if (lock) {
        const grabbableObjectLock = new GrabbableObjectLock(session.getUser(), object, lock);
        this.grabbableObjectLocks.set(object.getGrabId(), grabbableObjectLock);
        success = true;
      }
    }
    const response: ObjectGrabbedResponse = { nonce: message.nonce, success: success };
    this.sendResponse(OBJECT_GRABBED_EVENT, client, response);
  }

  @SubscribeMessage(OBJECT_MOVED_EVENT)
  handleObjectMovedMessage(@MessageBody() message: ObjectMovedMessage, @ConnectedSocket() client: Socket): void {
    const session = this.sessionService.lookupSession(client);
    const grabbableObjectLock = this.grabbableObjectLocks.get(message.objectId);
    if (grabbableObjectLock && grabbableObjectLock.isLockedByUser(session.getUser())) {
      const roomMessage = this.messageFactoryService.makeRoomForwardMessage<ObjectMovedMessage>(client, message);
      this.pubsubService.publishRoomForwardMessage(OBJECT_MOVED_EVENT, roomMessage);
    } 
  }

  @SubscribeMessage(OBJECT_RELEASED_EVENT)
  async handleObjectReleasedMessage(@MessageBody() message: ObjectReleasedMessage, @ConnectedSocket() client: Socket): Promise<void> {
    const session = this.sessionService.lookupSession(client);
    const grabbableObjectLock = this.grabbableObjectLocks.get(message.objectId);
    if (grabbableObjectLock && grabbableObjectLock.isLockedByUser(session.getUser())) {
      await this.pubsubService.releaseGrabbableObjectLock(grabbableObjectLock.getLock());
      this.grabbableObjectLocks.delete(message.objectId);
    }
  }

  @SubscribeMessage(APP_CLOSED_EVENT)
  async handleAppClosedMessage(@MessageBody() message: AppClosedMessage, @ConnectedSocket() client: Socket): Promise<void> {
    const session = this.sessionService.lookupSession(client);
    const object = session.getRoom().getGrabModifier().getGrabbableObject(message.appId);
    var success = false;
    if (object) {
      const lock = await this.pubsubService.lockGrabbableObject(object);
      if (lock) {
        success = true;
        const roomMessage = this.messageFactoryService.makeRoomForwardMessage<AppClosedMessage>(client, message);
        this.pubsubService.publishRoomForwardMessage(APP_CLOSED_EVENT, roomMessage);
      }
    }
    const response: ObjectClosedResponse = { nonce: message.nonce, success: success };
    this.sendResponse(OBJECT_CLOSED_RESPONSE_EVENT, client, response);
  }

  @SubscribeMessage(DETACHED_MENU_CLOSED_EVENT)
  async handleDetachedMenuClosedMessage(@MessageBody() message: DetachedMenuClosedMessage, @ConnectedSocket() client: Socket): Promise<void> {
    const session = this.sessionService.lookupSession(client);
    const object = session.getRoom().getGrabModifier().getGrabbableObject(message.menuId);
    var success = false;
    if (object) {
      const lock = await this.pubsubService.lockGrabbableObject(object);
      if (lock) {
        success = true;
        const roomMessage = this.messageFactoryService.makeRoomForwardMessage<DetachedMenuClosedMessage>(client, message);
        this.pubsubService.publishRoomForwardMessage(DETACHED_MENU_CLOSED_EVENT, roomMessage);
      }
    }
    const response: ObjectClosedResponse = { nonce: message.nonce, success: success };
    this.sendResponse(OBJECT_CLOSED_RESPONSE_EVENT, client, response);
  }

}
