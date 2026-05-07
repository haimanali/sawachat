import { IClient } from "../../domain/IClient.js";
import { IMessage } from "../../domain/IMessage.js";
import { IServiceLayerResponse } from "../../responseFormat.js";

export interface IMessageService
{
    performDeliverReceivedMessages(data: IClient): Promise<IServiceLayerResponse<IMessage []>>;
    performDeliverUserMessage(public_id: string, is_delivered: boolean): Promise<IServiceLayerResponse>;
    generatePublicID() : string;
    performSendMessage(public_id : string, iv : string, message: string, s_user_id : number, room_id : number) : Promise<IServiceLayerResponse<IMessage>>;
    performLoadMessages(room_public_id : string, cursor : Date | null) : Promise<IServiceLayerResponse<IMessage []>>;
    performDeleteMessage(msg_public_id : string) : Promise<IServiceLayerResponse>;
}