import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { Redis } from 'ioredis';
import { EXAMPLE_EVENT, ExampleMessage } from 'src/message/client/receivable/example-message';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { WebsocketGateway } from 'src/websocket/websocket.gateway';
import { Ticket } from 'src/util/ticket';
import { TicketService } from 'src/ticket/ticket.service';
import { CREATE_ROOM_EVENT, CreateRoomMessage } from 'src/message/pubsub/create-room-message';
import { RoomService } from 'src/room/room.service';
import { REGISTER_TICKET_EVENT, RegisterTicketMessage } from 'src/message/pubsub/register-ticket-message';
import { UNREGISTER_TICKET_EVENT, UnregisterTicketMessage } from 'src/message/pubsub/unregister-ticket-message';
import { JOIN_USER_EVENT, JoinUserMessage } from 'src/message/pubsub/join-user-message';
import { ForwardedPubsubMessage } from 'src/message/pubsub/forward-pubsub-message';

const UNIQUE_ID_KEY = 'unique_id';

@Injectable()
export class PubsubService {

  private readonly publisher: Redis;
  private readonly subscriber: Redis;

  constructor(private readonly redisService: RedisService, private readonly roomService: RoomService, @Inject(forwardRef(() => WebsocketGateway)) private readonly websocketGateway: WebsocketGateway,
    private readonly ticketService: TicketService) {

    this.publisher = this.redisService.getClient();
    this.subscriber = this.publisher.duplicate();

    // Register event listener
    const listener : Map<string,(...args: any) => void> = new Map();
    listener.set(REGISTER_TICKET_EVENT,this.handleRegisterTicketEvent.bind(this));
    listener.set(UNREGISTER_TICKET_EVENT,this.handleUnregisterTicketEvent.bind(this));
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

  private publish(channel: string, message: any) {
    this.publisher.publish(channel, JSON.stringify(message));
  }

  /// KEY VALUE STORAGE

  async getUniqueId(): Promise<number> {
    const keyExists = await this.publisher.exists(UNIQUE_ID_KEY);
    if (keyExists == 0) {
      this.publisher.set(UNIQUE_ID_KEY, 0);
    }
    const nextUniqueKey = this.publisher.incr(UNIQUE_ID_KEY);
    return nextUniqueKey;
  }


  /// PUBLISH EVENT

  publishCreateRoomEvent(message: CreateRoomMessage) {
    this.publish(CREATE_ROOM_EVENT, message);
  }

  publishRegisterTicketEvent(message: RegisterTicketMessage) {
    this.publish(REGISTER_TICKET_EVENT, message);
  }

  publishUnregisterTicketEvent(message: UnregisterTicketMessage) {
    this.publish(UNREGISTER_TICKET_EVENT, message);
  }

  publishJoinUserEvent(message: JoinUserMessage) {
    this.publish(JOIN_USER_EVENT, message);
  }

  publishForwardedMessage(event: string, message: ForwardedPubsubMessage<any>): void {
    this.publish(event, message);
  }


  // SUBSCRIPTION HANDLERS

  private handleRegisterTicketEvent(message: RegisterTicketMessage) {
    this.ticketService.registerTicket(
      new Ticket(message.ticketId, message.roomId,
        message.userId, new Date(message.validUntil)));
  }


  private handleUnregisterTicketEvent(message: UnregisterTicketMessage) {
    this.ticketService.unregisterTicket(message.ticketId);
  }

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
