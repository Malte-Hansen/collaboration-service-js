import { Color } from 'src/util/color';
import { BaseModel } from './base-model';
import { ControllerModel } from './controller-model';
import { HighlightingModel } from './highlighting-model';

export enum UserState {
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  SPECTATING = 'SPECTATING',
}

export class UserModel extends BaseModel {
  private readonly userName: string;
  private readonly controllers: Map<number,ControllerModel>;
  private state: UserState;
  private timeOfLastMessage: number;
  private readonly color: Color;
  private hasHighlightedEntity: boolean;
  private highlightedEntities: HighlightingModel[]; 


  constructor(id: string, userName: string, color: Color, position: number[], quaternion: number[]) {
    super(id);
    this.userName = userName;
    this.color = color;
    this.controllers = new Map();
    this.setPosition(position);
    this.setQuaternion(quaternion);
  }

  getColor(): Color {
    return this.color;
  }

  getState(): UserState {
    return this.state;
  }

  setState(state: UserState): void {
    this.state = state;
  }

  getUserName(): string {
    return this.userName;
  }

  getControllers(): ControllerModel[] {
    return Array.from(this.controllers.values());
  }

  getController(controllerId: number): ControllerModel {
    return this.controllers.get(controllerId);
  }

  addController(controllerModel: ControllerModel): void {
    this.controllers.set(controllerModel.getControllerId(), controllerModel);
  }

  removeController(controllerId: number) {
    this.controllers.delete(controllerId);
  }

  getTimeOfLastMessage(): number {
    return this.timeOfLastMessage;
  }

  setTimeOfLastMessage(time: number): void {
    this.timeOfLastMessage = time;
  }

  containsHighlightedEntity(): boolean {
    return this.hasHighlightedEntity;
  }

  setHighlighted(isHighlighted: boolean): void {
    this.hasHighlightedEntity = isHighlighted;
  }

  setHighlightedEntity(appId: string, entityType: string, entityId: string): void {
    this.setHighlighted(true);
    this.highlightedEntities.push(new HighlightingModel(appId, entityId, entityType));
  }

  getHighlightedEntities(): HighlightingModel[] {
    return this.highlightedEntities;
  }

  removeAllHighlightedEntities(): void {
    this.highlightedEntities = [];
  }

}
