import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { RedisService } from '@liaoliaots/nestjs-redis';

const UNIQUE_ID_KEY = 'unique_id';

@Injectable()
export class IdGenerationService {

    private readonly redis: Redis;

    constructor(private readonly redisService: RedisService) {
        this.redis = this.redisService.getClient().duplicate();
    }

    async nextId(): Promise<string> {
        return (await this.getUniqueId()).toString();
    }

    private async getUniqueId(): Promise<number> {
        const keyExists = await this.redis.exists(UNIQUE_ID_KEY);
        if (keyExists == 0) {
          this.redis.set(UNIQUE_ID_KEY, 0);
        }
        const nextUniqueKey = this.redis.incr(UNIQUE_ID_KEY);
        return nextUniqueKey;
      }
}
