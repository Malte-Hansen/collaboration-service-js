import { Socket } from 'socket.io';
import { Room } from 'src/model/room-model';
import { UserModel } from 'src/model/user-model';

/**
 * Contains all information associated with a currently open websocket connection.
 */
export class Session {
  /**
   * The actual websocket.
   */
  private readonly socket: Socket;

  /**
   * The room the user who connected via the websocket is in.
   */
  private readonly room: Room;

  private readonly user: UserModel;

  constructor(socket: Socket, room: Room, user: UserModel) {
    this.socket = socket;
    this.room = room;
    this.user = user;
  }

  getSocket(): Socket {
    return this.socket;
  }

  getRoom(): Room {
    return this.room;
  }

  getUser(): UserModel {
    return this.user;
  }

  // TODO send method?
}
