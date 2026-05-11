import { v4 } from "uuid";
import { Repository } from "../../componantParams.js";
import { IMessage } from "../../domain/IMessage.js";
import { IPayloadResponseType, IServiceLayerResponse } from "../../responseFormat.js";
import { IMessageService } from "./IMessageService.js";
import { IClient } from "../../domain/IClient.js";
import { IMessagePublic } from "../../public/IMessagePublic.js";


// this service handles everything related to sending and receiving messages
export class MessageService implements IMessageService
{
    public static getInstance(repository : Repository) : MessageService
    {
        if (MessageService.instance)
            return MessageService.instance;

        MessageService.instance = new MessageService(repository);
        return MessageService.instance;
    }


    private static instance : MessageService;
    private repository : Repository;
    private constructor (repository : Repository)
    {
        this.repository = repository;
    }

    // every message gets a unique uuid
    public generatePublicID() : string
    {
        return v4();
    }

    // this function deletes a message by marking it as deleted in the database
    public async performDeleteMessage(msg_public_id: string): Promise<IServiceLayerResponse> {
        const result = await this.repository.Imessage_repo.updateMessageIsDel(msg_public_id);
        
        // If message was successfully marked as deleted, update the room preview if this was the last message
        if (result.success && result.data) {
            const message = result.data;
            const room_result = await this.repository.Iroom_repo.getRoomByID(message.room_id);
            
            if (room_result.success && room_result.data?.last_message_payload) {
                try {
                    const payload = room_result.data.last_message_payload;
                    const last_msg = typeof payload === 'string' 
                        ? JSON.parse(payload) as IMessagePublic 
                        : payload as IMessagePublic;
                    
                    // If the message being deleted is the one currently shown in the room preview
                    if (last_msg && last_msg.public_id === msg_public_id) {
                        last_msg.is_del = true;
                        last_msg.content = IPayloadResponseType.MESSAGE_DELETED as string; 
                        await this.repository.Iroom_repo.updateChatRoomPreview(last_msg, message.room_id);
                    }
                } catch (e) {
                    console.error("Failed to parse last_message_payload:", e);
                }
            }
        }

        return {success : result.success, log_message : result.log_message};
    }

    // this saves a new message in the database
    public async performSendMessage(public_id : string, iv : string, content: string, s_user_id : number, room_id : number): Promise<IServiceLayerResponse<IMessage>> {
        const m_result = await this.repository.Imessage_repo.insertMessageRecord(public_id, iv, content, s_user_id, room_id);

        return {success : true, data : m_result.data, log_message : "message was sent"};
    }

    // this marks all pending messages as delivered when the user goes online
    public async performDeliverReceivedMessages(client: IClient): Promise<IServiceLayerResponse<IMessage []>> {
        const m_result = await this.repository.Imessage_repo.updateAllMessageDelivered(client.user_id);
        return {success : true, data : m_result.data, log_message : m_result.log_message};
    }

    // this updates when a user has read all messages in a specific room
    public async performUpdateMessagesReadInRoom(user_id: number, room_id: number): Promise<IServiceLayerResponse> {
        const r_result = await this.repository.Imessage_repo.updateMessagesReadInRoom(user_id, room_id);
        return { success : true, log_message : r_result.log_message };
    }

    // this marks a single message as delivered once the receiver gets it
    public async performDeliverUserMessage(public_id: string, is_delivered: boolean): Promise<IServiceLayerResponse> {
        const m_result = await this.repository.Imessage_repo.updateMessageDeliverRecord(public_id, is_delivered);
        return {success : true, log_message : "message was delivered"};
    }

    // this gets the chat history for a room, usually 10 messages at a time
    public async performLoadMessages(room_public_id: string, cursor : Date | null): Promise<IServiceLayerResponse<IMessage[]>> 
    {
        const m_result = await this.repository.Imessage_repo.getClientMessages(room_public_id, cursor);
        return {success : true, data : m_result.data, log_message : `fetched 10 messages of room ${room_public_id}`};
    }
}