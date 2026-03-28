import { IRoom } from "../../domain/IRoom.js";
import { IRepositoryLayerResponse } from "../../responseFormat.js";

export interface IRoomRepository
{
    insertChatRoomRecord(room_public_id : string ,type : string) : Promise<IRepositoryLayerResponse<IRoom>>;
    insertRoomMember(user_id : number, room_id : number) : Promise<IRepositoryLayerResponse>;

    getRoomByPublicID(public_id : string) : Promise<IRepositoryLayerResponse<IRoom>>;

    getRoomsByUserID(user_id : number, offset : number) : Promise<IRepositoryLayerResponse<IRoom []>>;
}