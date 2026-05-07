import { Repository } from "../../componantParams.js";
import { IRoomService } from "./IRoomService.js";
import { v4 } from 'uuid';
import { IServiceLayerResponse } from "../../responseFormat.js";
import { IRoom } from "../../domain/IRoom.js";
import crypto from "crypto";
import { IClient } from "../../domain/IClient.js";
import { IMessagePublic } from "../../public/IMessagePublic.js";


export class RoomService implements IRoomService
{

    public static getInstance(repository : Repository) : RoomService
    {
        if (RoomService.instance)
            return RoomService.instance;

        RoomService.instance = new RoomService(repository);
        return RoomService.instance;
    }


    private static instance : RoomService;

    private repository : Repository;
    private constructor(repository : Repository)
    {
        this.repository = repository;
    }

    //overrides

    public generateRoomkey() : string
    {
        return crypto.randomBytes(32).toString("hex");
    }

    public generatePublicID() : string
    {
        const uuid = v4();
        return uuid;
    }

    public async performAddMembers(members : number[], room_id : number) : Promise<IServiceLayerResponse>
    {
        await Promise.all(members.map((member) => 
            this.repository.Iroom_repo.insertRoomMember(member, room_id)
        ));

        return {success : true, log_message : "members have been added successfully.."};
    }

    public async performCreateRoom(public_id : string, enc_key : string, type : string): Promise<IServiceLayerResponse<IRoom>> {
        const r_result = await this.repository.Iroom_repo.insertChatRoomRecord(public_id, enc_key, type);
        return { success : true, data : r_result.data, log_message : "New Room has been created"};
    }

    public async performGetRoom(public_id: string): Promise<IServiceLayerResponse<IRoom>> 
    {
        const r_result = await this.repository.Iroom_repo.getRoomByPublicID(public_id);   

        if (!r_result.success)
            return {success : false, log_message : "failed to fetch room"};

        return { success : true, data : r_result.data, log_message : "got room by public_id"};
    }

    public async performLoadRooms(user_id: number, cursor : Date | null): Promise<IServiceLayerResponse<{total_unread : number, rooms : IRoom[]}>> 
    {
        const r_result = await this.repository.Iroom_repo.getRoomsByUserID(user_id, cursor);
        const m_result = await this.repository.Imessage_repo.getTotalUnread(user_id);
        
        return {
            success : r_result.success,
            data : {total_unread : m_result.data! , rooms : r_result.data!},
            log_message : "fetched 10 user rooms",
        };
    }

    public async performUpdateLastMessage(message: IMessagePublic, room_id : number): Promise<IServiceLayerResponse> {
        const result = await this.repository.Iroom_repo.updateChatRoomPreview(message, room_id);
        return { success : true, log_message : result.log_message};
    }

    public async performUpdateLastRead(user_id: number, room_id: number): Promise<IServiceLayerResponse> {
        const result = await this.repository.Iroom_repo.updateRoomMemberLastRead(user_id, room_id);
        return {success : result.success, log_message : result.log_message};            
    }

    public async performLeaveContact(room_id: number, user_id : number): Promise<IServiceLayerResponse<IClient []>> {
        
        const remove_result = await this.repository.Iroom_repo.setRoomMemberActivity(false, room_id, user_id);
        const check_result = await this.repository.Iroom_repo.checkRoomActive(room_id);
        const member_result = await this.repository.Iroom_repo.getRoomMembers(room_id);

        if (!check_result.success)
        {
            const detete = await this.repository.Iroom_repo.deleteRoomRecord(room_id);

            return {
                success : check_result.success,
                data : member_result.data,
                log_message : detete.log_message,
            };
        }

        return {
            success : remove_result.success,
            log_message : remove_result.log_message,
        };
    }

    public async performActivateContact(user_id: number, room_id: number): Promise<IServiceLayerResponse> {
        const r_result = await this.repository.Iroom_repo.setRoomMemberActivity(true, room_id, user_id);
        return {success : r_result.success, log_message : r_result.log_message};
    }
}