import { VisualizationMode } from "src/util/visualization-mode";

export const VISUALIZATION_MODE_UPDATE_EVENT = 'visualization_mode_update';

export type VisualizationModeUpdateMessage = {
    mode: VisualizationMode
}