import { Injectable } from '@nestjs/common';
import { GrabbableObjectModel } from 'src/model/grabbable-object-model';
import Redlock from "redlock";
import { RedisService } from '@liaoliaots/nestjs-redis';

const TIMESTAMP_CHANNEL_LOCK = 'timestamp_channel_lock';

@Injectable()
export class LockService {

    private readonly redlock: Redlock;

    constructor(private readonly redisService: RedisService) {

        this.redlock = new Redlock([this.redisService.getClient().duplicate()], {
            retryCount: 5, retryDelay: 100
        });
    }

    private getGrabbableObjectLockResource(grabId: string): string {
        return 'grabbable-object-' + grabId;
    }

    async lockGrabbableObject(grabbableObject: GrabbableObjectModel): Promise<any> {
        try {
            return await this.redlock.acquire([this.getGrabbableObjectLockResource(grabbableObject.getGrabId())], Number.MAX_SAFE_INTEGER);
        } catch (error) {
            return null;
        }
    }

    async releaseGrabbableObjectLock(lock: any) {
        await this.redlock.release(lock);
    }

    async lockTimestampChannel() {
        try {
            return await this.redlock.acquire([TIMESTAMP_CHANNEL_LOCK], Number.MAX_SAFE_INTEGER);
        } catch (error) {
            return null;
        }
    }

}
