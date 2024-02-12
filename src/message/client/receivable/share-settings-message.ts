export const SHARE_SETTINGS_EVENT = 'share_settings';

export type ShareSettingsMessage = {
  event: typeof SHARE_SETTINGS_EVENT;
  settings: any;
};
