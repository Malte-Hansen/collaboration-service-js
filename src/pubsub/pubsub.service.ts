import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { Redis } from 'ioredis';
import { ExampleMessage } from 'src/message/example-message';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { WebsocketGateway } from 'src/websocket/websocket.gateway';
import { Ticket } from 'src/util/ticket';
import { TicketService } from 'src/ticket/ticket.service';
import { CreateRoomMessage } from 'src/message/pubsub/create-room-message';
import { RoomService } from 'src/room/room.service';
import { RegisterTicketMessage } from 'src/message/pubsub/register-ticket-message';
import { UnregisterTicketMessage } from 'src/message/pubsub/unregister-ticket-message';
import { JoinUserMessage } from 'src/message/pubsub/join-user-message';

const UNIQUE_ID_KEY = 'unique_id';

const ADD_TICKET_CHANNEL = 'add-ticket';
const REMOVE_TICKET_CHANNEL = 'remove_ticket';
const CREATE_ROOM_CHANNEL = 'create-room';
const JOIN_USER_CHANNEL = 'join-user';

@Injectable()
export class PubsubService {

    private readonly publisher: Redis;
    private readonly subscriber: Redis;

    constructor(private readonly redisService: RedisService, @Inject(forwardRef(() => WebsocketGateway)) private readonly websocketGateway: WebsocketGateway,
      private readonly ticketService: TicketService, private readonly roomService: RoomService) {
      this.publisher = this.redisService.getClient();
      this.subscriber = this.publisher.duplicate();
      this.initListener();
    }

    async getUniqueId(): Promise<number> {
      const keyExists = await this.publisher.exists(UNIQUE_ID_KEY);
      if (keyExists == 0) {
        this.publisher.set(UNIQUE_ID_KEY, 0);
      }
      const nextUniqueKey = this.publisher.incr(UNIQUE_ID_KEY);
      return nextUniqueKey;
    }

    publishCreateRoom(createRoomMessage: CreateRoomMessage) {
      this.publisher.publish(CREATE_ROOM_CHANNEL, JSON.stringify(createRoomMessage));
    }

    publishRegisterTicket(registerTicketMessage: RegisterTicketMessage) {
      this.publisher.publish(ADD_TICKET_CHANNEL, JSON.stringify(registerTicketMessage));
    }

    publishUnregisterTicket(unregisterTicketMessage: UnregisterTicketMessage) {
      this.publisher.publish(REMOVE_TICKET_CHANNEL, JSON.stringify(unregisterTicketMessage));
    }

    publishJoinUserMessage(joinUserMessage: JoinUserMessage) {
      this.publisher.publish(JOIN_USER_CHANNEL, JSON.stringify(joinUserMessage));
    }
  
    publishForwardedMessage(message: ExampleMessage): void {
        this.redisService.getClient().publish('forward', JSON.stringify(message));
    }

    initListener(): void {
        this.subscriber.subscribe(ADD_TICKET_CHANNEL, REMOVE_TICKET_CHANNEL, CREATE_ROOM_CHANNEL, JOIN_USER_CHANNEL);

        this.subscriber.on('message', (channel: string, message: string) => {
            var data = JSON.parse(message);
          
            switch (channel) {
              case 'forward':
                //message = JSON.parse(data) as ExampleMessage;
                // TODO update model via room service
                //this.websocketGateway.sendForwardedMessage(message);
                break;
              case ADD_TICKET_CHANNEL:
                this.handleRegisterTicketChannel(data);
                break;
              case REMOVE_TICKET_CHANNEL:
                this.handleUnregisterTicketChannel(data);
                break;
              case CREATE_ROOM_CHANNEL:
                this.handleCreateRoomChannel(data);
                break;
              case JOIN_USER_CHANNEL:
                this.handleJoinUserChannel(data);
                break;
              default:
                break;
            }
          });
    }

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
