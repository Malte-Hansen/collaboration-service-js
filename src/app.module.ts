import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import { RoomService } from './room/room.service';
import { IdGenerationService } from './id-generation/id-generation.service';
import { RoomFactoryService } from './factory/room-factory/room-factory.service';
import { ExampleModifierFactoryService } from './factory/example-modifier-factory/example-modifier-factory.service';
import { UserModifierFactoryService } from './factory/user-modifier-factory/user-modifier-factory.service';
import { WebsocketGateway } from './websocket/websocket.gateway';
import { PubsubService } from './pubsub/pubsub.service';
import { TicketService } from './ticket/ticket.service';
import { SessionService } from './session/session.service';

@Module({
  imports: [
    RedisModule.forRoot({
      config: {
        host: 'localhost',
        port: 6379,
        password: 'authpassword'
      }
    })
],
  controllers: [AppController],
  providers: [AppService, RoomFactoryService, ExampleModifierFactoryService, UserModifierFactoryService, RoomService, WebsocketGateway, PubsubService, IdGenerationService, TicketService, SessionService],
  exports: []
})
export class AppModule {}
