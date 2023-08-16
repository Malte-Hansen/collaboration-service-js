import { Injectable } from '@nestjs/common';
import { Room } from 'src/model/room-model';
import { ExampleModifierFactoryService } from '../example-modifier-factory/example-modifier-factory.service';
import { UserModifierFactoryService } from '../user-modifier-factory/user-modifier-factory.service';

@Injectable()
export class RoomFactoryService {

    constructor(
        private readonly exampleModifierFactoryService: ExampleModifierFactoryService,
        private readonly userModifierFactoryService: UserModifierFactoryService) {}

    makeRoom(roomId: string, roomName: string): Room {
        const exampleModifier = this.exampleModifierFactoryService.makeExampleModifier();
        const userModifier = this.userModifierFactoryService.makeUserModifier();
        
        return new Room(
            roomId, 
            roomName,
            exampleModifier,
            userModifier)
    }
}
