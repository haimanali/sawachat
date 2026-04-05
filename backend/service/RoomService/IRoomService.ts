import { IRoom } from "../../domain/IRoom.js";
import { IServiceLayerResponse } from "../../responseFormat.js";

export interface IRoomService
{
    generateRoomkey() : string;
    generatePublicID() : string;
    performGetRoom(public_id : string) : Promise<IServiceLayerResponse<IRoom>>;
    performCreateRoom(public_id : string, enc_key : string, type : string) : Promise<IServiceLayerResponse<IRoom>>;
    performAddMembers(members : number[], room_id : number) : Promise<IServiceLayerResponse>;

    performLoadRooms(user_id : number, cursor : Date | null) : Promise<IServiceLayerResponse<IRoom []>>;
}