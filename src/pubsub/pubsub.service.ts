import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { ExampleMessage } from 'src/message/example-message';
import { RedisService, DEFAULT_REDIS_NAMESPACE } from '@liaoliaots/nestjs-redis';

@Injectable()
export class PubsubService {

    private readonly publisher: Redis;
    private readonly subscriber: Redis;

    constructor(private readonly redisService: RedisService) {
      this.publisher = this.redisService.getClient();
      this.subscriber = this.publisher.duplicate();
      this.initListener();
    }
  

    publishForwardedMessage(message: ExampleMessage): void {
        this.redisService.getClient().publish('forward', JSON.stringify(message));
    }

    initListener(): void {
        this.subscriber.subscribe('forward');

        this.subscriber.on('message', (channel, message) => {
            const data = JSON.parse(message);
          
            switch (channel) {
              case 'forward':
                console.log('Redis message: ', data);
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
