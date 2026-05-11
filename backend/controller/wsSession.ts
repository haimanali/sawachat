import { IClient } from "../domain/IClient.js";
import { Socket } from "socket.io";
import { action_schema, IActionRequest, IPayloadRequestType } from "../requestFormat.js";
import { StatefulController } from "./StatefulController.js";
import { IApiApplication } from "../Application/IApiApplication.js";
import { IAppLayerResponse, IPayloadInterface, IPayloadResponseType } from "../responseFormat.js";
import { ENotificationType } from "../notificationFormat.js";
import { IClientPublic } from "../public/IClientPublic.js";


export class wsSession {
    public async write(type: string, payload: any): Promise<void> {
        //check write Q
        this.writeQ.push({ type, payload });

        const processNext = () => {
            if (this.writeQ.length === 0 || !this.soc.connected) {
                this.is_writting = false;
                return;
            }

            this.is_writting = true;

            const json_package = this.writeQ.shift();

            //console.log(json_package);

            if (json_package) {
                this.soc.emit(json_package.type, json_package.payload);
                setImmediate(() => processNext());
            }
        };

        if (!this.is_writting && this.soc.conn._readyState === "open")
            processNext();
    }

    public readonly client: IClient;
    private is_online: boolean;
    private is_banned: boolean = false;

    private stateful_controller: StatefulController;
    private app_layer: IApiApplication;

    private soc: Socket;
    private writeQ: any[] = [];
    private is_writting: boolean = false;

    private online_idle_timeout: NodeJS.Timeout = setTimeout(() => {
        this.write(IPayloadResponseType.ONUPDATE_USER_ONLINE_STATUS, this.stateful_controller.preparePayload({ success: true, data: { state: "offline" }, log_message: "user state has been changed" }));
        this.stateful_controller.broadcastConnectionState(IPayloadResponseType.ONONLINE_STATUS, this.client.user_id, this, this.stateful_controller.preparePayload({ success: true, data: { username: this.client.username, state: 'offline' }, log_message: "user status change" })); // to contacts...
        this.is_online = false;
    }, 1000 * 60 * 5);

    private readonly SESSION_EXTEND_TIME = 1000 * 60 * 30;
    private last_session_update: number = Date.now();
    private session_idle_timeout: NodeJS.Timeout =
        setTimeout(() => {
            this.write(IPayloadResponseType.ONUPDATE_USER_ONLINE_STATUS, this.stateful_controller.preparePayload({ success: true, data: { state: "offline" }, log_message: "user state has been changed" }));
            this.stateful_controller.broadcastConnectionState(IPayloadResponseType.ONONLINE_STATUS, this.client.user_id, this, this.stateful_controller.preparePayload({ success: true, data: { username: this.client.username, state: 'offline' }, log_message: "user status change" })); // to contacts...
            this.stateful_controller.clientDisconnect(this.client.user_id, this);
        }, 1000 * 60 * 60 * 3);


    private graceful_disconnection : NodeJS.Timeout | null = null;

    private cancelPendingDisconnection = () : boolean => {
        if (this.graceful_disconnection)
        {
            clearTimeout(this.graceful_disconnection);
            this.graceful_disconnection = null;
            return true;
        }
        return false
    };

    constructor(soc: Socket, stateful_controller: StatefulController, Iapp_layer: IApiApplication, client: IClient) {
        this.soc = soc;
        this.client = client;
        this.is_online = false;

        this.stateful_controller = stateful_controller;
        this.app_layer = Iapp_layer;

        this.setUpListners();
    }

    private setUpListners(): void {

        this.soc.on(IPayloadRequestType.EXTEND_SESSION, async () => this.stateful_controller.errorHandler(this, async () => {

            clearTimeout(this.session_idle_timeout);
            this.session_idle_timeout = setTimeout(() => {
                this.write(IPayloadResponseType.ONUPDATE_USER_ONLINE_STATUS, this.stateful_controller.preparePayload({ success: true, data: { state: "offline" }, log_message: "user state has been changed" }));
                this.stateful_controller.broadcastConnectionState(IPayloadResponseType.ONONLINE_STATUS, this.client.user_id, this, this.stateful_controller.preparePayload({ success: true, data: { username: this.client.username, state: 'offline' }, log_message: "user status change" })); // to contacts...
                this.stateful_controller.clientDisconnect(this.client.user_id, this);
            }, 1000 * 60 * 60 * 3);

            const curr_time = Date.now();

            if (curr_time - this.last_session_update > this.SESSION_EXTEND_TIME) {
                this.last_session_update = curr_time;

                this.app_layer.extendSession(this.client.user_id);
            }

        })());

        this.soc.on(IPayloadRequestType.ONLINE_STATUS, async () => this.stateful_controller.errorHandler(this, async () => {

            const is_connecting = this.cancelPendingDisconnection();
            
            clearTimeout(this.online_idle_timeout);
            this.online_idle_timeout = setTimeout(() => {
                this.write(IPayloadResponseType.ONUPDATE_USER_ONLINE_STATUS, this.stateful_controller.preparePayload({ success: true, data: { state: "offline" }, log_message: "user state has been changed" }));
                this.stateful_controller.broadcastConnectionState(IPayloadResponseType.ONONLINE_STATUS, this.client.user_id, this, this.stateful_controller.preparePayload({ success: true, data: { username: this.client.username, state: 'offline' }, log_message: "user status change" })); // to contacts...
                this.is_online = false;
            }, 1000 * 60 * 5);

            if (!this.is_online && !is_connecting) {
                this.is_online = true;
                this.write(IPayloadResponseType.ONUPDATE_USER_ONLINE_STATUS, this.stateful_controller.preparePayload({ success: true, data: { state: "online" }, log_message: "user state has been changed" }));
                this.stateful_controller.broadcastConnectionState(IPayloadResponseType.ONONLINE_STATUS, this.client.user_id, this, this.stateful_controller.preparePayload({ success: true, data: { username: this.client.username, state: 'online' }, log_message: "user status change" })); // to contacts... //on
            }
        })());

        this.soc.on("message", async (raw_data) => this.stateful_controller.
            errorHandler(this, async () => {
                if (!this.is_banned && raw_data)
                    await this.handleData(raw_data)
                else
                    this.stateful_controller.clientDisconnect(this.client.user_id, this);
            })()
        );

        this.soc.on("disconnect", () => {
            clearTimeout(this.online_idle_timeout);
            clearTimeout(this.session_idle_timeout);

            this.graceful_disconnection = setTimeout( () => {
                this.is_online = false;

                this.stateful_controller.broadcastConnectionState(IPayloadResponseType.ONONLINE_STATUS, this.client.user_id, this, this.stateful_controller.preparePayload({ success: true, data: { username: this.client.username, state: 'offline' }, log_message: "user status change" })); // to contacts... //off
                this.write(IPayloadResponseType.ONUPDATE_USER_ONLINE_STATUS, this.stateful_controller.preparePayload({ success: true, data: { state: "offline" }, log_message: "user state has been changed" }));
                this.stateful_controller.clientDisconnect(this.client.user_id, this);

            }, 1000 * 10);

        })
    }



    private async handleData(raw_data: any): Promise<void> {
        const result = action_schema.safeParse(raw_data);

        if (!result.success)
            return this.write("error", "validation mismatch, request object has been altered");

        const data: IActionRequest = result.data!;
        switch (data.type) {

            case IPayloadRequestType.DELIVER_RECEIVED_MESSAGES: // could use bulk delivary instead....
                {
                    const m_result = await this.app_layer.deliverAllRecievedMessages(this.client);


                    m_result.internal?.map((message) => {

                        this.stateful_controller.broadcastMessage(IPayloadResponseType.ONMESSAGE_RECEIVED, message.room_id, this, this.stateful_controller.preparePayload({ success: m_result.success, data: { msg_public_id: message.public_id, room_public_id: message.room_public_id, is_delivered: message.is_delivered }, log_message: m_result.log_message }));

                    });

                }
                break;

            case IPayloadRequestType.LOAD_CONTACTS:
                {
                    const get_contacts = await this.app_layer.fetchUserContacts(this.client.user_id);

                    if (!this.stateful_controller.client_contact.has(this.client.user_id)) {
                        get_contacts.internal?.forEach((contactID) =>
                            this.stateful_controller.setClientContact(this.client.user_id, contactID)
                        );

                        this.stateful_controller.broadcastConnectionState(IPayloadResponseType.ONONLINE_STATUS, this.client.user_id, this, this.stateful_controller.preparePayload({ success: true, data: { username: this.client.username, state: 'online' }, log_message: "user status change" })); // to contacts...
                    }

                    const contactStatePayload = get_contacts.data?.map((contact, i) => {
                        const isActive = this.stateful_controller.active_clients.has(get_contacts.internal![i]);

                        return {
                            client: contact,
                            onlineState: isActive ? "online" : "offline"
                        };
                    }) || [];

                    this.write(
                        IPayloadResponseType.ONLOAD_CONTACTS,
                        this.stateful_controller.preparePayload({ ...get_contacts, data: contactStatePayload })
                    );
                }
                break;

            case IPayloadRequestType.LOAD_NOTIFICATIONS:
                {
                    const n_result = await this.app_layer.fetchUserNotifications(this.client);

                    this.write(IPayloadResponseType.ONLOAD_NOTIFICATIONS, this.stateful_controller.preparePayload(n_result));
                }
                break;

            case IPayloadRequestType.MARK_NOTIF_READ:
                {
                    const notif_public_id = data.payload.notif_public_id;
                    const n_result = await this.app_layer.markNotifocationRead(notif_public_id);

                    //might use an acknowlagement later..
                }
                break;

            case IPayloadRequestType.BULK_NOTIF_READ:
                {
                    const type = data.payload.type;
                    const n_result = await this.app_layer.readNotifications(type);

                    //might broadcast ack later...
                }
                break;
            case IPayloadRequestType.LOAD_REQUESTS:
                {
                    const result = await this.app_layer.fetchUserRequests(this.client);
                    this.write(IPayloadResponseType.ONLOAD_REQUESTS, this.stateful_controller.preparePayload(result));
                }
                break;
            case IPayloadRequestType.LOAD_ROOMS:
                {


                    const cursor = data.payload.cursor;

                    const result = await this.app_layer.fetchUserRooms(this.client, cursor);

                    if (!this.stateful_controller.client_room.has(this.client.user_id)) {
                        result.internal?.map((room_ids) => {
                            this.stateful_controller.setRoomMember(room_ids, this.client.user_id);

                        });
                    }


                    this.write(IPayloadResponseType.ONLOAD_ROOMS, this.stateful_controller.preparePayload(result)); //async write back..

                }
                break;
            case IPayloadRequestType.LOAD_MESSAGES:
                {
                    const cursor = data.payload.cursor;
                    const room_public_id = data.payload.room_public_id;

                    const result = await this.app_layer.fetchUserMessages(room_public_id, cursor);

                    this.write(IPayloadResponseType.ONLOAD_MESSAGES, this.stateful_controller.preparePayload(result));
                }
                break;
            case IPayloadRequestType.SEND_REQUEST:
                {
                    const username = data.payload.username;

                    const result = await this.app_layer.sendContactRequest(username, this.client);
                    this.write(IPayloadResponseType.ONSEND_REQUEST, this.stateful_controller.preparePayload({ success: result.success, log_message: result.log_message }));

                    if (result.success) {

                        this.stateful_controller.broadcastRequest(IPayloadResponseType.ONRECEIVE_REQUEST, result.internal!.user_id, this, this.stateful_controller.preparePayload(result));

                        const notificaiton = await this.app_layer.pushNotification(result.internal!.user_id, ENotificationType.RECEIVE_REQUEST, { type: ENotificationType.RECEIVE_REQUEST, request: result.data! });
                        if (notificaiton.success)
                            this.stateful_controller.broadcastNotificationToUser(IPayloadResponseType.ONTRIGGER_NOTIFICATION, result.internal!.user_id, this, this.stateful_controller.preparePayload(notificaiton));
                    }

                }
                break;
            case IPayloadRequestType.VERDICT_REQUEST:
                {
                    const req_public_id = data.payload.req_public_id;
                    const username = data.payload.username;
                    const verdict = data.payload.verdict;

                    const result = await this.app_layer.acceptContactRequest(username, verdict, this.client);
                    this.write(IPayloadResponseType.ONVERDICT_REQUEST, this.stateful_controller.preparePayload({ success: result.success, data: req_public_id, log_message: result.log_message }));

                    if (result.success) {

                        this.stateful_controller.setClientContact(this.client.user_id, result.internal!.s_client.user_id);
                        this.stateful_controller.setClientContact(result.internal!.s_client.user_id, this.client.user_id);

                        this.stateful_controller.setRoomMember(result.internal!.room.room_id, this.client.user_id);
                        this.stateful_controller.setRoomMember(result.internal!.room.room_id, result.internal!.s_client.user_id);


                        const s_client_online = this.stateful_controller.active_clients.has(result.internal!.s_client.user_id) &&
                            this.stateful_controller.active_clients.get(result.internal!.s_client.user_id)!.size > 0;

                        const toPublic = (client: IClient): IClientPublic => {
                            return {
                                username: client.username,
                                nickname: client.nickname,
                                avatar : client.avatar,
                            };
                        };

                        //broadcast room to clients
                        this.write(IPayloadResponseType.ONCREATE_CONTACT, this.stateful_controller.preparePayload({ success: result.success, data: { room: result.data!.r_room, contact: toPublic(result.internal!.s_client), onlineState: s_client_online ? "online" : "offline" }, log_message: result.log_message }));
                        this.stateful_controller.broadcastRoom(IPayloadResponseType.ONCREATE_CONTACT, result.internal!.s_client.user_id, this, this.stateful_controller.preparePayload({ success: result.success, data: { room: result.data!.s_room, contact: toPublic(this.client), onlineState: this.is_online ? "online" : "offline" }, log_message: result.log_message }));

                        const notificaiton = await this.app_layer.pushNotification(result.internal!.s_client.user_id, ENotificationType.CREATE_CONTACT, { type: ENotificationType.CREATE_CONTACT, room: result.data!.s_room });
                        if (notificaiton.success)
                            this.stateful_controller.broadcastNotificationToUser(IPayloadResponseType.ONTRIGGER_NOTIFICATION, result.internal!.s_client.user_id, this, this.stateful_controller.preparePayload(notificaiton));
                    }
                }
                break;
            case IPayloadRequestType.SEND_MESSAGE:
                {
                    // this handles when a user sends a message in a room
                    const room_public_id = data.payload.room_public_id;
                    const content = data.payload.msg_content;
                    const iv = data.payload.iv;

                    const result = await this.app_layer.sendMessage(room_public_id, iv, content, this.client);
                    if (!result.success)
                        return;

                    // we broadcast the message to everyone in the room immediately
                    // this makes the app feel fast (optimistic delivery)
                    this.stateful_controller.broadcastMessage(IPayloadResponseType.ONRECEIVE_MESSAGE, result.internal!.room_id, this, this.stateful_controller.preparePayload({
                        success: result.success, data: {
                            enc_message: result.data,
                            iv: iv,
                        }, log_message: result.log_message
                    }));

                    // we also send the message back to the sender so they can see it in their chat
                    this.write(IPayloadResponseType.ONRECEIVE_MESSAGE, this.stateful_controller.preparePayload({
                        success: result.success, data: {
                            enc_message: result.data,
                            iv: iv,
                        }, log_message: result.log_message
                    }));


                    // then we call the ai service in the background to check if the message is toxic
                    // if the ai says it is toxic, we delete the message from the chat for everyone
                    this.app_layer.validateMessage(content, iv, result.internal!.enc_key, this.client.user_id, async (total_strike?: number) => {

                        // remove the bad message from the database
                        await this.app_layer.deleteMessage(result.data!.public_id);
                        await this.app_layer.deleteChatRoomLastMessage(result.internal!.room_id, result.data!.public_id);

                        // notify the sender about the strike they got
                        this.write(IPayloadResponseType.ONDELETE_MESSAGE, this.stateful_controller.preparePayload({ success: true, data: { msg_public_id: result.data!.public_id, room_public_id: result.data!.room_public_id, total_strike: total_strike || 0 }, log_message: "message has been deleted by ai moderation" }));
                        // notify everyone else to remove the message from their screen
                        this.stateful_controller.broadcastMessage(IPayloadResponseType.ONDELETE_MESSAGE, result.internal!.room_id, this, this.stateful_controller.preparePayload({ success: true, data: { msg_public_id: result.data!.public_id, room_public_id: result.data!.room_public_id }, log_message: "message has been deleted by ai moderation" }));

                        // if they reached 3 strikes, we ban them right now
                        if (total_strike && total_strike >= IPayloadResponseType.MAX_STRIKE) {
                            this.is_banned = true;
                            this.write(IPayloadResponseType.ONBAN, this.stateful_controller.preparePayload({ success: true, log_message: "you have been permanently banned for toxic behaviour" }));
                        }
                    });
                }
                break;

            case IPayloadRequestType.UPDATE_LAST_READ:
                {
                    const room_public_id = data.payload.room_public_id;
                    const read_receipts = data.payload.read_receipts;
                    const r_result = await this.app_layer.updateLastReadMessage(this.client.user_id, room_public_id, read_receipts);

                    if (r_result.success && read_receipts) {
                        this.stateful_controller.broadcastMessage(
                            IPayloadResponseType.ONMESSAGE_READ,
                            r_result.internal!,
                            this,
                            this.stateful_controller.preparePayload({
                                success: true,
                                data: { room_public_id: room_public_id },
                                log_message: "messages read"
                            })
                        );
                    }
                }
                break;

            case IPayloadRequestType.UPDATE_NICKNAME:
                {
                    const new_nickname = data.payload.nickname;
                    const r_result = await this.app_layer.updateNickname(this.client.user_id, new_nickname);
                    if (r_result.success) {
                        this.client.nickname = new_nickname;
                        const payload = this.stateful_controller.preparePayload({
                            success: true,
                            data: { username: this.client.username, nickname: new_nickname },
                            log_message: "Nickname updated"
                        });
                        this.write(IPayloadResponseType.ONUPDATE_NICKNAME, payload);
                        this.stateful_controller.broadcastConnectionState(IPayloadResponseType.ONUPDATE_NICKNAME, this.client.user_id, this, payload);
                    }
                }
                break;

            case IPayloadRequestType.UPDATE_AVATAR:
                {
                    const new_avatar = data.payload.avatar;
                    const r_result = await this.app_layer.updateAvatar(this.client.user_id, new_avatar);
                    if (r_result.success) {
                        this.client.avatar = new_avatar;
                        const payload = this.stateful_controller.preparePayload({
                            success: true,
                            data: { username: this.client.username, avatar: new_avatar },
                            log_message: "Avatar updated"
                        });
                        this.write(IPayloadResponseType.ONUPDATE_AVATAR, payload);
                        this.stateful_controller.broadcastConnectionState(IPayloadResponseType.ONUPDATE_AVATAR, this.client.user_id, this, payload);
                    }
                }
                break;

            case IPayloadRequestType.MESSAGE_RECEIVED:
                {
                    const msg_public_id = data.payload.msg_public_id;
                    const room_public_id = data.payload.room_public_id;
                    const s_username = data.payload.s_username;
                    const is_delivered = data.payload.is_delivered;

                    const m_result = await this.app_layer.deliverUserMessage(msg_public_id, room_public_id, s_username, is_delivered);

                    if (!m_result.success)
                        return;

                    this.stateful_controller.broadcastMessage(IPayloadResponseType.ONMESSAGE_RECEIVED, m_result.internal!, this, this.stateful_controller.preparePayload({ success: m_result.success, data: { msg_public_id: msg_public_id, room_public_id: room_public_id, is_delivered: is_delivered }, log_message: m_result.log_message }));
                }
                break;

            case IPayloadRequestType.DELETE_CONTACT:
                {
                    const room_public_id = data.payload.room_public_id;
                    const username = data.payload.username;

                    const result = await this.app_layer.deleteContact(room_public_id, username);
                    this.write(IPayloadResponseType.ONDELETE_CONTACT, this.stateful_controller.preparePayload(result));

                    if (result.success) {
                        this.stateful_controller.removeRoomMember(result.internal!.room_id, this.client.user_id);

                        if (result.internal!.is_active)
                            this.stateful_controller.broadcastMessage(IPayloadResponseType.ONDEACTIVATE_CONTACT, result.internal!.room_id, this, this.stateful_controller.preparePayload({ success: result.success, data: { room_public_id: room_public_id }, log_message: result.log_message }));
                        else {
                            this.stateful_controller.removeClientContact(this.client.user_id, result.internal!.other_userID);
                            this.stateful_controller.removeClientContact(result.internal!.other_userID, this.client.user_id);

                            this.stateful_controller.broadcastMessage(IPayloadResponseType.ONREMOVE_CONTACT, result.internal!.room_id, this, this.stateful_controller.preparePayload(result));
                            this.write(IPayloadResponseType.ONREMOVE_CONTACT, this.stateful_controller.preparePayload(result)); //change broadcast to messagelaster...
                        }
                    }

                }
                break;

            case IPayloadRequestType.REJOIN_REQUEST:
                {
                    const room_public_id = data.payload.room_public_id;
                    const username = data.payload.username;

                    const result = await this.app_layer.sendRejoinRequest(room_public_id, username, this.client);
                    this.write(IPayloadResponseType.ONREJOIN_REQUEST, this.stateful_controller.preparePayload({ success: result.success, log_message: result.log_message }));

                    if (result.success) {
                        this.stateful_controller.broadcastRequest(IPayloadResponseType.ONRECEIVE_REJOIN, result.internal!, this, this.stateful_controller.preparePayload(result));

                        const notificaiton = await this.app_layer.pushNotification(result.internal!, ENotificationType.RECEIVE_REQUEST, { type: ENotificationType.RECEIVE_REQUEST, request: result.data! });
                        if (notificaiton.success)
                            this.stateful_controller.broadcastNotificationToUser(IPayloadResponseType.ONTRIGGER_NOTIFICATION, result.internal!, this, this.stateful_controller.preparePayload(notificaiton));
                    }

                }
                break;

            case IPayloadRequestType.VERDICT_REJOIN:
                {
                    const req_public_id = data.payload.req_public_id;
                    const username = data.payload.username;
                    const request_verdict = data.payload.verdict;

                    const result = await this.app_layer.acceptRejoinRequest(req_public_id, username, this.client.user_id, request_verdict);

                    if (result.success) {
                        this.write(IPayloadResponseType.ONVERDICT_REJOIN, this.stateful_controller.preparePayload({ success: result.success, data: { req_public_id: req_public_id, room: result.data! }, log_message: result.log_message }));
                        this.stateful_controller.broadcastRoom(IPayloadResponseType.ONACTIVATE_CONTACT, result.internal!.other_userid, this, this.stateful_controller.preparePayload({ success: result.success, data: { room_public_id: result.data!.public_id }, log_message: result.log_message }));

                        this.stateful_controller.setRoomMember(result.internal!.room_id, this.client.user_id);
                    }
                    else {
                        this.write(IPayloadResponseType.ONVERDICT_REJOIN, this.stateful_controller.preparePayload({ success: result.success, data: { req_public_id: req_public_id }, log_message: result.log_message }));
                    }
                }
                break;

            default:
                throw Error("invalid client request");
                break;
        }
    }

}