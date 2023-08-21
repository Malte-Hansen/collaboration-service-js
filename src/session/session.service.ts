import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { Session } from 'src/util/session';

@Injectable()
export class SessionService {

    private readonly sessions: Map<Socket,Session>;
    private readonly socketByUserId: Map<string,Socket>;

    constructor() {
        this.sessions = new Map();
        this.socketByUserId = new Map();
    }

    register(session: Session): void {
        this.sessions.set(session.getSocket(), session);
        this.socketByUserId.set(session.getUser().getId(), session.getSocket());
    }

    unregister(session: Session): void {
        this.sessions.delete(session.getSocket());
        this.socketByUserId.delete(session.getUser().getId());
    }

    lookupSession(socket: Socket): Session {
        return this.sessions.get(socket);
    }

    lookupSocket(userId: string): Socket|undefined {
        return this.socketByUserId.get(userId);
    }


    // TODO more mappings
}
