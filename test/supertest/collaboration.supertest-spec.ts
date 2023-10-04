import * as request from 'supertest';
import { io, type Socket } from "socket.io-client";
import { MENU_DETACHED_EVENT } from 'src/message/client/receivable/menu-detached-message';

const host = process.env.NEST_HOST || 'localhost';
const port = process.env.NEST_PORT || '4444';
const baseURL = 'http://' + host + ':' + port;

// events
const COMPONENT_UPDATE_EVENT = 'component_update';
const HIGHLIGHTING_UPDATE_EVENT = 'highlighting_update';
const MOUSE_PING_UPDATE_EVENT = 'mouse_ping_update';
const USER_POSITIONS_EVENT = 'user_positions';
const OBJECT_CLOSED_RESPONSE_EVENT = 'object_closed_response';
const MENU_DETACHED_RESPONSE_EVENT = "menu_detached_response";
const SELF_CONNECTED_EVENT = 'self_connected';
const SPECTATING_UPDATE_EVENT = 'spectating_update';
const HEATMAP_UPDATE_EVENT = 'heatmap_update';
const PING_UPDATE_EVENT = 'ping_update';
const APP_OPENED_EVENT = 'app_opened';
const TIMESTAMP_UPDATE_EVENT = 'timestamp_update';

type CollaborationClient = {
    id: string,
    socket: Socket
};

async function createRoom(): Promise<string> {
    const payload = require('./../../test-payload/initial-room.json');
        const response = await request(baseURL).post('/room').send(payload);
        return response.body.roomId;
}

async function createClient(roomId: string): Promise<CollaborationClient> {
    const payload = require('./../../test-payload/join-lobby.json');
    const response = await request(baseURL).post('/room/' + roomId + '/lobby').send(payload);
    var socket = io(baseURL, {
        transports: ["websocket"],
        query: {
            "ticketId": response.body.ticketId,
            "userName": "JOHNNY",
            "mode": "vr"
        }
    });
    var id: string;
    socket.on(SELF_CONNECTED_EVENT, (msg) => {
        id = msg.self.id;
    }); 
    await sleep(500);
    return {id, socket};
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

describe('e2e', () => {
    // re-created for each test
    var client1: CollaborationClient;
    var client2: CollaborationClient;

    beforeEach(async () => {
        const roomId = await createRoom();
        await sleep(500);
        client1 = await createClient(roomId);
        client2 = await createClient(roomId);
    });

    afterEach(() => {
        client1.socket.disconnect();
        client2.socket.disconnect();
    });

    it('highlight component', async () => {
        return new Promise<void>(async (resolve, reject) => {

            const message = require('./../../test-payload/highlighting-update.json');
            client2.socket.on(HIGHLIGHTING_UPDATE_EVENT, (msg) => {
                expect(msg).toStrictEqual({userId: client1.id, originalMessage: message});
                resolve();
            })
            client1.socket.emit(HIGHLIGHTING_UPDATE_EVENT, message);

            await sleep(1000);
            reject(new Error("No message received"));
        });
    });

    it('open component', async () => {
        return new Promise<void>(async (resolve, reject) => {

            const message = require('./../../test-payload/component-update-open.json');
            client2.socket.on(COMPONENT_UPDATE_EVENT, (msg) => {
                expect(msg).toStrictEqual({userId: client1.id, originalMessage: message});
                resolve();
            })
            client1.socket.emit(COMPONENT_UPDATE_EVENT, message);

            await sleep(1000);
            reject(new Error("No message received"));
        });
    });

    it('mouse ping', async () => {
        return new Promise<void>(async (resolve, reject) => {

            const message = require('./../../test-payload/mouse-ping-update.json');
            client2.socket.on(MOUSE_PING_UPDATE_EVENT, (msg) => {
                expect(msg).toStrictEqual({userId: client1.id, originalMessage: message});
                resolve();
            })
            client1.socket.emit(MOUSE_PING_UPDATE_EVENT, message);

            await sleep(1000);
            reject(new Error("No message received"));
        });
    });

    it('update spectating', async () => {
        return new Promise<void>(async (resolve, reject) => {

            const message = {
                "userId": client1.id,
                "spectating": true,
                "spectatedUser": client2.id
            };
            client2.socket.on(SPECTATING_UPDATE_EVENT, (msg) => {
                expect(msg).toStrictEqual({userId: client1.id, originalMessage: message});
                resolve();
            })
            client1.socket.emit(SPECTATING_UPDATE_EVENT, message);

            await sleep(1000);
            reject(new Error("No message received"));
        });
    });

    it('update heatmap', async () => {
        return new Promise<void>(async (resolve, reject) => {

            const message = require('./../../test-payload/heatmap-update.json');
            client2.socket.on(HEATMAP_UPDATE_EVENT, (msg) => {
                expect(msg).toStrictEqual({userId: client1.id, originalMessage: message});
                resolve();
            })
            client1.socket.emit(HEATMAP_UPDATE_EVENT, message);

            await sleep(1000);
            reject(new Error("No message received"));
        });
    });

    it('controller ping', async () => {
        return new Promise<void>(async (resolve, reject) => {

            const message = require('./../../test-payload/ping-update.json');
            client2.socket.on(PING_UPDATE_EVENT, (msg) => {
                expect(msg).toStrictEqual({userId: client1.id, originalMessage: message});
                resolve();
            })
            client1.socket.emit(PING_UPDATE_EVENT, message);

            await sleep(1000);
            reject(new Error("No message received"));
        });
    });

    it('open app', async () => {
        return new Promise<void>(async (resolve, reject) => {

            const message = require('./../../test-payload/app-opened.json');
            client2.socket.on(APP_OPENED_EVENT, (msg) => {
                expect(msg).toStrictEqual({userId: client1.id, originalMessage: message});
                resolve();
            })
            client1.socket.emit(APP_OPENED_EVENT, message);

            await sleep(1000);
            reject(new Error("No message received"));
        });
    });

    it('close component', async () => {
        return new Promise<void>(async (resolve, reject) => {

            const message = require('./../../test-payload/component-update-close.json');
            client2.socket.on(COMPONENT_UPDATE_EVENT, (msg) => {
                expect(msg).toStrictEqual({userId: client1.id, originalMessage: message});
                resolve();
            })
            client1.socket.emit(COMPONENT_UPDATE_EVENT, message);

            await sleep(1000);
            reject(new Error("No message received"));
        });
    });

    it('update timestamp', async () => {
        return new Promise<void>(async (resolve, reject) => {

            const message = require('./../../test-payload/timestamp-update.json');
            client2.socket.on(TIMESTAMP_UPDATE_EVENT, (msg) => {
                expect(msg).toStrictEqual({userId: client1.id, originalMessage: message});
                resolve();
            })
            client1.socket.emit(TIMESTAMP_UPDATE_EVENT, message);

            await sleep(1000);
            reject(new Error("No message received"));
        });
    });

    it('detach menu', async () => {
        return new Promise<void>(async (resolve, reject) => {

            const message = require('./../../test-payload/menu-detached.json');

            var forwardedObjectId: string;
            client2.socket.on(MENU_DETACHED_EVENT, (msg) => {
                expect(msg.userId).toStrictEqual(client1.id);
                forwardedObjectId = msg.objectId;
            })

            var respondedObjectId: string;
            client1.socket.on(MENU_DETACHED_RESPONSE_EVENT, (msg) => {
                // nonce is correct
                expect(msg.nonce).toStrictEqual(message.nonce);
                respondedObjectId = msg.response.objectId;
            });

            client1.socket.emit(MENU_DETACHED_EVENT, message);

            await sleep(1000);
            // both clients received equal object id
            expect(forwardedObjectId).toBeDefined();
            expect(respondedObjectId).toBeDefined();
            expect(forwardedObjectId).toStrictEqual(respondedObjectId);
            resolve();
        });
    });

    //it('close detached menu', async () => {});

    //it('user position', async () => {});

    //it('move object', async () => {});
    
    //it('timestamp is propagated', async () => {});

    //it('object can be grabbed by one user only', async () => {});

    //it('grabbed app cannot be closed', async () => {});

    //it('grabbed menu cannot be closed', async () => {});

});