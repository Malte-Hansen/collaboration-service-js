import { Injectable } from '@nestjs/common';
import { CreateRoomMessage, CREATE_ROOM_EVENT } from 'src/message/pubsub/create-room-message';
import { RoomForwardMessage } from 'src/message/pubsub/room-forward-message';
import { RoomStatusMessage } from 'src/message/pubsub/room-status-message';
import { Redis } from 'ioredis';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { LockService } from 'src/lock/lock.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MessageFactoryService } from 'src/factory/message-factory/message-factory.service';
import { TimestampUpdateTimerMessage, TIMESTAMP_UPDATE_TIMER_EVENT } from 'src/message/client/sendable/timestamp-update-timer-message';
import { RoomService } from 'src/room/room.service';

@Injectable()
export class PublisherService {

    private readonly redis: Redis;

    constructor(private readonly redisService: RedisService, private readonly lockService: LockService,
        private readonly roomService: RoomService, private readonly messageFactoryService: MessageFactoryService) {
            
        this.redis = this.redisService.getClient().duplicate();
    }

    publishCreateRoomEvent(message: CreateRoomMessage) {
        this.publish(CREATE_ROOM_EVENT, message);
    }

    publishRoomStatusMessage(event: string, message: RoomStatusMessage<any>) {
        this.publish(event, message);
    }

    publishRoomForwardMessage(event: string, message: RoomForwardMessage<any>): void {
        this.publish(event, message);
    }

    private publish(channel: string, message: any) {
        this.redis.publish(channel, JSON.stringify(message));
    }

    @Cron(CronExpression.EVERY_10_SECONDS)
    publishTimestampUpdateTimerMessage() {
        const lock = this.lockService.lockTimestampChannel()
        if (lock) {
            for (const room of this.roomService.getRooms()) {
                const message: RoomStatusMessage<TimestampUpdateTimerMessage> =
                    { roomId: room.getRoomId(), message: this.messageFactoryService.makeTimestampUpdateTimerMessage(room) };
                this.publish(TIMESTAMP_UPDATE_TIMER_EVENT, message);
            }
        }
    }
}
