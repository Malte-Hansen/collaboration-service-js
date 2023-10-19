import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { Session } from 'src/util/session';

@Injectable()
export class SessionService {
  private readonly sessions: Map<Socket, Session>;
  private readonly socketByUserId: Map<string, Socket>;

  constructor() {
    this.sessions = new Map();
    this.socketByUserId = new Map();
  }

  /**
   * Adds a newly established session.
   *
   * @param session The session
   */
  register(session: Session): void {
    this.sessions.set(session.getSocket(), session);
    this.socketByUserId.set(session.getUser().getId(), session.getSocket());
  }

  /**
   * Removes a session from the active sessions.
   *
   * @param session The session
   */
  unregister(session: Session): void {
    this.sessions.delete(session.getSocket());
    this.socketByUserId.delete(session.getUser().getId());
  }

  /**
   * Looks up an active session by the corresponding WebSocket object.
   *
   * @param socket The WebSocket object
   * @returns The session
   */
  lookupSession(socket: Socket): Session {
    return this.sessions.get(socket);
  }

  /**
   * Looks up a WebSocket object of an active session by the corresponding user.
   *
   * @param userId The user ID
   * @returns The WebSocket
   */
  lookupSocket(userId: string): Socket | undefined {
    return this.socketByUserId.get(userId);
  }
}
