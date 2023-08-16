import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { Redis } from 'ioredis';
import { ExampleMessage } from 'src/message/example-message';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { WebsocketGateway } from 'src/websocket/websocket.gateway';

@Injectable()
export class PubsubService {

    private readonly publisher: Redis;
    private readonly subscriber: Redis;

    constructor(private readonly redisService: RedisService, @Inject(forwardRef(() => WebsocketGateway)) private readonly websocketGateway: WebsocketGateway) {
      this.publisher = this.redisService.getClient();
      this.subscriber = this.publisher.duplicate();
      this.initListener();
    }
  

    publishForwardedMessage(message: ExampleMessage): void {
        this.redisService.getClient().publish('forward', JSON.stringify(message));
    }

    initListener(): void {
        this.subscriber.subscribe('forward');

        this.subscriber.on('message', (channel: string, data: string) => {
            const message: ExampleMessage = JSON.parse(data);
          
            switch (channel) {
              case 'forward':
                // TODO update model via room service
                this.websocketGateway.sendForwardedMessage(message);
                break;
              case 'userLeft':
                // Handle user leave event
                break;
              case 'newMessage':
                // Handle new message event
                break;
              default:
                break;
            }
          });
    }
}
