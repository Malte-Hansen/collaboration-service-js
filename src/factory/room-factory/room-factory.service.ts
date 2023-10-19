import { Injectable } from '@nestjs/common';
import { Room } from 'src/model/room-model';
import { ApplicationModifier } from 'src/modifier/application-modifier';
import { ColorModifier } from 'src/modifier/color-modifier';
import { DetachedMenuModifier } from 'src/modifier/detached-menu-modifier';
import { ExampleModifier } from 'src/modifier/example-modifier';
import { GrabModifier } from 'src/modifier/grab-modifier';
import { HeatmapModifier } from 'src/modifier/heatmap-modifier';
import { LandscapeModifier } from 'src/modifier/landscape-modifier';
import { UserModifier } from 'src/modifier/user-modifier';

@Injectable()
export class RoomFactoryService {
  constructor() {}

  makeRoom(roomId: string, roomName: string, landscapeId: string): Room {
    const grabModifier = new GrabModifier();
    const colorModifier = new ColorModifier();
    const exampleModifier = new ExampleModifier();
    const userModifier = new UserModifier(colorModifier);
    const landscapeModifier = new LandscapeModifier(landscapeId, grabModifier);
    const detachedMenuModifier = new DetachedMenuModifier(grabModifier);
    const heatmapModifier = new HeatmapModifier();
    const applicationModifier = new ApplicationModifier(grabModifier);

    return new Room(
      roomId,
      roomName,
      exampleModifier,
      userModifier,
      applicationModifier,
      landscapeModifier,
      detachedMenuModifier,
      heatmapModifier,
      colorModifier,
      grabModifier,
    );
  }
}
