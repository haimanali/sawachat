import http from "http";
import { Socket, Server } from "socket.io";
import cookie from "cookie";
import { IClient } from "../domain/IClient.js";
import { wsSession } from "./wsSession.js";
import { DBConn } from "../repository/DBConn.js";
import { IApiApplication } from "../Application/IApiApplication.js";
import { IAppLayerResponse, IPayloadInterface, IPayloadResponseType } from "../responseFormat.js";

// this controller keeps track of all online users and active rooms
// it handles sending messages to the right people in real time
export class StatefulController {

    // this function tells your friends when you go online or offline
    public async broadcastConnectionState(type: string, user_id: number, wsSession: wsSession, paylaod: any) {
        this.client_contact.get(user_id)?.forEach((contactID) => {
            this.active_clients.get(contactID)?.forEach((other_wsSession) => {
                if (other_wsSession === wsSession)
                    return;

                other_wsSession.write(type, paylaod);
            });
        });
    }

    // this handles cleaning up when someone closes the app
    public async clientDisconnect(user_id: number, wsSession: wsSession): Promise<void> {
        const client_sessions = this.active_clients.get(user_id);
        if (!client_sessions)
            return;

        client_sessions.delete(wsSession);

        if (client_sessions.size === 0) {
            this.client_room.get(user_id)?.forEach((room) => {
                this.active_rooms.get(room)?.delete(user_id);

                if (this.active_rooms.get(room)?.size === 0)
                    this.active_rooms.delete(room);
            });

            this.client_room.delete(user_id);
            this.client_contact.delete(user_id);
            this.active_clients.delete(user_id);
        }

    }

    // this sends a request to another user
    public async broadcastRequest(type: string, r_user_id: number, init_wsSession: wsSession, payload: any): Promise<void> {
        this.active_clients.get(r_user_id)?.forEach((other_wsSession) => {
            if (other_wsSession === init_wsSession) return;

            other_wsSession?.write(type, payload);;
        });
    }

    // this sends a private notification to a specific user
    public async broadcastNotificationToUser(type: string, s_user_id: number, init_wsSession: wsSession, payload: any): Promise<void> {
        this.active_clients.get(s_user_id)?.forEach((other_wsSession) => {
            if (other_wsSession === init_wsSession) return;

            other_wsSession?.write(type, payload);;
        });
    }


    // this sends a notification to everyone in a room
    public async broadcastNotificationToRoom(type: string, room_id: number, init_wsSession: wsSession, payload: any): Promise<void> {
        this.active_rooms.get(room_id)?.forEach((user_id) => {
            this.active_clients.get(user_id)?.forEach((other_wsSession) => {
                if (other_wsSession === init_wsSession) return;
                other_wsSession?.write(type, payload);
            });
        });
    }

    // this broadcasts room updates
    public async broadcastRoom(type: string, s_user_id: number, init_wsSession: wsSession, payload: any): Promise<void> {
        this.active_clients.get(s_user_id)?.forEach((other_wsSession) => {
            if (other_wsSession === init_wsSession) return;

            other_wsSession?.write(type, payload);;
        });
    }


    // this is the main function for sending a message to everyone in a chat room
    public async broadcastMessage(type: string, room_id: number, init_wsSession: wsSession, payload: any, callback?: Function): Promise<void> {
        this.active_rooms.get(room_id)?.forEach((user_id) => {
            this.active_clients.get(user_id)?.forEach((other_wsSession) => {
                // we don't send the message back to the person who sent it
                if (other_wsSession === init_wsSession) return;
                other_wsSession?.write(type, payload);
            });
        });
    }

    public removeRoomMember(room_id: number, user_id: number) {
        const roomMembers = this.active_rooms.get(room_id);

        if (roomMembers) {
            roomMembers.delete(user_id);

            if (roomMembers.size === 0)
                this.active_rooms.delete(room_id);


        }

        this.client_room.get(user_id)?.delete(room_id);

        if (this.client_room.get(user_id)?.size === 0)
            this.client_room.delete(user_id);
    }

    public setRoomMember(room_id: number, user_id: number): void {
        if (!this.active_rooms.has(room_id))                            // add room to active rooms
            this.active_rooms.set(room_id, new Set());

        this.active_rooms.get(room_id)!.add(user_id);

        if (!this.client_room.has(user_id))
            this.client_room.set(user_id, new Set())                   // add room to client rooms

        this.client_room.get(user_id)!.add(room_id);
    }

    public removeClientContact(user_id: number, contact_id: number) {
        this.client_contact.get(user_id)?.delete(contact_id);

        if (this.client_contact.get(user_id)?.size === 0)
            this.client_contact.delete(user_id);
    }

    public setClientContact(user_id: number, contact_id: number) {
        if (!this.client_contact.has(user_id))
            this.client_contact.set(user_id, new Set());

        this.client_contact.get(user_id)!.add(contact_id);
    }

    public errorHandler(wsSession: wsSession, fn: Function) {
        return async () => {
            await this.transactionHandler(wsSession, async () => await fn());
        };
    }

    public static getInstance(http_server: http.Server, Iapp_layer: IApiApplication): StatefulController {
        if (StatefulController.instance)
            return StatefulController.instance

        StatefulController.instance = new StatefulController(http_server, Iapp_layer);
        return StatefulController.instance;
    }

    //connection manager real-time broadcastors

    //client
    public readonly active_clients = new Map<number, Set<wsSession>>();
    public readonly client_room = new Map<number, Set<number>>(); // users -> set(rooms) for client disconnection optimization...
    public readonly client_contact = new Map<number, Set<number>>();

    //rooms
    public readonly active_rooms = new Map<number, Set<number>>(); //room -> set(users)

    //ws manager
    private io_server: Server;
    private static instance: StatefulController;

    private app_layer: IApiApplication;

    private constructor(http_server: http.Server, Iapp_layer: IApiApplication) {
        this.app_layer = Iapp_layer;

        this.io_server = new Server(http_server, {
            cors: {
                origin: "http://localhost:5173",
                credentials: true,
                methods: ["POST", "GET", "PUT", "DELETE"],
            }
        });

        this.io_server.use(async (soc, next) => {

            const header_cookie: string | undefined = soc.handshake.headers.cookie;

            if (!header_cookie)
                return next(new Error(IPayloadResponseType.ONAUTH_FAIL));

            const parse_cookie = cookie.parse(header_cookie);
            const session_id = parse_cookie.session_id;

            if (!session_id)
                return next(new Error(IPayloadResponseType.ONAUTH_FAIL));

            const result = await this.app_layer.authenticateBySessionID(session_id);

            if (!result.success) 
                return next(new Error("Auth failed")); 

            const client: IClient = result.internal!;

            soc.data.client = client;
            next();
        });


        this.asyncAcceptor();
    }

    private async transactionHandler(wsSession: wsSession, fn: () => Promise<void>): Promise<void> {
        const conn = await DBConn.beginTransaction();
        try {
            await DBConn.runTransaction(conn, async () => {
                await fn();
            });
            await conn.commit();
        }
        catch (error: any) {
            await conn.rollback();
            console.log(error.message);

            this.clientDisconnect(wsSession.client.user_id, wsSession);
        }
        finally {
            conn.release();
        }
    }

    private asyncAcceptor(): void {
        this.io_server.on("connection", async (soc) => {

            const client: IClient = soc.data.client;
            const ws_session = new wsSession(soc, StatefulController.instance, this.app_layer, client);

            if (!this.active_clients.has(client.user_id))
                this.active_clients.set(client.user_id, new Set());

            this.active_clients.get(client.user_id)?.add(ws_session);

        });
    }


    public preparePayload(response: IAppLayerResponse<any, any>): IPayloadInterface<any> {
        return {
            success: response.success,
            log_message: response.log_message,
            data: response.data,
        };
    }

}