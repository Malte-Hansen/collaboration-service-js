import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { Redis } from 'ioredis';
import { EXAMPLE_EVENT, ExampleMessage } from 'src/message/client/receivable/example-message';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { WebsocketGateway } from 'src/websocket/websocket.gateway';
import { Ticket } from 'src/util/ticket';
import { CREATE_ROOM_EVENT, CreateRoomMessage } from 'src/message/pubsub/create-room-message';
import { RoomService } from 'src/room/room.service';
import { JOIN_USER_EVENT, JoinUserMessage } from 'src/message/pubsub/join-user-message';
import { RoomForwardMessage } from 'src/message/pubsub/room-forward-message';
import { USER_DISCONNECTED_EVENT, UserDisconnectedMessage } from 'src/message/client/sendable/user-disconnected-message';
import { RoomStatusMessage } from 'src/message/pubsub/room-status-message';
import { UserModel } from 'src/model/user-model';
import Redlock from "redlock";
import { GrabbableObjectModel } from 'src/model/grabbable-object-model';
import { MENU_DETACHED_EVENT } from 'src/message/client/receivable/menu-detached-message';
import { PublishedMenuDetachedMessage } from 'src/message/pubsub/published-menu-detached-message';
import { MenuDetachedForwardMessage } from 'src/message/client/sendable/menu-detached-forward-message';

const UNIQUE_ID_KEY = 'unique_id';

@Injectable()
export class PubsubService {

  private readonly cacheClient: Redis;
  private readonly publisher: Redis;
  private readonly subscriber: Redis;
  private readonly redlock: Redlock;

  constructor(private readonly redisService: RedisService, private readonly roomService: RoomService,
    @Inject(forwardRef(() => WebsocketGateway)) private readonly websocketGateway: WebsocketGateway) {

    this.publisher = this.redisService.getClient();
    this.subscriber = this.publisher.duplicate();
    this.cacheClient = this.publisher.duplicate();
    this.redlock = new Redlock([this.publisher.duplicate()], {
      retryCount: 5, retryDelay: 100
    });

    // Register event listener
    const listener: Map<string, (...args: any) => void> = new Map();
    listener.set(CREATE_ROOM_EVENT, this.handleCreateRoomEvent.bind(this));
    listener.set(JOIN_USER_EVENT, this.handleJoinUserEvent.bind(this));
    listener.set(USER_DISCONNECTED_EVENT, this.handleDisconnetedEvent.bind(this));
    listener.set(EXAMPLE_EVENT, (msg: any) => this.handleExampleEvent(EXAMPLE_EVENT, msg));
    listener.set(MENU_DETACHED_EVENT, (msg: any) => this.handleMenuDetachedEvent(MENU_DETACHED_EVENT, msg));


    // Subscribe channels
    for (var channel of listener.keys()) {
      this.subscriber.subscribe(channel);
    }

    this.subscriber.on('message', (channel: string, data: string) => {
      const message = JSON.parse(data);
      if (listener.has(channel)) {
        // call handler method
        listener.get(channel)(message);
      }
    });
  }

  /// UTIL

  private getTicketKey(ticketId: string): string {
    return 'ticket-' + ticketId;
  }

  private getGrabbableObjectLock(grabId: string): string {
    return 'grab-' + grabId;
  }

  private publish(channel: string, message: any) {
    this.publisher.publish(channel, JSON.stringify(message));
  }

  /// KEY VALUE STORAGE

  async getUniqueId(): Promise<number> {
    const keyExists = await this.cacheClient.exists(UNIQUE_ID_KEY);
    if (keyExists == 0) {
      this.cacheClient.set(UNIQUE_ID_KEY, 0);
    }
    const nextUniqueKey = this.cacheClient.incr(UNIQUE_ID_KEY);
    return nextUniqueKey;
  }

  async storeTicket(ticket: Ticket): Promise<void> {
    await this.cacheClient.set(this.getTicketKey(ticket.ticketId), JSON.stringify(ticket));
  }

  async getTicket(ticketId: string): Promise<Ticket | null> {
    const ticket = await this.cacheClient.get(this.getTicketKey(ticketId));
    return ticket ? JSON.parse(ticket) : null;
  }

  // LOCK

  async lockGrabbableObject(grabbableObject: GrabbableObjectModel): Promise<any> {
    try {
      return await this.redlock.acquire([this.getGrabbableObjectLock(grabbableObject.getGrabId())], Number.MAX_SAFE_INTEGER);
    } catch (error) {
      return null;
    }
  }

  async releaseGrabbableObjectLock(lock: any) {
    await this.redlock.release(lock);
  }


  /// PUBLISH EVENT

  publishCreateRoomEvent(message: CreateRoomMessage) {
    this.publish(CREATE_ROOM_EVENT, message);
  }

  publishJoinUserEvent(message: RoomStatusMessage<JoinUserMessage>) {
    this.publish(JOIN_USER_EVENT, message);
  }

  publishUserDisconnectedEvent(message: RoomStatusMessage<UserDisconnectedMessage>) {
    this.publish(USER_DISCONNECTED_EVENT, message);
  }

  publishRoomForwardMessage(event: string, message: RoomForwardMessage<any>): void {
    this.publish(event, message);
  }

  // SUBSCRIPTION HANDLERS

  private handleCreateRoomEvent(message: CreateRoomMessage) {
    const publishedLandscape = message.initialRoom.landscape;
    const room = this.roomService.createRoom(message.roomId, publishedLandscape.id);
    //room.getExampleModifier().updateExample(message.initialRoom.example.value);
    // TODO init model 
    room.getLandscapeModifier().initLandscape(publishedLandscape.landscape.landscapeToken, publishedLandscape.landscape.timestamp);
    
    for (const app of message.initialRoom.openApps) {
      room.getApplicationModifier().openApplication(app.id, app.position, app.quaternion, app.scale);
      for (const componentId of app.openComponents) {
        room.getApplicationModifier().updateComponent(componentId, app.id, false, true);
      }
    }
    
    // TODO get unique id for detached menus
    for (const detachedMenu of message.initialRoom.detachedMenus) {
      room.getDetachedMenuModifier().detachMenu(detachedMenu.id, detachedMenu.menu.entityId, detachedMenu.menu.entityType, 
        detachedMenu.menu.position, detachedMenu.menu.quaternion, detachedMenu.menu.scale);
    }
  }

  private handleJoinUserEvent(message: RoomStatusMessage<JoinUserMessage>) {
    const room = this.roomService.lookupRoom(message.roomId);

    var user: UserModel;

    // Done, if user was already added by this instance
    if (!room.getUserModifier().hasUser(message.message.userId)) {
      // Create user
      user = room.getUserModifier().makeUserModel(message.message.userId, message.message.userName, message.message.colorId);

      // Add user to room
      room.getUserModifier().addUser(user);
    } else {
      user = room.getUserModifier().getUserById(message.message.userId);
    }

    // Inform other users
    this.websocketGateway.sendUserConnectedMessage(room.getRoomId(), {
      id: user.getId(),
      name: user.getUserName(),
      color: user.getColor(),
      position: user.getPosition(),
      quaternion: user.getQuaternion()
    })
  }

  private handleDisconnetedEvent(message: RoomStatusMessage<UserDisconnectedMessage>) {
    const room = this.roomService.lookupRoom(message.roomId);

    // User leaves room
    room.getUserModifier().removeUser(message.message.id);

    // Delete room if empty
    if (room.getUserModifier().getUsers().length == 0) {
      this.roomService.deleteRoom(room.getRoomId());
    }
  }

  private handleExampleEvent(event: string, message: RoomForwardMessage<ExampleMessage>) {
    const room = this.roomService.lookupRoom(message.roomId);
    room.getExampleModifier().updateExample(message.message.value);
    this.websocketGateway.sendBroadcastForwardedMessage(event, message.roomId, { userId: message.userId, message: message.message });
  }

  private handleMenuDetachedEvent(event: string, message: RoomForwardMessage<PublishedMenuDetachedMessage>) {
    const room = this.roomService.lookupRoom(message.roomId);
    const menu = message.message.message;
    room.getDetachedMenuModifier().detachMenu(message.message.id, menu.detachId, menu.entityType, 
      menu.position, menu.quaternion, menu.scale);
    const menuDetachedForwardMessage: MenuDetachedForwardMessage = {
      objectId: message.message.id, userId: message.userId, entityType: menu.entityType, detachId: menu.detachId,
      position: menu.position, quaternion: menu.quaternion, scale: menu.scale
    }
    this.websocketGateway.sendBroadcastMessage(event, message.roomId, menuDetachedForwardMessage);
  }

}
