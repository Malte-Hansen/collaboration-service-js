import { ControllerModel } from "src/model/controller-model";
import { UserState, UserModel } from "src/model/user-model";
import { Controller } from "src/util/controller";
import { ControllerPose } from "src/util/controller";
import { Pose } from "src/util/pose";
import { ColorModifier } from "./color-modifier";

export class UserModifier {

  private users: Map<string, UserModel> = new Map();

  private readonly colorModifier: ColorModifier;

  constructor(colorModifier: ColorModifier) {
    this.colorModifier = colorModifier;
  }

  updateUserPose(user: UserModel, pose: Pose): void {
    if (user && pose) {
      user.setPosition(pose.position);
      user.setQuaternion(pose.quaternion);
    }
  }

  updateControllerPose(controller: ControllerModel, pose: ControllerPose): void {
    if (controller && pose) {
      controller.setPosition(pose.position);
      controller.setQuaternion(pose.quaternion);
      controller.setIntersection(pose.intersection);
    }
  }

  connectController(uniqueId: string, user: UserModel, controller: Controller) {
    const controllerModel = this.makeControllerModel(uniqueId, controller.controllerId, controller.assetUrl);
    controllerModel.setPosition(controller.position);
    controllerModel.setQuaternion(controller.quaternion);
    controllerModel.setIntersection(controller.intersection);
    user.addController(controllerModel);
  }

  disconnectController(user: UserModel, controllerId: number): void {
    user.removeController(controllerId);
  }

  updateSpectating(user: UserModel, isSpectating: boolean): void {
    user.setState(isSpectating ? UserState.SPECTATING : UserState.CONNECTED);
  }

  updateHighlighting(user: UserModel, appId: string, entityId: string, entityType: string, isHighlighted: boolean): void {
    if (!isHighlighted) {
      user.setHighlighted(false);
      return;
    }

    for (const otherUser of this.users.values()) {
      if (
        otherUser.containsHighlightedEntity() &&
        otherUser.getHighlightedEntity().getHighlightedApp() === appId &&
        otherUser.getHighlightedEntity().getHighlightedEntity() === entityId
      ) {
        otherUser.setHighlighted(false);
      }
    }
    user.setHighlightedEntity(appId, entityType, entityId);
  }

  makeUserModel(userId: string, userName: string, colorId: number): UserModel {
    const color = this.colorModifier.assignColor(colorId);
    return new UserModel(userId, userName, color);
  }

  makeControllerModel(id: string, controllerId: number, assetUrl: string): ControllerModel {
    return new ControllerModel(id, controllerId, assetUrl);
  }

  addUser(user: UserModel): void {
    this.users.set(user.getId(), user);
    // TODO user connected event
  }

  removeUser(userId: string): void {
    const user = this.users.get(userId);
    
    if (!user) return;

    this.colorModifier.unassignColor(user.getColor().colorId);
    // TODO release grabbed

    this.users.delete(userId);
      // TODO user disconneced event
  }

  getUsers(): UserModel[] {
    return Array.from(this.users.values());
  }

  hasUser(userId: string): boolean {
    return this.users.has(userId);
  }

  getUserById(userId: string): UserModel {
    return this.users.get(userId);
  }

  // TODO some methods are missing
}
