import { IdGenerationService } from "src/id-generation/id-generation.service";
import { State, UserModel } from "src/model/user-model";

export class UserModifier {

  private users: Map<string, UserModel> = new Map();

  constructor(
    private readonly idGenerationService: IdGenerationService,
  ) {}


  updateSpectating(user: UserModel, isSpectating: boolean): void {
    user.setState(isSpectating ? State.SPECTATING : State.CONNECTED);
  }

  makeUserModel(userName: string): UserModel {
    const userId = this.idGenerationService.nextId();
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
