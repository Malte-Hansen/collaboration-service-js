export const COMPONENT_UPDATE_EVENT = 'component_update';

export type ComponentUpdateMessage = {
  appId: string;
  componentId: string;
  isOpened: boolean;
  isFoundation: boolean;
};
