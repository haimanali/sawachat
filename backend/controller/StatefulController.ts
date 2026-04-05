import http from "http";
import { Socket, Server } from "socket.io";
import cookie from "cookie";
import { IClient } from "../domain/IClient.js";
import { wsSession } from "./wsSession.js";
import { DBConn } from "../repository/DBConn.js";
import { IApiApplication } from "../Application/IApiApplication.js";

export class StatefulController{

    public async clientDisconnect(user_id : number, wsSession : wsSession) : Promise<void>
    {
        this.active_clients.get(user_id)!.delete(wsSession);

        if (this.active_clients.get(user_id)!.size === 0)
        {
            this.client_room.get(user_id)?.forEach( (room) => {
                this.active_rooms.get(room)?.delete(user_id);

                if (this.active_rooms.get(room)?.size === 0)
                      this.active_rooms.delete(room);
            });
    
            this.client_room.delete(user_id);
        }

    }

    public async broadcastRequest(type : string, r_user_id : number, init_wsSession : wsSession, payload : any) : Promise<void>
    {
        this.active_clients.get(r_user_id)?.forEach( (other_wsSession) => {
            if (other_wsSession === init_wsSession) return;

            other_wsSession?.write(type, payload);;
        });
    }

    public async broadcastRoom(type : string, s_user_id : number, init_wsSession : wsSession, payload : any) : Promise<void>
    {
        this.active_clients.get(s_user_id)?.forEach( (other_wsSession) => {
            if (other_wsSession === init_wsSession) return;

            other_wsSession?.write(type, payload);;
        });    
    }

    public async broadcastMessage(type : string, room_id : number, init_wsSession : wsSession, payload : any) : Promise<void>
    {
        this.active_rooms.get(room_id)?.forEach( (user_id) => {

            this.active_clients.get(user_id)?.forEach( (other_wsSession) => {
                if (other_wsSession === init_wsSession) return;
                other_wsSession?.write(type, payload);
            });

        });
    }

    public setRoomMember(room_id : number, user_id : number) : void
    {
        if (!this.active_rooms.has(room_id))                            // add room to active rooms
            this.active_rooms.set(room_id, new Set());

        this.active_rooms.get(room_id)!.add(user_id);

        if (!this.client_room.has(user_id))
            this.client_room.set(user_id, new Set())                   // add room to client rooms

        this.client_room.get(user_id)!.add(room_id);
    }

    public errorHandler(wsSession : wsSession, fn : Function) 
    {
        return async () => {
            await this.transactionHandler(wsSession ,async () => await fn()) ;
        };
    }

    public static getInstance(http_server : http.Server, Iapp_layer : IApiApplication) : StatefulController 
    {
        if (StatefulController.instance)
            return StatefulController.instance

        StatefulController.instance = new StatefulController (http_server, Iapp_layer);
        return StatefulController.instance;
    }

    //connection manager
    private active_clients = new Map<number, Set<wsSession>>();
    
    private active_rooms = new Map<number, Set<number>>();
    private client_room = new Map<number, Set<number>>();

    
    //ws manager
    private io_server : Server;
    private static instance : StatefulController;

    private Iapp_layer : IApiApplication;

    private constructor (http_server : http.Server, Iapp_layer : IApiApplication) 
    {   
        this.Iapp_layer = Iapp_layer;

        this.io_server = new Server(http_server, {
            cors : {
                origin : "http://localhost:5173",
                credentials : true,
                methods : ["POST", "GET", "PUT", "DELETE"],
            }
        });

        this.io_server.use(async (soc, next) => {

            const header_cookie : string | undefined = soc.handshake.headers.cookie;

            if (!header_cookie)
                return next(new Error("Auth failed"));

            const parse_cookie = cookie.parse(header_cookie);
            const session_id = parse_cookie.session_id;
            
            if (!session_id)
               return next(new Error("Auth failed"));

            const client : IClient = (await this.Iapp_layer.authenticateBySessionID(session_id)).internal!;

            soc.data.client = client;
            next();
        });
        

        this.asyncAcceptor();
    }

    private async transactionHandler(wsSession : wsSession, fn : () => Promise<void> ) : Promise<void>  
    {
        const conn = await DBConn.beginTransaction(); 
        try 
        {
           await DBConn.runTransaction(conn, async () => {
                await fn();
            });
            await conn.commit();
        } 
        catch (error : any) 
        {
            await conn.rollback();
            console.log(error.message);
            wsSession.write("onerror", { log_message :  "Server down"});
        }
        finally
        {
            conn.release();
        }
    }   
    
    private asyncAcceptor() : void
    {
        this.io_server.on("connection", (soc) => {

            const client : IClient = soc.data.client;
            const ws_session = new wsSession(soc ,StatefulController.instance ,this.Iapp_layer ,client);
            
            if (!this.active_clients.has(client.user_id))
                this.active_clients.set(client.user_id, new Set());
            
            this.active_clients.get(client.user_id)?.add(ws_session);
            
        });
    }

}