import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WebsocketModule } from './websocket/websocket.module';
import { ModelModule } from './model/model.module';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import { PubsubModule } from './pubsub/pubsub.module';
import { RoomService } from './room/room.service';
import { IdGenerationService } from './id-generation/id-generation.service';
import { RoomFactoryService } from './factory/room-factory/room-factory.service';
import { ExampleFactoryService } from './factory/example-factory/example-factory.service';
import { ExampleModifierFactoryService } from './factory/example-modifier-factory/example-modifier-factory.service';
import { UserModifierService } from './factory/user-modifier/user-modifier.service';
import { UserModifierFactoryService } from './factory/user-modifier-factory/user-modifier-factory.service';

@Module({
  imports: [WebsocketModule, ModelModule, PubsubModule,
    RedisModule.forRoot({
      config: {
        host: 'localhost',
        port: 6379,
        password: 'authpassword'
      }
    })
],
  controllers: [AppController],
  providers: [AppService, RoomService, IdGenerationService, RoomFactoryService, ExampleFactoryService, ExampleModifierFactoryService, UserModifierService, UserModifierFactoryService],
  exports: []
})
export class AppModule {}
