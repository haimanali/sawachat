import { IClient } from "../domain/IClient.js";
import { Socket } from "socket.io";
import { action_schema, IActionRequest } from "../requestFormat.js";
import { StatefulController } from "./StatefulController.js";
import { IApiApplication } from "../Application/IApiApplication.js";
import { IAppLayerResponse, IPayloadInterface } from "../responseFormat.js";


export class wsSession
{
    public async write(type : string , payload : any) : Promise<void>
    {
        //check write Q
        this.writeQ.push( { type, payload });

        const processNext = () => {
            if (this.writeQ.length === 0)
            {
                this.is_writting = false;
                return;
            }
 
            this.is_writting = true;

            const json_package = this.writeQ.shift();

            if (json_package)
            {
                this.soc.emit("message", json_package);
                setImmediate( () => processNext());
            }
        };

        if (!this.is_writting && this.soc.conn._readyState === "open")
            processNext();
    }

    public readonly client : IClient;

    private stateful_controller : StatefulController;
    private Iapp_layer : IApiApplication;
    
    private soc : Socket;
    private writeQ : any[] = [];
    private is_writting : boolean = false;

    constructor(soc : Socket ,stateful_controller : StatefulController , Iapp_layer : IApiApplication, client : IClient)
    {
        this.soc = soc;
        this.client = client;

        this.stateful_controller = stateful_controller;
        this.Iapp_layer = Iapp_layer;
        
        this.setUpListners();
    }

    private setUpListners() : void
    {
        this.soc.on("message", async (raw_data) => 
        this.stateful_controller.
        errorHandler(this, async () => await this.handleDate(raw_data))()
    );

        this.soc.on("disconnect", () => {
            this.stateful_controller.clientDisconnect(this.client.user_id, this);
        })
    }

    private preparePayload (response : IAppLayerResponse<any, any>) : IPayloadInterface<any>
    {
        return {
            success : response.success,
            log_message : response.log_message,
            data : response.data,            
        };
    }

    private async handleDate(raw_data: any): Promise<void> {
        const result = action_schema.safeParse(raw_data);

        if(!result.success) 
            throw Error("request object miss match");

        const data : IActionRequest = result.data!;
        switch (data.type) {
            case "load_requests":
                {
                    const offset = data.payload.offset;

                    const result = await this.Iapp_layer.fetchUserRequests(this.client, offset);
                    this.write(`on${data.type}`, this.preparePayload(result));
                }
                break;
            case "load_rooms":
                {
                    const offset = data.payload.offset;

                    const result = await this.Iapp_layer.fetchUserRooms(this.client, offset);
                    this.write(`on${data.type}`, this.preparePayload(result));
                }
                break;
            case "load_messages":
                {
                    const offset = data.payload.offset;
                    const room_public_id = data.payload.room_public_id;

                    const result = await this.Iapp_layer.fetchUserMessages(room_public_id, offset);
                    this.write(`on${data.type}`, this.preparePayload(result));
                }
                break;
            case "send_request":
                {
                    const username = data.payload.username;

                    const result = await this.Iapp_layer.sendContactRequest(username, this.client.user_id);
                    this.write(`on${data.type}`, this.preparePayload(result));

                    //broadcast request
                    this.stateful_controller.broadcastRequest(data.type, result.internal!.user_id, this, this.preparePayload(result));
                }
                break;
            case "verdict_request_create_room" :
                {
                    const username = data.payload.req_public_id;
                    const verdict = data.payload.verdict

                    const result = await this.Iapp_layer.acceptContactRequest(username, verdict, this.client);
                    if (!result.success)
                        return this.write(`on${data.type}`, this.preparePayload(result));

                    this.stateful_controller.setRoomMember(result.internal!.room!.room_id, this.client.user_id); //add this
                    this.stateful_controller.setRoomMember(result.internal!.room!.room_id, result.internal!.s_client.user_id); //add other

                     //broadcast room to clients
                     this.write(`on${data.type}`, this.preparePayload({success : result.success, data : result.data?.r_room, log_message : result.log_message}));
                     this.stateful_controller.broadcastRoom(data.type, result.internal!.s_client.user_id, this, this.preparePayload({success : result.success, data : result.data?.s_room, log_message : result.log_message}));
                }
                break;
            case "send_message":
                {
                    const room_public_id = data.payload.room_public_id;
                    const content = data.payload.msg_content;

                    const result = await this.Iapp_layer.sendMessage(room_public_id, content, this.client);

                    this.write(`on${data.type}`, this.preparePayload(result));

                    //broadcast to users in the room,
                    this.stateful_controller.broadcastMessage(data.type, result.internal!.room_id, this, this.preparePayload(result));
                }
                break;
        
            default:
                throw Error("invalid client request");
                break;
        }
    }

}