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

  /**
   * Generates a unique ID among all distributed replicas
   *
   * @returns A unique ID
   */
  async nextId(): Promise<string> {
    return (await this.getUniqueId()).toString();
  }

  private async getUniqueId(): Promise<number> {
    await this.redis.setnx(UNIQUE_ID_KEY, 0);
    const nextUniqueKey = this.redis.incr(UNIQUE_ID_KEY);
    return nextUniqueKey;
  }
}
