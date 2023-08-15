import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WebsocketModule } from './websocket/websocket.module';
import { ModelModule } from './model/model.module';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import { PubsubModule } from './pubsub/pubsub.module';

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
  providers: [AppService],
  exports: [ModelModule]
})
export class AppModule {}
