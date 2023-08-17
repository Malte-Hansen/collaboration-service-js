import { State, UserModel } from "src/model/user-model";

export class UserModifier {

  private users: Map<string, UserModel> = new Map();

  constructor() {}

  updateSpectating(user: UserModel, isSpectating: boolean): void {
    user.setState(isSpectating ? State.SPECTATING : State.CONNECTED);
  }

  makeUserModel(userId: string, userName: string): UserModel {
    // TODO assign color
    return new UserModel(userId, userName);
  }

  addUser(user: UserModel): void {
    this.users.set(user.getId(), user);
    // TODO user connected event
  }

  removeUser(user: UserModel): void {
    // TODO unassign color
    // TODO release grabbed

    if (this.users.has(user.getId())) {
      this.users.delete(user.getId());
      // TODO user disconneced event
    }
  }

  getUsers(): IterableIterator<UserModel> {
    return this.users.values();
  }

  // TODO some properties are missing
}
