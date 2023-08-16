import { BaseModel } from './base-model';

export class UserModel extends BaseModel {
  private readonly userName: string;
  private state: State;
  private timeOfLastMessage: number;

  constructor(id: string, userName: string) {
    super(id);
    this.userName = userName;
  }

  getState(): State {
    return this.state;
  }

  setState(state: State): void {
    this.state = state;
  }

  getUserName(): string {
    return this.userName;
  }

  getTimeOfLastMessage(): number {
    return this.timeOfLastMessage;
  }

  setTimeOfLastMessage(time: number): void {
    this.timeOfLastMessage = time;
  }

  // TODO some properties are missing

}

export enum State {
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  SPECTATING = 'SPECTATING',
}
