import { off } from "process";
import { Repository } from "../../componantParams.js";
import { IMessage } from "../../domain/IMessage.js";
import { IServiceLayerResponse } from "../../responseFormat.js";
import { IMessageService } from "./IMessageService.js";


export class MessageService implements IMessageService
{
    public static getInstance(repository : Repository) : MessageService
    {
        if (!MessageService.instance)
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
    public async performSendMessage(content: string, s_user_id : number, room_id : number): Promise<IServiceLayerResponse<IMessage>> {
        const m_result = await this.repository.Imessage_repo.insertMessageRecord(content, s_user_id, room_id);
        return {success : true, data : m_result.data, log_message : "message was sent"};
    }

    public async performLoadMessages(room_public_id: string, cursor : Date | null): Promise<IServiceLayerResponse<IMessage[]>> 
    {
        const m_result = await this.repository.Imessage_repo.getUserMessages(room_public_id, cursor);
        return {success : true, data : m_result.data, log_message : `fetched 10 messages of room ${room_public_id}`};
    }
}