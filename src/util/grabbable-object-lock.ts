import { GrabbableObjectModel } from 'src/model/grabbable-object-model';
import { UserModel } from 'src/model/user-model';

export class GrabbableObjectLock {
  private user: UserModel;
  private object: GrabbableObjectModel;
  private lock: any;

  constructor(user: UserModel, object: GrabbableObjectModel, lock: any) {
    this.user = user;
    this.object = object;
    this.lock = lock;
  }

  getUser(): UserModel {
    return this.user;
  }

  getObject(): GrabbableObjectModel {
    return this.object;
  }

  getLock(): any {
    return this.lock;
  }

  isLockedByUser(user: UserModel): boolean {
    return this.user.getId() == user.getId();
  }
}
