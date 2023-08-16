import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { Session } from 'src/util/session';

@Injectable()
export class SessionService {

    private readonly sessions: Map<Socket,Session>;

    constructor() {
        this.sessions = new Map();
    }

    register(session: Session): void {
        this.sessions.set(session.getSocket(), session);
    }

    unregister(session: Session): void {
        this.sessions.delete(session.getSocket());
    }

    lookupSession(socket: Socket): Session {
        return this.sessions.get(socket);
    }

    // TODO more mappings
}
