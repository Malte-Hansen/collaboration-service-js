import { ApplicationModel } from "src/model/application-model";
import { GrabModifier } from "./grab-modifier";

export class ApplicationModifier {
    private openApplications: Map<string, ApplicationModel> = new Map();

    private grabModifier: GrabModifier;
  
    constructor(grabModifier: GrabModifier) {
        this.grabModifier = grabModifier;
    }
  
    getApplications(): ApplicationModel[] {
      return Array.from(this.openApplications.values());
    }
  
    openApplication(appId: string, position: number[], quaternion: number[], scale: number[]): void {
      const appModel = this.getOrCreateApplication(appId);
      appModel.setPosition(position);
      appModel.setQuaternion(quaternion);
      appModel.setScale(scale);
    }
  
    closeApplication(appId: string): boolean {
      if (!this.grabModifier.isGrabbed(appId)) {
        const app = this.openApplications.get(appId);
        if (app) {
          this.openApplications.delete(appId);
          this.grabModifier.removeGrabbableObject(app);
          return true;
        }
      }
      return false;
    }
  
    closeAllApplications(): void {
      for (const app of this.openApplications.values()) {
        this.grabModifier.removeGrabbableObject(app);
      }
      this.openApplications.clear();
    }
  
    updateComponent(componentId: string, appId: string, isFoundation: boolean, isOpened: boolean): void {
      const appModel = this.getOrCreateApplication(appId);
      if (isFoundation) {
        appModel.closeAllComponents();
      } else if (isOpened) {
        appModel.openComponent(componentId);
      } else {
        appModel.closeComponent(componentId);
      }
    }
  
    private getOrCreateApplication(appId: string): ApplicationModel {
      let appModel = this.openApplications.get(appId);
      if (!appModel) {
        appModel = new ApplicationModel(appId);
        this.openApplications.set(appId, appModel);
        this.grabModifier.addGrabbableObject(appModel);
      }
      return appModel;
    }
  }