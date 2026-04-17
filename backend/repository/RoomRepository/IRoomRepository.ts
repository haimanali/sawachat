import { IClient } from "../../domain/IClient.js";
import { IRoom } from "../../domain/IRoom.js";
import { IRepositoryLayerResponse } from "../../responseFormat.js";

export interface IRoomRepository
{
    getRoomByID(room_id : number): Promise<IRepositoryLayerResponse<IRoom>>;
    getRoomMembers(room_id: number): Promise<IRepositoryLayerResponse< IClient []>>;
    deleteRoomRecord(room_id: number): Promise<IRepositoryLayerResponse>;
    checkRoomActive(room_id: number): Promise<IRepositoryLayerResponse>;
    setRoomMemberActivity(is_active : boolean, room_id: number, user_id : number): Promise<IRepositoryLayerResponse>;
    insertChatRoomRecord(room_public_id : string, enc_key : string, type : string) : Promise<IRepositoryLayerResponse<IRoom>>;
    insertRoomMember(user_id : number, room_id : number) : Promise<IRepositoryLayerResponse>;

    getRoomByPublicID(public_id : string) : Promise<IRepositoryLayerResponse<IRoom>>;

    getRoomsByUserID(user_id : number, cursor : Date | null) : Promise<IRepositoryLayerResponse<IRoom []>>;
}