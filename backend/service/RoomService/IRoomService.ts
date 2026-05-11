import { IClient } from "../../domain/IClient.js";
import { IRoom } from "../../domain/IRoom.js";
import { IMessagePublic } from "../../public/IMessagePublic.js";
import { IRoomPublic } from "../../public/IRoomPublic.js";
import { IServiceLayerResponse } from "../../responseFormat.js";

// this defines the functions for handling chat rooms and private messages
export interface IRoomService
{
    performDeleteLastMessage(room_id: number, public_id: string): Promise<IServiceLayerResponse>;
    performUpdateLastMessage(message: IMessagePublic, room_id : number): Promise<IServiceLayerResponse>;
    performUpdateLastRead(user_id: number, room_id: number): Promise<IServiceLayerResponse>;
    performActivateContact(user_id: number, room_id: number): Promise<IServiceLayerResponse>;
    performLeaveContact(room_id: number, user_id : number): Promise<IServiceLayerResponse<IClient []>>;
    generateRoomkey() : string;
    generatePublicID() : string;
    performGetRoom(public_id : string) : Promise<IServiceLayerResponse<IRoom>>;
    performCreateRoom(public_id : string, enc_key : string, type : string) : Promise<IServiceLayerResponse<IRoom>>;
    performAddMembers(members : number[], room_id : number) : Promise<IServiceLayerResponse>;

    performLoadRooms(user_id : number, cursor : Date | null) : Promise<IServiceLayerResponse<{total_unread : number, rooms : IRoom[]}>>;
}