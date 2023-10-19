export const HEATMAP_UPDATE_EVENT = 'heatmap_update';

export type HeatmapUpdateMessage = {
  active: boolean;
  applicationId: string;
  metric: string;
  mode: string;
};
