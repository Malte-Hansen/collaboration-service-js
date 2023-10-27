import { HighlightingModel } from "src/model/highlighting-model";

export const USER_DISCONNECTED_EVENT = 'user_disconnect';

export type UserDisconnectedMessage = {
  id: string;
  highlightedComponents: HighlightingModel[]
};
