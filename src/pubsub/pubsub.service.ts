import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { Redis } from 'ioredis';
import { ExampleMessage } from 'src/message/client/receivable/example-message';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { WebsocketGateway } from 'src/websocket/websocket.gateway';
import { Ticket } from 'src/util/ticket';
import { TicketService } from 'src/ticket/ticket.service';
import { CREATE_ROOM_CHANNEL, CreateRoomMessage } from 'src/message/pubsub/create-room-message';
import { RoomService } from 'src/room/room.service';
import { REGISTER_TICKET_CHANNEL, RegisterTicketMessage } from 'src/message/pubsub/register-ticket-message';
import { UNREGISTER_TICKET_CHANNEL, UnregisterTicketMessage } from 'src/message/pubsub/unregister-ticket-message';
import { JOIN_USER_CHANNEL, JoinUserMessage } from 'src/message/pubsub/join-user-message';

const UNIQUE_ID_KEY = 'unique_id';

export const FORWARD_EXAMPLE_CHANNEL = 'forward:example';

@Injectable()
export class PubsubService {

  private readonly publisher: Redis;
  private readonly subscriber: Redis;

  constructor(private readonly redisService: RedisService, @Inject(forwardRef(() => WebsocketGateway)) private readonly websocketGateway: WebsocketGateway,
    private readonly ticketService: TicketService, private readonly roomService: RoomService) {

    this.publisher = this.redisService.getClient();
    this.subscriber = this.publisher.duplicate();

    // Register handlers
    const listener : Map<string,(message: any) => void> = new Map();
    listener.set(REGISTER_TICKET_CHANNEL,this.handleRegisterTicketChannel);
    listener.set(UNREGISTER_TICKET_CHANNEL,this.handleUnregisterTicketChannel);
    listener.set(CREATE_ROOM_CHANNEL,this.handleCreateRoomChannel);
    listener.set(JOIN_USER_CHANNEL,this.handleJoinUserChannel);


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


  /// PUBLISH MESSAGE

  publishCreateRoom(createRoomMessage: CreateRoomMessage) {
    this.publish(CREATE_ROOM_CHANNEL, createRoomMessage);
  }

  publishRegisterTicket(registerTicketMessage: RegisterTicketMessage) {
    this.publish(REGISTER_TICKET_CHANNEL, registerTicketMessage);
  }

  publishUnregisterTicket(unregisterTicketMessage: UnregisterTicketMessage) {
    this.publish(UNREGISTER_TICKET_CHANNEL, unregisterTicketMessage);
  }

  publishJoinUserMessage(joinUserMessage: JoinUserMessage) {
    this.publish(JOIN_USER_CHANNEL, joinUserMessage);
  }

  publishForwardedMessage(message: ExampleMessage): void {
    this.publish('forward', message);
  }


  // SUBSCRIPTION HANDLERS

  private handleRegisterTicketChannel(registerTicketMessage: RegisterTicketMessage) {
    this.ticketService.registerTicket(
      new Ticket(registerTicketMessage.ticketId, registerTicketMessage.roomId,
        registerTicketMessage.userId, new Date(registerTicketMessage.validUntil)));
  }


  private handleUnregisterTicketChannel(unregisterTicketMessage: UnregisterTicketMessage) {
    this.ticketService.unregisterTicket(unregisterTicketMessage.ticketId);
  }

  private handleCreateRoomChannel(createRoomMessage: CreateRoomMessage) {
    const room = this.roomService.createRoom(createRoomMessage.roomId);
    room.getExampleModifier().updateExample(createRoomMessage.initialRoom.example.value);
    // TODO init model 
  }

  private handleJoinUserChannel(joinUserMessage: JoinUserMessage) {
    const room = this.roomService.lookupRoom(joinUserMessage.roomId);

    // Create user
    const user = room.getUserModifier().makeUserModel(joinUserMessage.userId, joinUserMessage.userName);

    // Add user to room
    room.getUserModifier().addUser(user);
  }

}
