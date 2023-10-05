import { DetachedMenuModel } from "src/model/detached-menu-model";
import { GrabModifier } from "./grab-modifier";

export class DetachedMenuModifier {
    private detachedMenus: Map<string, DetachedMenuModel> = new Map();
    
    private grabModifier: GrabModifier;

    constructor(grabModifier: GrabModifier) {
        this.grabModifier = grabModifier;
    }

    getDetachedMenus(): DetachedMenuModel[] {
        return Array.from(this.detachedMenus.values());
    }

    detachMenu(objectId: string, detachId: string, entityType: string, userId: string, position: number[], quaternion: number[], scale: number[]) {
        const menu: DetachedMenuModel = new DetachedMenuModel(detachId, entityType, objectId, userId);
        menu.setPosition(position);
        menu.setQuaternion(quaternion);
        menu.setScale(scale);
        this.detachedMenus.set(objectId, menu);
        this.grabModifier.addGrabbableObject(menu);
    }

    closeDetachedMenu(menuId: string): boolean {
        const menu: DetachedMenuModel | undefined = this.detachedMenus.get(menuId);
        if (menu) {
            this.detachedMenus.delete(menuId);
            this.grabModifier.removeGrabbableObject(menu);
            return true;
        }
    }

    closeAllDetachedMenus(): void {
        for (const menu of this.detachedMenus.values()) {
            this.grabModifier.removeGrabbableObject(menu);
        }
        this.detachedMenus.clear();
    }
}