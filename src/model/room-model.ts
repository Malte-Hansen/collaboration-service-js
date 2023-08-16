import { ExampleModifier } from "src/modifier/example-modifier";
import { UserModifier } from "src/modifier/user-modifier";

/**
 * A room is modeled by a collection of modifiers that each manage one particular aspect of the room.
 */
export class Room {
    private readonly roomId: string;
    private readonly roomName: string;
    
    private readonly exampleModifier: ExampleModifier;
    private readonly userModifier: UserModifier;
  
    constructor(roomId: string, roomName: string, exampleModifier: ExampleModifier, userModifier: UserModifier) {
      this.roomId = roomId;
      this.roomName = roomName;
      this.exampleModifier = exampleModifier;
      this.userModifier = userModifier;
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
    
  }