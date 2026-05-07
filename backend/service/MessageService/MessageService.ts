import { v4 } from "uuid";
import { Repository } from "../../componantParams.js";
import { IMessage } from "../../domain/IMessage.js";
import { IServiceLayerResponse } from "../../responseFormat.js";
import { IMessageService } from "./IMessageService.js";
import { IClient } from "../../domain/IClient.js";


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

    //overrides 
    public generatePublicID() : string
    {
        return v4();
    }

    public async performDeleteMessage(msg_public_id: string): Promise<IServiceLayerResponse> {
        const result = await this.repository.Imessage_repo.updateMessageIsDel(msg_public_id);
        return {success : result.success, log_message : result.log_message};
    }

    public async performSendMessage(public_id : string, iv : string, content: string, s_user_id : number, room_id : number): Promise<IServiceLayerResponse<IMessage>> {
        const m_result = await this.repository.Imessage_repo.insertMessageRecord(public_id, iv, content, s_user_id, room_id);

        return {success : true, data : m_result.data, log_message : "message was sent"};
    }

    public async performDeliverReceivedMessages(client: IClient): Promise<IServiceLayerResponse<IMessage []>> {
        const m_result = await this.repository.Imessage_repo.updateAllMessageDelivered(client.user_id);
        return {success : true, data : m_result.data, log_message : m_result.log_message};
    }

    public async performDeliverUserMessage(public_id: string, is_delivered: boolean): Promise<IServiceLayerResponse> {
        const m_result = await this.repository.Imessage_repo.updateMessageDeliverRecord(public_id, is_delivered);
        return {success : true, log_message : "message was delivered"};
    }

    public async performLoadMessages(room_public_id: string, cursor : Date | null): Promise<IServiceLayerResponse<IMessage[]>> 
    {
        const m_result = await this.repository.Imessage_repo.getClientMessages(room_public_id, cursor);
        return {success : true, data : m_result.data, log_message : `fetched 10 messages of room ${room_public_id}`};
    }
}