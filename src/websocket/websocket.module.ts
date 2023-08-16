import { Module, forwardRef } from '@nestjs/common';
import { WebsocketGateway } from './websocket.gateway';
import { PubsubModule } from 'src/pubsub/pubsub.module';

@Module({
  imports: [forwardRef(() => PubsubModule)],
  providers: [WebsocketGateway],
  exports: [WebsocketGateway]
})
export class WebsocketModule {}
