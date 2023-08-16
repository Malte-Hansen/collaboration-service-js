import { Module, forwardRef } from '@nestjs/common';
import { PubsubService } from './pubsub.service';
import { WebsocketModule } from 'src/websocket/websocket.module';

@Module({
  imports: [forwardRef(() => WebsocketModule)],
  providers: [PubsubService],
  exports: [PubsubService]
})
export class PubsubModule {}
