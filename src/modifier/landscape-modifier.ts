import { LandscapeModel } from 'src/model/landscape-model';
import { GrabModifier } from './grab-modifier';

export class LandscapeModifier {
  private static readonly LANDSCAPE_CENTER_POSITION: number[] = [0.0, 0.0, 0.0];
  private static readonly LANDSCAPE_CENTER_SCALE: number[] = [0.1, 0.1, 0.1];

  private landscape: LandscapeModel;
  private grabModifier: GrabModifier;

  constructor(
    private landscapeId: string,
    grabModifier: GrabModifier,
  ) {
    this.landscape = new LandscapeModel(landscapeId);
    this.grabModifier = grabModifier;
  }

  getLandscape(): LandscapeModel {
    return this.landscape;
  }

  initLandscape(landscapeToken: string, timestamp: number): void {
    this.landscape.setLandscapeToken(landscapeToken);
    this.landscape.setTimestamp(timestamp);
    this.grabModifier.addGrabbableObject(this.landscape);
  }

  updateTimestamp(timestamp: number): void {
    this.landscape.setTimestamp(timestamp);
    this.centerLandscape();
  }

  private centerLandscape(): void {
    this.landscape.setPosition(LandscapeModifier.LANDSCAPE_CENTER_POSITION);
    this.landscape.setQuaternion([-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)]);
    this.landscape.setScale(LandscapeModifier.LANDSCAPE_CENTER_SCALE);
  }
}
