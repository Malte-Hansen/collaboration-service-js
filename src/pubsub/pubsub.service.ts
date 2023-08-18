import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { Redis } from 'ioredis';
import { EXAMPLE_EVENT, ExampleMessage } from 'src/message/client/receivable/example-message';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { WebsocketGateway } from 'src/websocket/websocket.gateway';
import { Ticket } from 'src/util/ticket';
import { TicketService } from 'src/ticket/ticket.service';
import { CREATE_ROOM_EVENT, CreateRoomMessage } from 'src/message/pubsub/create-room-message';
import { RoomService } from 'src/room/room.service';
import { JOIN_USER_EVENT, JoinUserMessage } from 'src/message/pubsub/join-user-message';
import { ForwardedPubsubMessage } from 'src/message/pubsub/forward-pubsub-message';

const UNIQUE_ID_KEY = 'unique_id';

@Injectable()
export class PubsubService {

  private readonly cacheClient: Redis;
  private readonly publisher: Redis;
  private readonly subscriber: Redis;

  constructor(private readonly redisService: RedisService, private readonly roomService: RoomService, @Inject(forwardRef(() => WebsocketGateway)) private readonly websocketGateway: WebsocketGateway) {

    this.publisher = this.redisService.getClient();
    this.subscriber = this.publisher.duplicate();
    this.cacheClient = this.publisher.duplicate();

    // Register event listener
    const listener : Map<string,(...args: any) => void> = new Map();
    listener.set(CREATE_ROOM_EVENT,this.handleCreateRoomEvent.bind(this));
    listener.set(JOIN_USER_EVENT,this.handleJoinUserEvent.bind(this));
    listener.set(EXAMPLE_EVENT, (msg: any) => this.handleExampleEvent(EXAMPLE_EVENT, msg))


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

  async getTicket(ticketId: string): Promise<Ticket|null> {
    const ticket = await this.cacheClient.get(this.getTicketKey(ticketId));
    return ticket ? JSON.parse(ticket) : null;
  }


  /// PUBLISH EVENT

  publishCreateRoomEvent(message: CreateRoomMessage) {
    this.publish(CREATE_ROOM_EVENT, message);
  }

  publishJoinUserEvent(message: JoinUserMessage) {
    this.publish(JOIN_USER_EVENT, message);
  }

  publishForwardedMessage(event: string, message: ForwardedPubsubMessage<any>): void {
    this.publish(event, message);
  }


  // SUBSCRIPTION HANDLERS

  private handleCreateRoomEvent(message: CreateRoomMessage) {
    const room = this.roomService.createRoom(message.roomId);
    room.getExampleModifier().updateExample(message.initialRoom.example.value);
    // TODO init model 
  }

  private handleJoinUserEvent(message: JoinUserMessage) {
    const room = this.roomService.lookupRoom(message.roomId);

    // Create user
    const user = room.getUserModifier().makeUserModel(message.userId, message.userName);

    // Add user to room
    room.getUserModifier().addUser(user);
  }

  private handleExampleEvent(event: string, message: ForwardedPubsubMessage<ExampleMessage>) {
    const room = this.roomService.lookupRoom(message.roomId);

    room.getExampleModifier().updateExample(message.message.value);

    this.websocketGateway.broadcastForwardMessage(event, message.roomId, {userId: message.userId, message: message.message});
  }

}
