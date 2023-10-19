import { Injectable } from '@nestjs/common';
import { GrabbableObjectModel } from 'src/model/grabbable-object-model';
import Redlock from 'redlock';
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
      retryCount: 3,
      retryDelay: 50,
    });
  }

  private getGrabbableObjectLockResource(
    roomId: string,
    grabId: string,
  ): string {
    return roomId + '-' + grabId;
  }

  /**
   * Grabs an object via a distributed lock mechanism. The lock is acquired for an unlimited time.
   *
   * @param room The room in which the user grabs the object
   * @param user The user which grabs the object
   * @param object The object to be grabbed
   * @returns 'true' if grabbing was successful or 'false' if the object is already locked
   */
  async lockGrabbableObject(
    room: Room,
    user: UserModel,
    object: GrabbableObjectModel,
  ): Promise<boolean> {
    try {
      const lock = await this.redlock.acquire(
        [
          this.getGrabbableObjectLockResource(
            room.getRoomId(),
            object.getGrabId(),
          ),
        ],
        Number.MAX_SAFE_INTEGER,
      );
      const grabbableObjectLock = new GrabbableObjectLock(user, object, lock);
      this.grabbableObjectLocks.set(object.getGrabId(), grabbableObjectLock);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Closes an object via a distributed lock mechanism. The lock is only acquired for a short period.
   *
   * @param room The room in which the object was closed
   * @param object The object to be closed
   * @returns 'true' if closing was successful or 'false' if the object is already locked
   */
  async closeGrabbableObject(
    room: Room,
    object: GrabbableObjectModel,
  ): Promise<boolean> {
    try {
      await this.redlock.acquire(
        [
          this.getGrabbableObjectLockResource(
            room.getRoomId(),
            object.getGrabId(),
          ),
        ],
        500,
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Releases an object that was grabbed before from the distributed lock. Does nothing if the object is unlocked.
   *
   * @param user The user which releases the object
   * @param grabId The ID of the object that is released
   */
  async releaseGrabbableObjectLock(user: UserModel, grabId: string) {
    const grabbableObjectLock = this.grabbableObjectLocks.get(grabId);
    if (grabbableObjectLock && grabbableObjectLock.isLockedByUser(user)) {
      await this.redlock.release(grabbableObjectLock.getLock());
      this.grabbableObjectLocks.delete(grabId);
    }
  }

  private getTimestampLockResource(roomId: string): string {
    return 'timestamp-room-' + roomId;
  }

  /**
   * Locks the timestamp channel, which decides the one replica that can exclusively propagate the timestamp update.
   *
   * @param room The room for which the timestamp channel should be locked
   * @returns 'true' if locking successful or 'false' if the another replica already performs the timestamp update
   */
  async lockTimestampChannel(room: Room) {
    try {
      return await this.redlock.acquire(
        [this.getTimestampLockResource(room.getRoomId())],
        Number.MAX_SAFE_INTEGER,
      );
    } catch (error) {
      return null;
    }
  }

  /**
   * Releases all distributed locks which was successufully acquired by the user before.
   *
   * @param user The user which releases all locks
   */
  releaseAllLockByUser(user: UserModel): void {
    for (var [
      objectId,
      grabbableObjectLock,
    ] of this.grabbableObjectLocks.entries()) {
      if (grabbableObjectLock.isLockedByUser(user))
        this.releaseGrabbableObjectLock(user, objectId);
    }
  }

  /**
   * Checks if the object is locked by the specific user.
   *
   * @param user The user
   * @param grabId The ID of the grabbable object
   * @returns 'true' if the object is locked by the user or 'false' if the object is not locked by this user
   */
  isLockedByUser(user: UserModel, grabId: string): boolean {
    const grabbableObjectLock = this.grabbableObjectLocks.get(grabId);
    return grabbableObjectLock && grabbableObjectLock.isLockedByUser(user);
  }
}
