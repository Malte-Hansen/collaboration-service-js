import { Injectable } from '@nestjs/common';
import { GrabbableObjectModel } from 'src/model/grabbable-object-model';
import Redlock from "redlock";
import { RedisService } from '@liaoliaots/nestjs-redis';
import { GrabbableObjectLock } from 'src/util/grabbable-object-lock';
import { UserModel } from 'src/model/user-model';

const TIMESTAMP_CHANNEL_LOCK = 'timestamp_channel_lock';

@Injectable()
export class LockService {

    private readonly redlock: Redlock;

    private grabbableObjectLocks: Map<string, GrabbableObjectLock> = new Map();

    constructor(private readonly redisService: RedisService) {

        this.redlock = new Redlock([this.redisService.getClient().duplicate()], {
            retryCount: 5, retryDelay: 100
        });
    }

    private getGrabbableObjectLockResource(grabId: string): string {
        return 'grabbable-object-' + grabId;
    }

    async lockGrabbableObject(user: UserModel, object: GrabbableObjectModel): Promise<boolean> {
        try {
            const lock = await this.redlock.acquire([this.getGrabbableObjectLockResource(object.getGrabId())], Number.MAX_SAFE_INTEGER);
            const grabbableObjectLock = new GrabbableObjectLock(user, object, lock);
            this.grabbableObjectLocks.set(object.getGrabId(), grabbableObjectLock);
            return true;
        } catch (error) {
            return false;
        }
    }

    async releaseGrabbableObjectLock(user: UserModel, grabId: string) {
        const grabbableObjectLock = this.grabbableObjectLocks.get(grabId);
        if (grabbableObjectLock && grabbableObjectLock.isLockedByUser(user)) {
            await this.redlock.release(grabbableObjectLock.getLock());
            this.grabbableObjectLocks.delete(grabId);
        }
    }

    async lockTimestampChannel() {
        try {
            return await this.redlock.acquire([TIMESTAMP_CHANNEL_LOCK], Number.MAX_SAFE_INTEGER);
        } catch (error) {
            return null;
        }
    }

    releaseAllLockByUser(user: UserModel): void {
        for (var [objectId, grabbableObjectLock] of this.grabbableObjectLocks.entries()) {
            if (grabbableObjectLock.isLockedByUser(user)) this.grabbableObjectLocks.delete(objectId);
        }
    }

    isLockedByUser(user: UserModel, grabId: string): boolean {
        const grabbableObjectLock = this.grabbableObjectLocks.get(grabId);
        return grabbableObjectLock && grabbableObjectLock.isLockedByUser(user);
    }


}
