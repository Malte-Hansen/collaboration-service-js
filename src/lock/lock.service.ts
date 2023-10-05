import { Injectable } from '@nestjs/common';
import { GrabbableObjectModel } from 'src/model/grabbable-object-model';
import Redlock from "redlock";
import { RedisService } from '@liaoliaots/nestjs-redis';
import { GrabbableObjectLock } from 'src/util/grabbable-object-lock';
import { UserModel } from 'src/model/user-model';
import { Room } from 'src/model/room-model';

@Injectable()
export class LockService {

    private readonly redlock: Redlock;

    private grabbableObjectLocks: Map<string, GrabbableObjectLock> = new Map();

    constructor(private readonly redisService: RedisService) {

        this.redlock = new Redlock([this.redisService.getClient().duplicate()], {
            retryCount: 3, retryDelay: 50
        });
    }

    private getGrabbableObjectLockResource(roomId: string, grabId: string): string {
        return roomId + "-" + grabId;
    }

    async lockGrabbableObject(room: Room, user: UserModel, object: GrabbableObjectModel): Promise<boolean> {
        try {
            const lock = await this.redlock.acquire([this.getGrabbableObjectLockResource(room.getRoomId(), object.getGrabId())], Number.MAX_SAFE_INTEGER);
            const grabbableObjectLock = new GrabbableObjectLock(user, object, lock);
            this.grabbableObjectLocks.set(object.getGrabId(), grabbableObjectLock);
            return true;
        } catch (error) {
            return false;
        }
    }

    async closeGrabbableObject(room: Room, object: GrabbableObjectModel): Promise<boolean> {
        try {
            await this.redlock.acquire([this.getGrabbableObjectLockResource(room.getRoomId(), object.getGrabId())], 500);
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

    private getTimestampLockResource(roomId: string): string {
        return "timestamp-room-" + roomId;
    }

    async lockTimestampChannel(room: Room) {
        try {
            return await this.redlock.acquire([this.getTimestampLockResource(room.getRoomId())], Number.MAX_SAFE_INTEGER);
        } catch (error) {
            return null;
        }
    }

    releaseAllLockByUser(user: UserModel): void {
        for (var [objectId, grabbableObjectLock] of this.grabbableObjectLocks.entries()) {
            if (grabbableObjectLock.isLockedByUser(user)) this.releaseGrabbableObjectLock(user, objectId);
        }
    }

    isLockedByUser(user: UserModel, grabId: string): boolean {
        const grabbableObjectLock = this.grabbableObjectLocks.get(grabId);
        return grabbableObjectLock && grabbableObjectLock.isLockedByUser(user);
    }


}
