import { IClient } from "../domain/IClient.js";
import { Socket } from "socket.io";
import { action_schema, IActionRequest, IPayloadRequestType } from "../requestFormat.js";
import { StatefulController } from "./StatefulController.js";
import { IApiApplication } from "../Application/IApiApplication.js";
import { IAppLayerResponse, IPayloadInterface, IPayloadResponseType } from "../responseFormat.js";


export class wsSession {
    public async write(type: string, payload: any): Promise<void> {
        //check write Q
        this.writeQ.push({ type, payload });

        const processNext = () => {
            if (this.writeQ.length === 0) {
                this.is_writting = false;
                return;
            }

            this.is_writting = true;

            const json_package = this.writeQ.shift();

            if (json_package) {
                this.soc.emit(json_package.type, json_package);
                setImmediate(() => processNext());
            }
        };

        if (!this.is_writting && this.soc.conn._readyState === "open")
            processNext();
    }

    public readonly client: IClient;

    private stateful_controller: StatefulController;
    private Iapp_layer: IApiApplication;

    private soc: Socket;
    private writeQ: any[] = [];
    private is_writting: boolean = false;

    private readonly SESSION_EXTEND_TIME = 1000 * 60 * 30;
    private last_session_update: number = Date.now();
    private idle_timeout: NodeJS.Timeout =
        setTimeout(() => {
            this.stateful_controller.clientDisconnect(this.client.user_id, this);
        }, 1000 * 60 * 60 * 3);;

    constructor(soc: Socket, stateful_controller: StatefulController, Iapp_layer: IApiApplication, client: IClient) {
        this.soc = soc;
        this.client = client;

        this.stateful_controller = stateful_controller;
        this.Iapp_layer = Iapp_layer;

        this.setUpListners();
    }

    private setUpListners(): void {

        this.soc.on("message", async (raw_data) => this.stateful_controller.
            errorHandler(this, async () => {
                if (raw_data)
                    await this.handleDate(raw_data)

                clearTimeout(this.idle_timeout);
                this.idle_timeout = setTimeout(() => {
                    this.stateful_controller.clientDisconnect(this.client.user_id, this);
                }, 1000 * 60 * 60 * 3);

                const curr_time = Date.now();

                if (curr_time - this.last_session_update > this.SESSION_EXTEND_TIME) {
                    this.last_session_update = curr_time;

                    this.Iapp_layer.extendSession(this.client.user_id);
                }

            })()
        );

        this.soc.on("disconnect", () => {
            this.stateful_controller.clientDisconnect(this.client.user_id, this);
        })
    }

    private preparePayload(response: IAppLayerResponse<any, any>): IPayloadInterface<any> {
        return {
            success: response.success,
            log_message: response.log_message,
            data: response.data,
        };
    }

    private async handleDate(raw_data: any): Promise<void> {
        const result = action_schema.safeParse(raw_data);

        if (!result.success)
            throw Error("request object miss match");

        const data: IActionRequest = result.data!;
        switch (data.type) {

            case IPayloadRequestType.DELIVER_RECEIVED_MESSAGES: // could use bulk delivary instead....
                {
                    const m_result = await this.Iapp_layer.deliverAllRecievedMessages(this.client);


                    m_result.internal?.map((message) => {

                        this.stateful_controller.broadcastMessage(IPayloadResponseType.ONMESSAGE_RECEIVED, message.room_id, this, this.preparePayload({ success: m_result.success, data: { msg_public_id: message.public_id, room_public_id: message.room_public_id, is_delivered: message.is_delivered }, log_message: m_result.log_message }));

                    });

                }
                break;
            case IPayloadRequestType.LOAD_REQUESTS:
                {
                    const cursor = data.payload.cursor;

                    const result = await this.Iapp_layer.fetchUserRequests(this.client, cursor);
                    this.write(IPayloadResponseType.ONLOAD_REQUESTS, this.preparePayload(result));
                }
                break;
            case IPayloadRequestType.LOAD_ROOMS:
                {
                    const cursor = data.payload.cursor;

                    const result = await this.Iapp_layer.fetchUserRooms(this.client, cursor);

                    result.internal?.map((room_ids) => {
                        this.stateful_controller.setRoomMember(room_ids, this.client.user_id);

                    });

                    this.write(IPayloadResponseType.ONLOAD_ROOMS, this.preparePayload(result)); //async write back..

                }
                break;
            case IPayloadRequestType.LOAD_MESSAGES:
                {
                    const cursor = data.payload.cursor;
                    const room_public_id = data.payload.room_public_id;

                    const result = await this.Iapp_layer.fetchUserMessages(room_public_id, cursor);

                    this.write(IPayloadResponseType.ONLOAD_MESSAGES, this.preparePayload(result));
                }
                break;
            case IPayloadRequestType.SEND_REQUEST:
                {
                    const username = data.payload.username;

                    const result = await this.Iapp_layer.sendContactRequest(username, this.client);

                    this.write(IPayloadResponseType.ONSEND_REQUEST, this.preparePayload({ success: result.success, log_message: result.log_message }));

                    if (result.success)
                        this.stateful_controller.broadcastRequest(IPayloadResponseType.ONRECEIVE_REQUEST, result.internal!.user_id, this, this.preparePayload(result));

                }
                break;
            case IPayloadRequestType.VERDICT_REQUEST:
                {
                    const req_public_id = data.payload.req_public_id;
                    const username = data.payload.username;
                    const verdict = data.payload.verdict;

                    const result = await this.Iapp_layer.acceptContactRequest(username, verdict, this.client);

                    this.write(IPayloadResponseType.ONVERDICT_REQUEST, this.preparePayload({ success: result.success, data: req_public_id, log_message: result.log_message }));

                    if (result.success) {
                        this.stateful_controller.setRoomMember(result.internal!.room.room_id, this.client.user_id); //add this
                        this.stateful_controller.setRoomMember(result.internal!.room.room_id, result.internal!.s_client.user_id); //add other

                        //broadcast room to clients
                        this.write(IPayloadResponseType.ONCREATE_CONTACT, this.preparePayload({ success: result.success, data: result.data!.r_room, log_message: result.log_message }));
                        this.stateful_controller.broadcastRoom(IPayloadResponseType.ONCREATE_CONTACT, result.internal!.s_client.user_id, this, this.preparePayload({ success: result.success, data: result.data!.s_room, log_message: result.log_message }));
                    }
                }
                break;
            case IPayloadRequestType.SEND_MESSAGE:
                {
                    const room_public_id = data.payload.room_public_id;
                    const content = data.payload.msg_content;
                    const iv = data.payload.iv;

                    const result = await this.Iapp_layer.sendMessage(room_public_id, iv, content, this.client);


                    this.write(IPayloadResponseType.ONSEND_MESSAGE, this.preparePayload({
                        success: result.success, data: {
                            enc_message: result.data,
                            iv: iv,
                        }, log_message: result.log_message
                    }));

                    //broadcast to users in the room,
                    this.stateful_controller.broadcastMessage(IPayloadResponseType.ONRECEIVE_MESSAGE, result.internal!.room_id, this, this.preparePayload({
                        success: result.success, data: {
                            enc_message: result.data,
                            iv: iv,
                        }, log_message: result.log_message
                    }));
                }
                break;

            case IPayloadRequestType.MESSAGE_RECEIVED:
                {
                    const msg_public_id = data.payload.msg_public_id;
                    const room_public_id = data.payload.room_public_id;
                    const s_username = data.payload.s_username;
                    const is_delivered = data.payload.is_delivered;

                    const m_result = await this.Iapp_layer.deliverUserMessage(msg_public_id, room_public_id, s_username, is_delivered);

                    if (!m_result.success)
                        return;

                    this.stateful_controller.broadcastMessage(IPayloadResponseType.ONMESSAGE_RECEIVED, m_result.internal!, this, this.preparePayload({ success: m_result.success, data: { msg_public_id: msg_public_id, room_public_id: room_public_id, is_delivered: is_delivered }, log_message: m_result.log_message }));
                }
                break;

            case IPayloadRequestType.DELETE_CONTACT:
                {
                    const room_public_id = data.payload.room_public_id;
                    const username = data.payload.username;

                    const result = await this.Iapp_layer.deleteContact(room_public_id, username);
                    this.write(IPayloadResponseType.ONDELETE_CONTACT, this.preparePayload(result));

                    if (result.success) {
                        this.stateful_controller.removeRoomMember(result.internal!.room_id, this.client.user_id);

                        if (result.internal!.is_active)
                            this.stateful_controller.broadcastMessage(IPayloadResponseType.ONDEACTIVATE_CONTACT, result.internal!.room_id, this, this.preparePayload({ success: result.success, data: { room_public_id: room_public_id }, log_message: result.log_message }));
                    }

                }
                break;

            case IPayloadRequestType.REJOIN_REQUEST:
                {
                    const room_public_id = data.payload.room_public_id;
                    const username = data.payload.username;

                    const result = await this.Iapp_layer.sendRejoinRequest(room_public_id, username, this.client);
                    this.write(IPayloadResponseType.ONREJOIN_REQUEST, this.preparePayload({ success: result.success, log_message: result.log_message }));

                    if (result.success)
                        this.stateful_controller.broadcastRequest(IPayloadResponseType.ONRECEIVE_REJOIN, result.internal!, this, this.preparePayload(result));

                }
                break;

            case IPayloadRequestType.VERDICT_REJOIN:
                {
                    const req_public_id = data.payload.req_public_id;
                    const username = data.payload.username;
                    const request_verdict = data.payload.verdict;

                    const result = await this.Iapp_layer.acceptRejoinRequest(req_public_id, username, this.client.user_id, request_verdict);

                    if (result.success) {
                        this.write(IPayloadResponseType.ONVERDICT_REJOIN, this.preparePayload({ success: result.success, data: { req_public_id: req_public_id, room: result.data! }, log_message: result.log_message }));
                        this.stateful_controller.broadcastRoom(IPayloadResponseType.ONACTIVATE_CONTACT, result.internal!.other_userid, this, this.preparePayload({ success: result.success, data: { room_public_id: result.data!.public_id }, log_message: result.log_message }));

                        this.stateful_controller.setRoomMember(result.internal!.room_id, this.client.user_id);
                    }
                    else {
                        this.write(IPayloadResponseType.ONVERDICT_REJOIN, this.preparePayload({ success: result.success, data: { req_public_id: req_public_id }, log_message: result.log_message }));
                    }
                }
                break;

            default:
                throw Error("invalid client request");
                break;
        }
    }

}