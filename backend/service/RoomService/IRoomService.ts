import { IClient } from "../../domain/IClient.js";
import { IRoom } from "../../domain/IRoom.js";
import { IServiceLayerResponse } from "../../responseFormat.js";

export interface IRoomService
{
    performActivateContact(user_id: number, room_id: number): Promise<IServiceLayerResponse>;
    performLeaveContact(room_id: number, user_id : number): Promise<IServiceLayerResponse<IClient []>>;
    generateRoomkey() : string;
    generatePublicID() : string;
    performGetRoom(public_id : string) : Promise<IServiceLayerResponse<IRoom>>;
    performCreateRoom(public_id : string, enc_key : string, type : string) : Promise<IServiceLayerResponse<IRoom>>;
    performAddMembers(members : number[], room_id : number) : Promise<IServiceLayerResponse>;

    performLoadRooms(user_id : number, cursor : Date | null) : Promise<IServiceLayerResponse<IRoom []>>;
}