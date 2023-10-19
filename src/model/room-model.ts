import { ApplicationModifier } from 'src/modifier/application-modifier';
import { ColorModifier } from 'src/modifier/color-modifier';
import { DetachedMenuModifier } from 'src/modifier/detached-menu-modifier';
import { ExampleModifier } from 'src/modifier/example-modifier';
import { GrabModifier } from 'src/modifier/grab-modifier';
import { HeatmapModifier } from 'src/modifier/heatmap-modifier';
import { LandscapeModifier } from 'src/modifier/landscape-modifier';
import { UserModifier } from 'src/modifier/user-modifier';

/**
 * A room is modeled by a collection of modifiers that each manage one particular aspect of the room.
 * It represents the local room model of a replica.
 * All modifiers do only manipulate the local model and does not interact with other replicas.
 */
export class Room {
  private readonly roomId: string;
  private readonly roomName: string;

  private readonly exampleModifier: ExampleModifier;
  private readonly userModifier: UserModifier;
  private readonly applicationModifier: ApplicationModifier;
  private readonly landscapeModifier: LandscapeModifier;
  private readonly detachedMenuModifier: DetachedMenuModifier;
  private readonly heatmapModifier: HeatmapModifier;
  private readonly colorModifier: ColorModifier;
  private readonly grabModifier: GrabModifier;

  constructor(
    roomId: string,
    roomName: string,
    exampleModifier: ExampleModifier,
    userModifier: UserModifier,
    applicationModifier: ApplicationModifier,
    landscapeModifier: LandscapeModifier,
    detachedMenuModifier: DetachedMenuModifier,
    heatmapModifier: HeatmapModifier,
    colorModifier: ColorModifier,
    grabModifier: GrabModifier,
  ) {
    this.roomId = roomId;
    this.roomName = roomName;
    this.exampleModifier = exampleModifier;
    this.userModifier = userModifier;
    this.applicationModifier = applicationModifier;
    this.landscapeModifier = landscapeModifier;
    this.detachedMenuModifier = detachedMenuModifier;
    this.heatmapModifier = heatmapModifier;
    this.colorModifier = colorModifier;
    this.grabModifier = grabModifier;
  }

  getRoomId(): string {
    return this.roomId;
  }

  getName(): string {
    return this.roomName;
  }

  getExampleModifier(): ExampleModifier {
    return this.exampleModifier;
  }

  getUserModifier(): UserModifier {
    return this.userModifier;
  }

  getApplicationModifier(): ApplicationModifier {
    return this.applicationModifier;
  }

  getLandscapeModifier(): LandscapeModifier {
    return this.landscapeModifier;
  }

  getDetachedMenuModifier(): DetachedMenuModifier {
    return this.detachedMenuModifier;
  }

  getHeatmapModifier(): HeatmapModifier {
    return this.heatmapModifier;
  }

  getColorModifier(): ColorModifier {
    return this.colorModifier;
  }

  getGrabModifier(): GrabModifier {
    return this.grabModifier;
  }
}
