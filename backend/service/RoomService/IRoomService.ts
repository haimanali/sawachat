import { IRoom } from "../../domain/IRoom.js";
import { IServiceLayerResponse } from "../../responseFormat.js";

export interface IRoomService
{
    performGetRoom(public_id : string) : Promise<IServiceLayerResponse<IRoom>>;
    performCreateRoom(type : string) : Promise<IServiceLayerResponse<IRoom>>;
    performAddMembers(members : number[], room_id : number) : Promise<IServiceLayerResponse>;

    performLoadRooms(user_id : number, offset : number) : Promise<IServiceLayerResponse<IRoom []>>;
}