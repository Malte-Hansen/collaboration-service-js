import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessageFactoryService } from 'src/factory/message-factory/message-factory.service';
import { IdGenerationService } from 'src/id-generation/id-generation.service';
import { LockService } from 'src/lock/lock.service';
import {
  ALL_HIGHLIGHTS_RESET_EVENT,
  AllHighlightsResetMessage,
} from 'src/message/client/receivable/all-highlights-reset-message';
import {
  APP_CLOSED_EVENT,
  AppClosedMessage,
} from 'src/message/client/receivable/app-closed-message';
import {
  APP_OPENED_EVENT,
  AppOpenedMessage,
} from 'src/message/client/receivable/app-opened-message';
import {
  COMPONENT_UPDATE_EVENT,
  ComponentUpdateMessage,
} from 'src/message/client/receivable/component-update-message';
import {
  DETACHED_MENU_CLOSED_EVENT,
  DetachedMenuClosedMessage,
} from 'src/message/client/receivable/detached-menu-closed-message';
import {
  HEATMAP_UPDATE_EVENT,
  HeatmapUpdateMessage,
} from 'src/message/client/receivable/heatmap-update-message';
import {
  HIGHLIGHTING_UPDATE_EVENT,
  HighlightingUpdateMessage,
} from 'src/message/client/receivable/highlighting-update-message';
import {
  JOIN_VR_EVENT,
  JoinVrMessage,
} from 'src/message/client/receivable/join-vr-message';
import {
  MENU_DETACHED_EVENT,
  MenuDetachedMessage,
} from 'src/message/client/receivable/menu-detached-message';
import {
  MOUSE_PING_UPDATE_EVENT,
  MousePingUpdateMessage,
} from 'src/message/client/receivable/mouse-ping-update-message';
import {
  OBJECT_GRABBED_EVENT,
  ObjectGrabbedMessage,
} from 'src/message/client/receivable/object-grabbed-message';
import {
  OBJECT_MOVED_EVENT,
  ObjectMovedMessage,
} from 'src/message/client/receivable/object-moved-message';
import {
  OBJECT_RELEASED_EVENT,
  ObjectReleasedMessage,
} from 'src/message/client/receivable/object-released-message';
import {
  PING_UPDATE_EVENT,
  PingUpdateMessage,
} from 'src/message/client/receivable/ping-update-message';
import {
  SPECTATING_UPDATE_EVENT,
  SpectatingUpdateMessage,
} from 'src/message/client/receivable/spectating-update-message';
import {
  TIMESTAMP_UPDATE_EVENT,
  TimestampUpdateMessage,
} from 'src/message/client/receivable/timestamp-update-message';
import {
  USER_CONTROLLER_CONNECT_EVENT,
  UserControllerConnectMessage,
} from 'src/message/client/receivable/user-controller-connect-message';
import {
  USER_CONTROLLER_DISCONNECT_EVENT,
  UserControllerDisconnectMessage,
} from 'src/message/client/receivable/user-controller-disconnect-message';
import {
  USER_POSITIONS_EVENT,
  UserPositionsMessage,
} from 'src/message/client/receivable/user-positions-message';
import {
  VISUALIZATION_MODE_UPDATE_EVENT,
  VisualizationModeUpdateMessage,
} from 'src/message/client/receivable/visualization-mode-update';
import { ForwardedMessage } from 'src/message/client/sendable/forwarded-message';
import { INITIAL_LANDSCAPE_EVENT } from 'src/message/client/sendable/initial-landscape-message';
import {
  MENU_DETACHED_RESPONSE_EVENT,
  MenuDetachedResponse,
} from 'src/message/client/sendable/menu-detached-response';
import {
  OBJECT_CLOSED_RESPONSE_EVENT,
  ObjectClosedResponse,
} from 'src/message/client/sendable/object-closed-response';
import {
  OBJECT_GRABBED_RESPONSE_EVENT,
  ObjectGrabbedResponse,
} from 'src/message/client/sendable/object-grabbed-response';
import { ResponseMessage } from 'src/message/client/sendable/response-message';
import { SELF_CONNECTED_EVENT } from 'src/message/client/sendable/self-connected-message';
import {
  USER_CONNECTED_EVENT,
  UserConnectedMessage,
} from 'src/message/client/sendable/user-connected-message';
import {
  USER_DISCONNECTED_EVENT,
  UserDisconnectedMessage,
} from 'src/message/client/sendable/user-disconnected-message';
import { PublishIdMessage } from 'src/message/pubsub/publish-id-message';
import { Room } from 'src/model/room-model';
import { PublisherService } from 'src/publisher/publisher.service';
import { RoomService } from 'src/room/room.service';
import { SessionService } from 'src/session/session.service';
import { TicketService } from 'src/ticket/ticket.service';
import { Session } from 'src/util/session';
import { Ticket } from 'src/util/ticket';
import { VisualizationMode } from 'src/util/visualization-mode';

@WebSocketGateway({ cors: true })
export class WebsocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly ticketService: TicketService,
    private readonly sessionService: SessionService,
    private readonly roomService: RoomService,
    private readonly messageFactoryService: MessageFactoryService,
    private readonly idGenerationService: IdGenerationService,
    private readonly lockService: LockService,
    private readonly publisherService: PublisherService,
  ) {}

  @WebSocketServer()
  server: Server;

  async handleConnection(client: Socket) {
    console.log('WebSocket connected');

    // Query params
    const ticketId: string = client.handshake.query.ticketId as string;
    const userName: string = client.handshake.query.userName as string;
    const deviceId: string = client.handshake.query.deviceId as string;
    const mode: VisualizationMode = client.handshake.query
      .mode as VisualizationMode;

    let ticket: Ticket;
    let room: Room;

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
    const user = room
      .getUserModifier()
      .makeUserModel(
        ticket.userId,
        userName,
        deviceId,
        colorId,
        [0, 0, 0],
        [0, 0, 0, 0],
      );
    room.getUserModifier().addUser(user);
    const roomMessage =
      this.messageFactoryService.makeRoomStatusMessage<UserConnectedMessage>(
        room.getRoomId(),
        {
          id: user.getId(),
          name: user.getUserName(),
          deviceId: user.getDeviceId(),
          color: user.getColor(),
          position: user.getPosition(),
          quaternion: user.getQuaternion(),
        },
      );
    this.publisherService.publishRoomStatusMessage(
      USER_CONNECTED_EVENT,
      roomMessage,
    );

    // Register session
    const session = new Session(client, room, user);
    this.sessionService.register(session);

    // Add socket to IO Room
    client.join(room.getRoomId());

    // Add to VR room if user should receive AR/VR messages
    if (mode != 'browser') client.join(this.getVrRoom(room.getRoomId()));

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

    // Release all locks
    this.lockService.releaseAllLockByUser(session.getUser());

    const message: UserDisconnectedMessage = {
      id: session.getUser().getId(),
      highlightedComponents: session.getUser().getHighlightedEntities(),
    };
    this.publisherService.publishRoomStatusMessage(
      USER_DISCONNECTED_EVENT,
      this.messageFactoryService.makeRoomStatusMessage(
        session.getRoom().getRoomId(),
        message,
      ),
    );
  }

  // UTIL

  /**
   * Gets Socket.IO's room identifier for broadcasting to all AR/VR users of a virtual room.
   *
   * @param roomId The ID of the virtual room
   * @returns Socket.IO's room identifier
   */
  private getVrRoom(roomId: string): string {
    return roomId + '-vr';
  }

  /**
   * Gets Socket.IO's room identifier for broadcasting to all spectating users of a virtual room.
   *
   * @param roomId The ID of the virtual room
   * @returns Socket.IO's room identifier
   */
  private getSpectatingRoom(roomId: string): string {
    return roomId + '-spectating';
  }

  // SEND

  private sendUnicastMessage(
    event: string,
    client: Socket,
    message: any,
  ): void {
    this.server.to(client.id).emit(event, message);
  }

  /**
   * Broadcasts a user's position to all AR/VR and spectating clients within a room. Excludes the intial sender of the message.
   *
   * @param roomId The ID of the room
   * @param message The message which encapsulated the user's position
   */
  sendUserPositionsMessage(
    roomId: string,
    message: ForwardedMessage<UserPositionsMessage>,
  ): void {
    const userId = message.userId;
    const client = this.sessionService.lookupSocket(userId);
    if (client) {
      // Exclude sender of the message if it is connected to the server
      client
        .to(this.getVrRoom(roomId))
        .to(this.getSpectatingRoom(roomId))
        .emit(USER_POSITIONS_EVENT, message);
    } else {
      // Otherwise send to all clients
      this.server
        .to(this.getVrRoom(roomId))
        .to(this.getSpectatingRoom(roomId))
        .emit(USER_POSITIONS_EVENT, message);
    }
  }

  /**
   * Broadcasts a forwarded event to all AR/VR clients within a room. Excludes the intial sender of the message.
   *
   * @param event The event
   * @param roomId The ID of the room
   * @param message The message which encapsulated the client-triggered event
   */
  sendVrOnlyForwardedMessage(
    event: string,
    roomId: string,
    message: ForwardedMessage<any>,
  ): void {
    const userId = message.userId;
    const client = this.sessionService.lookupSocket(userId);
    if (client) {
      // Exclude sender of the message if it is connected to the server
      client.to(this.getVrRoom(roomId)).emit(event, message);
    } else {
      // Otherwise send to all clients
      this.server.to(this.getVrRoom(roomId)).emit(event, message);
    }
  }

  /**
   * Broadcasts an event to all clients within a room. Excludes the provided user.
   *
   * @param event The event
   * @param roomId The ID of the room
   * @param userId The ID of the user
   * @param message The message which encapsulates event-specific data
   */
  sendBroadcastExceptOneMessage(
    event: string,
    roomId: string,
    userId: string,
    message: any,
  ): void {
    const client = this.sessionService.lookupSocket(userId);
    if (client) {
      // Exclude sender of the message if it is connected to the server
      client.to(roomId).emit(event, message);
    } else {
      // Otherwise send to all clients
      this.server.to(roomId).emit(event, message);
    }
  }

  /**
   * Broadcasts an event to all clients within a room.
   *
   * @param event The event
   * @param roomId The ID of the room
   * @param message The message which encapsulates event-specific data
   */
  sendBroadcastMessage(event: string, roomId: string, message: any) {
    this.server.to(roomId).emit(event, message);
  }

  /**
   * Broadcasts a forwarded event to all clients within a room. Excludes the intial sender of the message.
   *
   * @param event The event
   * @param roomId The ID of the room
   * @param message The message which encapsulated the client-triggered event
   */
  sendBroadcastForwardedMessage(
    event: string,
    roomId: string,
    message: ForwardedMessage<any>,
  ): void {
    this.sendBroadcastExceptOneMessage(event, roomId, message.userId, message);
  }

  /**
   * Sends the current list of users to a client.
   *
   * @param session The session which corresponds to the client
   */
  sendInitialUserList(session: Session): void {
    const message = this.messageFactoryService.makeSelfConnectedMessage(
      session.getRoom(),
      session.getUser(),
    );
    this.sendUnicastMessage(SELF_CONNECTED_EVENT, session.getSocket(), message);
  }

  /**
   * Sends the current landscape to a client.
   *
   * @param session The session which corresponds to the client
   */
  sendLandscape(session: Session): void {
    const message = this.messageFactoryService.makeInitialLandscapeMessage(
      session.getRoom(),
    );
    this.sendUnicastMessage(
      INITIAL_LANDSCAPE_EVENT,
      session.getSocket(),
      message,
    );
  }

  /**
   * Sends a response to a client which corresponds to a previous request event.
   *
   * @param event The event
   * @param client The client
   * @param nonce The Nonce which matches request and response
   * @param message The message which encapsulates the event-specific data
   */
  sendResponse(
    event: string,
    client: Socket,
    nonce: number,
    message: any,
  ): void {
    const response: ResponseMessage<any> = { nonce, response: message };
    this.sendUnicastMessage(event, client, response);
  }

  // SUBSCRIPTION HANDLERS

  @SubscribeMessage(VISUALIZATION_MODE_UPDATE_EVENT)
  handleVisualizationModeUpdateMessage(
    @MessageBody() message: VisualizationModeUpdateMessage,
    @ConnectedSocket() client: Socket,
  ): void {
    const session = this.sessionService.lookupSession(client);
    const vrRoom = this.getVrRoom(session.getRoom().getRoomId());
    if (message.mode == 'browser') {
      client.leave(vrRoom);
    } else {
      client.join(vrRoom);
    }
  }

  @SubscribeMessage(MENU_DETACHED_EVENT)
  async handleMenuDetachedMessage(
    @MessageBody() message: MenuDetachedMessage,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const id = await this.idGenerationService.nextId();
    const roomMessage = this.messageFactoryService.makeRoomForwardMessage<
      PublishIdMessage<MenuDetachedMessage>
    >(client, { id: id, message: message });
    this.publisherService.publishRoomForwardMessage(
      MENU_DETACHED_EVENT,
      roomMessage,
    );
    const response: MenuDetachedResponse = { objectId: id };
    this.sendResponse(
      MENU_DETACHED_RESPONSE_EVENT,
      client,
      message.nonce,
      response,
    );
  }

  @SubscribeMessage(APP_OPENED_EVENT)
  handleAppOpenedMessage(
    @MessageBody() message: AppOpenedMessage,
    @ConnectedSocket() client: Socket,
  ): void {
    const roomMessage =
      this.messageFactoryService.makeRoomForwardMessage<AppOpenedMessage>(
        client,
        message,
      );
    this.publisherService.publishRoomForwardMessage(
      APP_OPENED_EVENT,
      roomMessage,
    );
  }

  @SubscribeMessage(COMPONENT_UPDATE_EVENT)
  handleComponentUpdateMessage(
    @MessageBody() message: ComponentUpdateMessage,
    @ConnectedSocket() client: Socket,
  ): void {
    const roomMessage =
      this.messageFactoryService.makeRoomForwardMessage<ComponentUpdateMessage>(
        client,
        message,
      );
    this.publisherService.publishRoomForwardMessage(
      COMPONENT_UPDATE_EVENT,
      roomMessage,
    );
  }

  @SubscribeMessage(HEATMAP_UPDATE_EVENT)
  handleHeatmapUpdateMessage(
    @MessageBody() message: HeatmapUpdateMessage,
    @ConnectedSocket() client: Socket,
  ): void {
    const roomMessage =
      this.messageFactoryService.makeRoomForwardMessage<HeatmapUpdateMessage>(
        client,
        message,
      );
    this.publisherService.publishRoomForwardMessage(
      HEATMAP_UPDATE_EVENT,
      roomMessage,
    );
  }

  @SubscribeMessage(HIGHLIGHTING_UPDATE_EVENT)
  handleHighlightingUpdateMessage(
    @MessageBody() message: HighlightingUpdateMessage,
    @ConnectedSocket() client: Socket,
  ): void {
    const roomMessage =
      this.messageFactoryService.makeRoomForwardMessage<HighlightingUpdateMessage>(
        client,
        message,
      );
    this.publisherService.publishRoomForwardMessage(
      HIGHLIGHTING_UPDATE_EVENT,
      roomMessage,
    );
  }

  @SubscribeMessage(ALL_HIGHLIGHTS_RESET_EVENT)
  handleAllHighlightsResetMessage(
    @MessageBody() message: AllHighlightsResetMessage,
    @ConnectedSocket() client: Socket,
  ): void {
    const roomMessage =
      this.messageFactoryService.makeRoomForwardMessage<AllHighlightsResetMessage>(
        client,
        message,
      );
    this.publisherService.publishRoomForwardMessage(
      ALL_HIGHLIGHTS_RESET_EVENT,
      roomMessage,
    );
  }

  @SubscribeMessage(JOIN_VR_EVENT)
  handleJoinVrMessage(
    @MessageBody() message: JoinVrMessage,
    @ConnectedSocket() client: Socket,
  ): void {
    const roomMessage =
      this.messageFactoryService.makeRoomForwardMessage<JoinVrMessage>(
        client,
        message,
      );
    this.publisherService.publishRoomForwardMessage(JOIN_VR_EVENT, roomMessage);
  }

  @SubscribeMessage(MOUSE_PING_UPDATE_EVENT)
  handleMousePingUpdateMessage(
    @MessageBody() message: MousePingUpdateMessage,
    @ConnectedSocket() client: Socket,
  ): void {
    const roomMessage =
      this.messageFactoryService.makeRoomForwardMessage<MousePingUpdateMessage>(
        client,
        message,
      );
    this.publisherService.publishRoomForwardMessage(
      MOUSE_PING_UPDATE_EVENT,
      roomMessage,
    );
  }

  @SubscribeMessage(PING_UPDATE_EVENT)
  handlePingUpdateMessage(
    @MessageBody() message: PingUpdateMessage,
    @ConnectedSocket() client: Socket,
  ): void {
    const roomMessage =
      this.messageFactoryService.makeRoomForwardMessage<PingUpdateMessage>(
        client,
        message,
      );
    this.publisherService.publishRoomForwardMessage(
      PING_UPDATE_EVENT,
      roomMessage,
    );
  }

  @SubscribeMessage(SPECTATING_UPDATE_EVENT)
  handleSpectatingUpdateMessage(
    @MessageBody() message: SpectatingUpdateMessage,
    @ConnectedSocket() client: Socket,
  ): void {
    const session = this.sessionService.lookupSession(client);
    const roomId = session.getRoom().getRoomId();

    // Put spectating clients in a special room since those should receive positional updates
    const spectatingClients: Socket[] = [];
    message.spectatingUsers.forEach((userId) => {
      spectatingClients.push(this.sessionService.lookupSocket(userId));
    });

    if (message.isSpectating) {
      spectatingClients.forEach((spectatingClient) => {
        spectatingClient.join(this.getSpectatingRoom(roomId));
      });
    } else {
      spectatingClients.forEach((spectatingClient) => {
        spectatingClient.leave(this.getSpectatingRoom(roomId));
      });
    }

    const roomMessage =
      this.messageFactoryService.makeRoomForwardMessage<SpectatingUpdateMessage>(
        client,
        message,
      );
    this.publisherService.publishRoomForwardMessage(
      SPECTATING_UPDATE_EVENT,
      roomMessage,
    );
  }

  @SubscribeMessage(TIMESTAMP_UPDATE_EVENT)
  handleTimestampUpdateMessage(
    @MessageBody() message: TimestampUpdateMessage,
    @ConnectedSocket() client: Socket,
  ): void {
    const roomMessage =
      this.messageFactoryService.makeRoomForwardMessage<TimestampUpdateMessage>(
        client,
        message,
      );
    this.publisherService.publishRoomForwardMessage(
      TIMESTAMP_UPDATE_EVENT,
      roomMessage,
    );
  }

  @SubscribeMessage(USER_CONTROLLER_CONNECT_EVENT)
  async handleUserControllerConnectMessage(
    @MessageBody() message: UserControllerConnectMessage,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const id = await this.idGenerationService.nextId();
    const roomMessage = this.messageFactoryService.makeRoomForwardMessage<
      PublishIdMessage<UserControllerConnectMessage>
    >(client, { id, message });
    this.publisherService.publishRoomForwardMessage(
      USER_CONTROLLER_CONNECT_EVENT,
      roomMessage,
    );
  }

  @SubscribeMessage(USER_CONTROLLER_DISCONNECT_EVENT)
  handleUserControllerDisconnectMessage(
    @MessageBody() message: UserControllerDisconnectMessage,
    @ConnectedSocket() client: Socket,
  ): void {
    const roomMessage =
      this.messageFactoryService.makeRoomForwardMessage<UserControllerDisconnectMessage>(
        client,
        message,
      );
    this.publisherService.publishRoomForwardMessage(
      USER_CONTROLLER_DISCONNECT_EVENT,
      roomMessage,
    );
  }

  @SubscribeMessage(USER_POSITIONS_EVENT)
  handleUserPositionsMessage(
    @MessageBody() message: UserPositionsMessage,
    @ConnectedSocket() client: Socket,
  ): void {
    const roomMessage =
      this.messageFactoryService.makeRoomForwardMessage<UserPositionsMessage>(
        client,
        message,
      );
    this.publisherService.publishRoomForwardMessage(
      USER_POSITIONS_EVENT,
      roomMessage,
    );
  }

  @SubscribeMessage(OBJECT_GRABBED_EVENT)
  async handleObjectGrabbedMessage(
    @MessageBody() message: ObjectGrabbedMessage,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const session = this.sessionService.lookupSession(client);
    const object = session
      .getRoom()
      .getGrabModifier()
      .getGrabbableObject(message.objectId);
    let success = false;
    if (object) {
      success = await this.lockService.lockGrabbableObject(
        session.getRoom(),
        session.getUser(),
        object,
      );
    }
    const response: ObjectGrabbedResponse = { isSuccess: success };
    this.sendResponse(
      OBJECT_GRABBED_RESPONSE_EVENT,
      client,
      message.nonce,
      response,
    );
  }

  @SubscribeMessage(OBJECT_MOVED_EVENT)
  handleObjectMovedMessage(
    @MessageBody() message: ObjectMovedMessage,
    @ConnectedSocket() client: Socket,
  ): void {
    const session = this.sessionService.lookupSession(client);
    if (this.lockService.isLockedByUser(session.getUser(), message.objectId)) {
      const roomMessage =
        this.messageFactoryService.makeRoomForwardMessage<ObjectMovedMessage>(
          client,
          message,
        );
      this.publisherService.publishRoomForwardMessage(
        OBJECT_MOVED_EVENT,
        roomMessage,
      );
    }
  }

  @SubscribeMessage(OBJECT_RELEASED_EVENT)
  async handleObjectReleasedMessage(
    @MessageBody() message: ObjectReleasedMessage,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const session = this.sessionService.lookupSession(client);
    this.lockService.releaseGrabbableObjectLock(
      session.getUser(),
      message.objectId,
    );
  }

  @SubscribeMessage(APP_CLOSED_EVENT)
  async handleAppClosedMessage(
    @MessageBody() message: AppClosedMessage,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const session = this.sessionService.lookupSession(client);
    const object = session
      .getRoom()
      .getGrabModifier()
      .getGrabbableObject(message.appId);
    let success = false;
    if (object) {
      success = await this.lockService.closeGrabbableObject(
        session.getRoom(),
        object,
      );
      if (success) {
        const roomMessage =
          this.messageFactoryService.makeRoomForwardMessage<AppClosedMessage>(
            client,
            message,
          );
        this.publisherService.publishRoomForwardMessage(
          APP_CLOSED_EVENT,
          roomMessage,
        );
      }
    }
    const response: ObjectClosedResponse = { isSuccess: success };
    this.sendResponse(
      OBJECT_CLOSED_RESPONSE_EVENT,
      client,
      message.nonce,
      response,
    );
  }

  @SubscribeMessage(DETACHED_MENU_CLOSED_EVENT)
  async handleDetachedMenuClosedMessage(
    @MessageBody() message: DetachedMenuClosedMessage,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const session = this.sessionService.lookupSession(client);
    const object = session
      .getRoom()
      .getGrabModifier()
      .getGrabbableObject(message.menuId);
    let success = false;
    if (object) {
      success = await this.lockService.closeGrabbableObject(
        session.getRoom(),
        object,
      );
      if (success) {
        const roomMessage =
          this.messageFactoryService.makeRoomForwardMessage<DetachedMenuClosedMessage>(
            client,
            message,
          );
        this.publisherService.publishRoomForwardMessage(
          DETACHED_MENU_CLOSED_EVENT,
          roomMessage,
        );
      }
    }
    const response: ObjectClosedResponse = { isSuccess: success };
    this.sendResponse(
      OBJECT_CLOSED_RESPONSE_EVENT,
      client,
      message.nonce,
      response,
    );
  }
}
