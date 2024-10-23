import { RedisService } from '@liaoliaots/nestjs-redis';
import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { Redis } from 'ioredis';
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
  CHANGE_LANDSCAPE_EVENT,
  ChangeLandscapeMessage,
} from 'src/message/client/receivable/change-landscape-message';
import {
  CHAT_MESSAGE_EVENT,
  ChatMessage,
} from 'src/message/client/receivable/chat-message';
import {
  CHAT_SYNC_EVENT,
  ChatSynchronizeResponse,
} from 'src/message/client/sendable/chat-sync-response';
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
  OBJECT_MOVED_EVENT,
  ObjectMovedMessage,
} from 'src/message/client/receivable/object-moved-message';
import {
  PING_UPDATE_EVENT,
  PingUpdateMessage,
} from 'src/message/client/receivable/ping-update-message';
import {
  SHARE_SETTINGS_EVENT,
  ShareSettingsMessage,
} from 'src/message/client/receivable/share-settings-message';
import {
  SPECTATING_UPDATE_EVENT,
  SpectatingUpdateMessage,
} from 'src/message/client/receivable/spectating-update-message';
import {
  SYNC_ROOM_STATE_EVENT,
  SyncRoomStateMessage,
} from 'src/message/client/receivable/sync-room-state-message';
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
import { MenuDetachedForwardMessage } from 'src/message/client/sendable/menu-detached-forward-message';
import {
  TIMESTAMP_UPDATE_TIMER_EVENT,
  TimestampUpdateTimerMessage,
} from 'src/message/client/sendable/timestamp-update-timer-message';
import {
  USER_CONNECTED_EVENT,
  UserConnectedMessage,
} from 'src/message/client/sendable/user-connected-message';
import {
  USER_DISCONNECTED_EVENT,
  UserDisconnectedMessage,
} from 'src/message/client/sendable/user-disconnected-message';
import {
  CREATE_ROOM_EVENT,
  CreateRoomMessage,
} from 'src/message/pubsub/create-room-message';
import { PublishIdMessage } from 'src/message/pubsub/publish-id-message';
import { RoomForwardMessage } from 'src/message/pubsub/room-forward-message';
import { RoomStatusMessage } from 'src/message/pubsub/room-status-message';
import { UserModel } from 'src/model/user-model';
import { RoomService } from 'src/room/room.service';
import { WebsocketGateway } from 'src/websocket/websocket.gateway';
import {
  USER_KICK_EVENT,
  UserKickEvent,
} from 'src/message/client/receivable/user-kick-event';
import {
  MESSAGE_DELETE_EVENT,
  MessageDeleteEvent,
} from 'src/message/client/receivable/delete-message';

@Injectable()
export class SubscriberService {
  private readonly redis: Redis;

  constructor(
    private readonly redisService: RedisService,
    private readonly roomService: RoomService,
    @Inject(forwardRef(() => WebsocketGateway))
    private readonly websocketGateway: WebsocketGateway,
  ) {
    this.redis = this.redisService.getClient().duplicate();

    // Register callbacks for Redis notifications
    const listener: Map<string, (...args: any) => void> = new Map();
    listener.set(CREATE_ROOM_EVENT, this.handleCreateRoomEvent.bind(this));
    listener.set(USER_CONNECTED_EVENT, (msg: any) =>
      this.handleUserConnectedEvent(USER_CONNECTED_EVENT, msg),
    );
    listener.set(USER_DISCONNECTED_EVENT, (msg: any) =>
      this.handleUserDisconnectedEvent(USER_DISCONNECTED_EVENT, msg),
    );
    listener.set(MENU_DETACHED_EVENT, (msg: any) =>
      this.handleMenuDetachedEvent(MENU_DETACHED_EVENT, msg),
    );
    listener.set(APP_OPENED_EVENT, (msg: any) =>
      this.handleAppOpenedEvent(APP_OPENED_EVENT, msg),
    );
    listener.set(CHANGE_LANDSCAPE_EVENT, (msg: any) =>
      this.handleChangeLandscapeEvent(CHANGE_LANDSCAPE_EVENT, msg),
    );
    listener.set(COMPONENT_UPDATE_EVENT, (msg: any) =>
      this.handleComponentUpdateEvent(COMPONENT_UPDATE_EVENT, msg),
    );
    listener.set(HEATMAP_UPDATE_EVENT, (msg: any) =>
      this.handleHeatmapUpdateEvent(HEATMAP_UPDATE_EVENT, msg),
    );
    listener.set(HIGHLIGHTING_UPDATE_EVENT, (msg: any) =>
      this.handleHighlightingUpdateEvent(HIGHLIGHTING_UPDATE_EVENT, msg),
    );
    listener.set(ALL_HIGHLIGHTS_RESET_EVENT, (msg: any) =>
      this.handleAllHighlightsResetEvent(ALL_HIGHLIGHTS_RESET_EVENT, msg),
    );
    listener.set(MOUSE_PING_UPDATE_EVENT, (msg: any) =>
      this.handleMousePingUpdateEvent(MOUSE_PING_UPDATE_EVENT, msg),
    );
    listener.set(PING_UPDATE_EVENT, (msg: any) =>
      this.handlePingUpdateEvent(PING_UPDATE_EVENT, msg),
    );
    listener.set(SHARE_SETTINGS_EVENT, (msg: any) =>
      this.handleShareSettingsEvent(SHARE_SETTINGS_EVENT, msg),
    );
    listener.set(SPECTATING_UPDATE_EVENT, (msg: any) =>
      this.handleSpectatingUpdateEvent(SPECTATING_UPDATE_EVENT, msg),
    );
    listener.set(SYNC_ROOM_STATE_EVENT, (msg: any) =>
      this.handleSyncRoomStateEvent(SYNC_ROOM_STATE_EVENT, msg),
    );
    listener.set(TIMESTAMP_UPDATE_EVENT, (msg: any) =>
      this.handleTimestampUpdateEvent(TIMESTAMP_UPDATE_EVENT, msg),
    );
    listener.set(USER_CONTROLLER_CONNECT_EVENT, (msg: any) =>
      this.handleUserControllerConnectEvent(USER_CONTROLLER_CONNECT_EVENT, msg),
    );
    listener.set(USER_CONTROLLER_DISCONNECT_EVENT, (msg: any) =>
      this.handleUserControllerDisconnectEvent(
        USER_CONTROLLER_DISCONNECT_EVENT,
        msg,
      ),
    );
    listener.set(USER_POSITIONS_EVENT, (msg: any) =>
      this.handleUserPositionsEvent(USER_POSITIONS_EVENT, msg),
    );
    listener.set(TIMESTAMP_UPDATE_TIMER_EVENT, (msg: any) =>
      this.handleTimestampUpdateTimerEvent(TIMESTAMP_UPDATE_TIMER_EVENT, msg),
    );
    listener.set(OBJECT_MOVED_EVENT, (msg: any) =>
      this.handleObjectMovedEvent(OBJECT_MOVED_EVENT, msg),
    );
    listener.set(APP_CLOSED_EVENT, (msg: any) =>
      this.handleAppClosedEvent(APP_CLOSED_EVENT, msg),
    );
    listener.set(DETACHED_MENU_CLOSED_EVENT, (msg: any) =>
      this.handleDetachedMenuClosedEvent(DETACHED_MENU_CLOSED_EVENT, msg),
    );
    listener.set(JOIN_VR_EVENT, (msg: any) =>
      this.handleJoinVrEvent(JOIN_VR_EVENT, msg),
    );
    listener.set(CHAT_MESSAGE_EVENT, (msg: any) =>
      this.handleChatMessageEvent(CHAT_MESSAGE_EVENT, msg),
    );
    listener.set(CHAT_SYNC_EVENT, (msg: any) =>
      this.handleChatSyncEvent(CHAT_SYNC_EVENT, msg),
    );
    listener.set(USER_KICK_EVENT, (msg: any) =>
      this.handleUserKickEvent(USER_KICK_EVENT, msg),
    );
    listener.set(MESSAGE_DELETE_EVENT, (msg: any) =>
      this.handleMessageDeleteEvent(MESSAGE_DELETE_EVENT, msg),
    );

    // Subscribe to Redis channels
    for (const channel of listener.keys()) {
      this.redis.subscribe(channel);
    }

    this.redis.on('message', (channel: string, data: string) => {
      const message = JSON.parse(data);
      if (listener.has(channel)) {
        // Invoke event-specific callback
        listener.get(channel)(message);
      }
    });
  }

  // SUBSCRIPTION HANDLERS

  private handleCreateRoomEvent(message: CreateRoomMessage) {
    const publishedLandscape = message.initialRoom.landscape;

    // Initiliaze room and landscape
    const room = this.roomService.createRoom(
      message.roomId,
      publishedLandscape.id,
    );
    room
      .getLandscapeModifier()
      .initLandscape(
        publishedLandscape.landscape.landscapeToken,
        publishedLandscape.landscape.timestamp,
      );

    // Initialize apps and components
    for (const app of message.initialRoom.openApps) {
      room
        .getApplicationModifier()
        .openApplication(app.id, app.position, app.quaternion, app.scale);
      for (const componentId of app.openComponents) {
        room
          .getApplicationModifier()
          .updateComponent(componentId, app.id, false, true);
      }
    }

    // Initialize detached menus
    for (const detachedMenu of message.initialRoom.detachedMenus) {
      room
        .getDetachedMenuModifier()
        .detachMenu(
          detachedMenu.id,
          detachedMenu.menu.entityId,
          detachedMenu.menu.entityType,
          detachedMenu.menu.userId,
          detachedMenu.menu.position,
          detachedMenu.menu.quaternion,
          detachedMenu.menu.scale,
        );
    }
  }

  private handleSyncRoomStateEvent(
    event: string,
    roomMessage: RoomForwardMessage<SyncRoomStateMessage>,
  ) {
    const room = this.roomService.lookupRoom(roomMessage.roomId);
    if (!room) {
      return;
    }

    const publishedLandscape = roomMessage.message.landscape;

    room
      .getLandscapeModifier()
      .initLandscape(
        publishedLandscape.landscapeToken,
        publishedLandscape.timestamp,
      );

    room.getApplicationModifier().closeAllApplications();

    // Initialize apps and components
    for (const app of roomMessage.message.openApps) {
      room
        .getApplicationModifier()
        .openApplication(app.id, app.position, app.quaternion, app.scale);
      for (const componentId of app.openComponents) {
        room
          .getApplicationModifier()
          .updateComponent(componentId, app.id, false, true);
      }
    }

    room.getDetachedMenuModifier().closeAllDetachedMenus();

    // Initialize detached menus
    for (const detachedMenu of roomMessage.message.detachedMenus) {
      room
        .getDetachedMenuModifier()
        .detachMenu(
          detachedMenu.id,
          detachedMenu.menu.entityId,
          detachedMenu.menu.entityType,
          detachedMenu.menu.userId,
          detachedMenu.menu.position,
          detachedMenu.menu.quaternion,
          detachedMenu.menu.scale,
        );
    }

    this.websocketGateway.sendBroadcastForwardedMessage(
      event,
      roomMessage.roomId,
      { userId: roomMessage.userId, originalMessage: roomMessage.message },
    );
  }

  private handleUserConnectedEvent(
    event: string,
    roomMessage: RoomStatusMessage<UserConnectedMessage>,
  ) {
    const room = this.roomService.lookupRoom(roomMessage.roomId);
    const message = roomMessage.message;
    let user: UserModel;

    // Done, if user was already added by this replica
    if (!room.getUserModifier().hasUser(message.id)) {
      // Create user
      user = room
        .getUserModifier()
        .makeUserModel(
          message.id,
          message.name,
          message.deviceId || '',
          message.color.colorId,
          message.position,
          message.quaternion,
        );

      // Add user to room
      room.getUserModifier().addUser(user);
    } else {
      user = room.getUserModifier().getUserById(message.id);
    }
    this.websocketGateway.sendBroadcastExceptOneMessage(
      event,
      roomMessage.roomId,
      message.id,
      message,
    );
  }

  private handleUserDisconnectedEvent(
    event: string,
    roomMessage: RoomStatusMessage<UserDisconnectedMessage>,
  ) {
    const room = this.roomService.lookupRoom(roomMessage.roomId);
    const userId = roomMessage.message.id;

    // User leaves room
    room.getUserModifier().removeUser(userId);

    // Delete room if empty
    if (room.getUserModifier().getUsers().length == 0) {
      const roomId = room.getRoomId();
      this.websocketGateway.deleteEmptyChatRoom(roomId);
      this.roomService.deleteRoom(roomId);
    }
    this.websocketGateway.sendBroadcastMessage(
      event,
      roomMessage.roomId,
      roomMessage.message,
    );
  }

  private handleMenuDetachedEvent(
    event: string,
    message: RoomForwardMessage<PublishIdMessage<MenuDetachedMessage>>,
  ) {
    const room = this.roomService.lookupRoom(message.roomId);
    const menu = message.message.message;
    room
      .getDetachedMenuModifier()
      .detachMenu(
        message.message.id,
        menu.detachId,
        menu.entityType,
        message.userId,
        menu.position,
        menu.quaternion,
        menu.scale,
      );
    const menuDetachedForwardMessage: MenuDetachedForwardMessage = {
      objectId: message.message.id,
      userId: message.userId,
      entityType: menu.entityType,
      detachId: menu.detachId,
      position: menu.position,
      quaternion: menu.quaternion,
      scale: menu.scale,
    };
    this.websocketGateway.sendBroadcastExceptOneMessage(
      event,
      message.roomId,
      message.userId,
      menuDetachedForwardMessage,
    );
  }

  private handleAppOpenedEvent(
    event: string,
    roomMessage: RoomForwardMessage<AppOpenedMessage>,
  ) {
    const room = this.roomService.lookupRoom(roomMessage.roomId);
    const message = roomMessage.message;
    room
      .getApplicationModifier()
      .openApplication(
        message.id,
        message.position,
        message.quaternion,
        message.scale,
      );
    this.websocketGateway.sendBroadcastForwardedMessage(
      event,
      roomMessage.roomId,
      { userId: roomMessage.userId, originalMessage: message },
    );
  }

  private handleChangeLandscapeEvent(
    event: string,
    roomMessage: RoomForwardMessage<ChangeLandscapeMessage>,
  ) {
    this.websocketGateway.sendBroadcastForwardedMessage(
      event,
      roomMessage.roomId,
      { userId: roomMessage.userId, originalMessage: roomMessage.message },
    );
  }

  private handleComponentUpdateEvent(
    event: string,
    roomMessage: RoomForwardMessage<ComponentUpdateMessage>,
  ) {
    const room = this.roomService.lookupRoom(roomMessage.roomId);
    const message = roomMessage.message;
    room
      .getApplicationModifier()
      .updateComponent(
        message.componentId,
        message.appId,
        message.isFoundation,
        message.isOpened,
      );
    this.websocketGateway.sendBroadcastForwardedMessage(
      event,
      roomMessage.roomId,
      { userId: roomMessage.userId, originalMessage: message },
    );
  }

  private handleHeatmapUpdateEvent(
    event: string,
    roomMessage: RoomForwardMessage<HeatmapUpdateMessage>,
  ) {
    const room = this.roomService.lookupRoom(roomMessage.roomId);
    const message = roomMessage.message;
    room.getHeatmapModifier().setActive(message.active);
    room.getHeatmapModifier().setMode(message.mode);
    room.getHeatmapModifier().setMetric(message.metric);
    room.getHeatmapModifier().setApplicationId(message.applicationId);
    this.websocketGateway.sendBroadcastForwardedMessage(
      event,
      roomMessage.roomId,
      { userId: roomMessage.userId, originalMessage: message },
    );
  }

  private handleHighlightingUpdateEvent(
    event: string,
    roomMessage: RoomForwardMessage<HighlightingUpdateMessage>,
  ) {
    const room = this.roomService.lookupRoom(roomMessage.roomId);
    const user = room.getUserModifier().getUserById(roomMessage.userId);
    const message = roomMessage.message;
    room
      .getUserModifier()
      .updateHighlighting(
        user,
        message.appId,
        message.entityId,
        message.entityType,
        message.isHighlighted,
        message.multiSelected,
      );
    this.websocketGateway.sendBroadcastForwardedMessage(
      event,
      roomMessage.roomId,
      { userId: roomMessage.userId, originalMessage: message },
    );
  }

  private handleJoinVrEvent(
    event: string,
    roomMessage: RoomForwardMessage<JoinVrMessage>,
  ) {
    const message = roomMessage.message;
    this.websocketGateway.sendBroadcastForwardedMessage(
      event,
      roomMessage.roomId,
      { userId: roomMessage.userId, originalMessage: message },
    );
  }

  private handleAllHighlightsResetEvent(
    event: string,
    roomMessage: RoomForwardMessage<AllHighlightsResetMessage>,
  ) {
    const room = this.roomService.lookupRoom(roomMessage.roomId);
    const message = roomMessage.message;
    room.getUserModifier().resetAllHighlights();
    this.websocketGateway.sendBroadcastForwardedMessage(
      event,
      roomMessage.roomId,
      { userId: roomMessage.userId, originalMessage: message },
    );
  }

  private handleMousePingUpdateEvent(
    event: string,
    roomMessage: RoomForwardMessage<MousePingUpdateMessage>,
  ) {
    const message = roomMessage.message;
    this.websocketGateway.sendBroadcastForwardedMessage(
      event,
      roomMessage.roomId,
      { userId: roomMessage.userId, originalMessage: message },
    );
  }

  private handlePingUpdateEvent(
    event: string,
    roomMessage: RoomForwardMessage<PingUpdateMessage>,
  ) {
    const message = roomMessage.message;
    this.websocketGateway.sendBroadcastForwardedMessage(
      event,
      roomMessage.roomId,
      { userId: roomMessage.userId, originalMessage: message },
    );
  }

  private handleShareSettingsEvent(
    event: string,
    roomMessage: RoomForwardMessage<ShareSettingsMessage>,
  ) {
    const message = roomMessage.message;
    this.websocketGateway.sendBroadcastForwardedMessage(
      event,
      roomMessage.roomId,
      { userId: roomMessage.userId, originalMessage: message },
    );
  }

  private handleSpectatingUpdateEvent(
    event: string,
    roomMessage: RoomForwardMessage<SpectatingUpdateMessage>,
  ) {
    const room = this.roomService.lookupRoom(roomMessage.roomId);
    const message = roomMessage.message;
    message.spectatingUserIds.forEach((spectatingUserId) => {
      const user = room.getUserModifier().getUserById(spectatingUserId);
      room.getUserModifier().updateSpectating(user, message.isSpectating);
    });

    this.websocketGateway.sendBroadcastMessage(event, roomMessage.roomId, {
      userId: roomMessage.userId,
      originalMessage: message,
    });
  }

  private handleTimestampUpdateEvent(
    event: string,
    roomMessage: RoomForwardMessage<TimestampUpdateMessage>,
  ) {
    const room = this.roomService.lookupRoom(roomMessage.roomId);
    const message = roomMessage.message;
    room.getLandscapeModifier().updateTimestamp(message.timestamp);
    room.getApplicationModifier().closeAllApplications();
    room.getDetachedMenuModifier().closeAllDetachedMenus();
    this.websocketGateway.sendBroadcastForwardedMessage(
      event,
      roomMessage.roomId,
      { userId: roomMessage.userId, originalMessage: message },
    );
  }

  private handleUserControllerConnectEvent(
    event: string,
    roomMessage: RoomForwardMessage<
      PublishIdMessage<UserControllerConnectMessage>
    >,
  ) {
    const room = this.roomService.lookupRoom(roomMessage.roomId);
    const user = room.getUserModifier().getUserById(roomMessage.userId);
    const message = roomMessage.message;
    room
      .getUserModifier()
      .connectController(message.id, user, message.message.controller);
    this.websocketGateway.sendBroadcastForwardedMessage(
      event,
      roomMessage.roomId,
      { userId: roomMessage.userId, originalMessage: message },
    );
  }

  private handleUserControllerDisconnectEvent(
    event: string,
    roomMessage: RoomForwardMessage<UserControllerDisconnectMessage>,
  ) {
    const room = this.roomService.lookupRoom(roomMessage.roomId);
    const user = room.getUserModifier().getUserById(roomMessage.userId);
    const message = roomMessage.message;
    room.getUserModifier().disconnectController(user, message.controllerId);
    this.websocketGateway.sendBroadcastForwardedMessage(
      event,
      roomMessage.roomId,
      { userId: roomMessage.userId, originalMessage: message },
    );
  }

  private handleUserPositionsEvent(
    event: string,
    roomMessage: RoomForwardMessage<UserPositionsMessage>,
  ) {
    const room = this.roomService.lookupRoom(roomMessage.roomId);
    const user = room.getUserModifier().getUserById(roomMessage.userId);
    const message = roomMessage.message;
    room.getUserModifier().updateUserPose(user, message.camera);
    room
      .getUserModifier()
      .updateControllerPose(user.getController(0), message.controller1);
    room
      .getUserModifier()
      .updateControllerPose(user.getController(1), message.controller2);
    this.websocketGateway.sendBroadcastForwardedMessage(
      event,
      roomMessage.roomId,
      { userId: roomMessage.userId, originalMessage: message },
    );
  }

  private handleTimestampUpdateTimerEvent(
    event: string,
    roomMessage: RoomStatusMessage<TimestampUpdateTimerMessage>,
  ) {
    this.websocketGateway.sendBroadcastMessage(
      event,
      roomMessage.roomId,
      roomMessage.message,
    );
  }

  private handleObjectMovedEvent(
    event: string,
    roomMessage: RoomForwardMessage<ObjectMovedMessage>,
  ) {
    const room = this.roomService.lookupRoom(roomMessage.roomId);
    const message = roomMessage.message;
    room
      .getGrabModifier()
      .moveObject(
        message.objectId,
        message.position,
        message.quaternion,
        message.scale,
      );
    this.websocketGateway.sendBroadcastForwardedMessage(
      event,
      roomMessage.roomId,
      { userId: roomMessage.userId, originalMessage: message },
    );
  }

  private handleAppClosedEvent(
    event: string,
    roomMessage: RoomForwardMessage<AppClosedMessage>,
  ) {
    const room = this.roomService.lookupRoom(roomMessage.roomId);
    const message = roomMessage.message;
    room.getApplicationModifier().closeApplication(message.appId);
    this.websocketGateway.sendBroadcastForwardedMessage(
      event,
      roomMessage.roomId,
      { userId: roomMessage.userId, originalMessage: message },
    );
  }

  private handleDetachedMenuClosedEvent(
    event: string,
    roomMessage: RoomForwardMessage<DetachedMenuClosedMessage>,
  ) {
    const room = this.roomService.lookupRoom(roomMessage.roomId);
    const message = roomMessage.message;
    room.getDetachedMenuModifier().closeDetachedMenu(message.menuId);
    this.websocketGateway.sendBroadcastForwardedMessage(
      event,
      roomMessage.roomId,
      { userId: roomMessage.userId, originalMessage: message },
    );
  }

  private handleChatMessageEvent(
    event: string,
    roomMessage: RoomForwardMessage<ChatMessage>,
  ) {
    const message = roomMessage.message;
    this.websocketGateway.sendBroadcastMessage(event, roomMessage.roomId, {
      userId: roomMessage.userId,
      originalMessage: message,
    });
  }

  private handleChatSyncEvent(
    event: string,
    roomMessage: RoomForwardMessage<ChatSynchronizeResponse[]>,
  ) {
    const message = roomMessage.message;
    this.websocketGateway.sendBroadcastMessage(event, roomMessage.roomId, {
      userId: roomMessage.userId,
      originalMessage: message,
    });
  }

  private handleUserKickEvent(
    event: string,
    roomMessage: RoomForwardMessage<UserKickEvent>,
  ) {
    const message = roomMessage.message;
    this.websocketGateway.sendBroadcastMessage(event, roomMessage.roomId, {
      userId: roomMessage.userId,
      originalMessage: message,
    });
  }

  private handleMessageDeleteEvent(
    event: string,
    roomMessage: RoomForwardMessage<MessageDeleteEvent>,
  ) {
    const message = roomMessage.message;
    this.websocketGateway.sendBroadcastMessage(event, roomMessage.roomId, {
      userId: roomMessage.userId,
      originalMessage: message,
    });
  }
}
