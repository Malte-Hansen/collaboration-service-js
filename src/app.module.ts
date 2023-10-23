import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import { RoomService } from './room/room.service';
import { IdGenerationService } from './id-generation/id-generation.service';
import { RoomFactoryService } from './factory/room-factory/room-factory.service';
import { WebsocketGateway } from './websocket/websocket.gateway';
import { TicketService } from './ticket/ticket.service';
import { SessionService } from './session/session.service';
import { MessageFactoryService } from './factory/message-factory/message-factory.service';
import { ScheduleModule } from '@nestjs/schedule';
import { LockService } from './lock/lock.service';
import { PublisherService } from './publisher/publisher.service';
import { SubscriberService } from './subscriber/subscriber.service';

@Module({
  imports: [
    RedisModule.forRoot({
      config: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || 'authpassword',
      },
    }),
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [
    RoomFactoryService,
    RoomService,
    WebsocketGateway,
    IdGenerationService,
    TicketService,
    SessionService,
    MessageFactoryService,
    LockService,
    PublisherService,
    SubscriberService,
  ],
  exports: [],
})
export class AppModule {}
