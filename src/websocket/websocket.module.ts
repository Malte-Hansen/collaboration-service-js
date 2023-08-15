import { Module } from '@nestjs/common';
import { WebsocketGateway } from './websocket.gateway';
import { ModelModule } from 'src/model/model.module';
import { PubsubModule } from 'src/pubsub/pubsub.module';

@Module({
  imports: [ModelModule, PubsubModule],
  providers: [WebsocketGateway]
})
export class WebsocketModule {}
