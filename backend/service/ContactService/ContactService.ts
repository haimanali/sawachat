import { Repository } from "../../componantParams.js";
import { IRequest } from "../../domain/IRequest.js";
import { IRoom } from "../../domain/IRoom.js";
import { IServiceLayerResponse } from "../../responseFormat.js";
import { IContactService } from "./IContactService.js";
import { v4 } from "uuid";


export class ContactService implements IContactService
{
    public static getInstance(repository : Repository) : ContactService
    {
        if(ContactService.instance)
            return ContactService.instance;

        ContactService.instance = new ContactService(repository);
        return ContactService.instance;
    }

    private static instance : ContactService;
    private repository : Repository;

    private constructor(repository : Repository)
    {
        this.repository = repository;
    }


    //overrides

    public generatePublicID() : string
    {
        return v4();
    }

    public async performSendRequest(public_id : string, r_user_id: number, s_user_id : number): Promise<IServiceLayerResponse<IRequest>> 
    {
        const is_pending = await this.repository.Icontact_repo.isRequestPending(r_user_id, s_user_id, "contact");

        if (is_pending.data)
            return {
                success : false,
                log_message : "Request has already been sent",
            };
            
        const c_result = await this.repository.Icontact_repo.insertContactRequest(public_id, r_user_id, s_user_id);
        
        return {
            success : c_result.success, 
            data : c_result.data,
            log_message : "request was sent",
        };
    }

    public async performVerdictRequest(verdict : boolean, s_user_id: number, r_user_id: number): Promise<IServiceLayerResponse> 
    {
        let status : string;

        if (verdict)
            status = "accepted";
        else
            status = "rejected";

        await this.repository.Icontact_repo.updateContactRequest(status, r_user_id, s_user_id);
        return {success : verdict, log_message : `contact request has been ${status}`};
    }

    public async performAddContact(s_user_id: number, r_user_id : number): Promise<IServiceLayerResponse> {
        await this.repository.Icontact_repo.insertContactRecord(r_user_id, s_user_id);
        return {success : true, log_message : "new contact has been added.."};
    }

    public async performLoadRequests(user_id: number, cursor : Date | null): Promise<IServiceLayerResponse<IRequest []>> {
        const c_result = await this.repository.Icontact_repo.getRequestsByUserID(user_id, cursor);

        return {success : true, data : c_result.data, log_message : "fetched requests by user id"};
    }


    public async performRemoveContact(user1: number, user2: number): Promise<IServiceLayerResponse> {
        const result = await this.repository.Icontact_repo.removeContact(user1, user2);

        return {success : result.success, log_message : result.log_message};
    }

    public async performRemoveRequest(user1: number, user2: number, type : string): Promise<IServiceLayerResponse> {
        const result = await this.repository.Icontact_repo.removeRequest(user1, user2, type);
        
        return {success : result.success, log_message : result.log_message};
    }

    public async performSendRejoin(public_id : string, room_id: number, user_id: number): Promise<IServiceLayerResponse<{request : IRequest, other_client : number}>> {
        const r_result = await this.repository.Iroom_repo.getRoomMembers(room_id);
        if (!r_result.success)
            return {
                success : r_result.success,
                log_message : r_result.log_message,
            };

        let other_userid : number;

        r_result.data!.map( (user) => {
            if (user.user_id === user_id)
                return;

            other_userid = user.user_id;
        } );

        const isPending = await this.repository.Icontact_repo.isRequestPending(user_id, other_userid!, "reactive");
        if (!isPending.success || isPending.data)
            return {
                success : false,
                log_message : isPending.log_message,
            };
        
        const result = await this.repository.Icontact_repo.insertRejoinRequest(public_id, room_id, user_id, other_userid!);

        return {success : result.success, data : {request : result.data!, other_client : other_userid!}, log_message : result.log_message};
    }

    public async performGetRequest(req_public_id: string): Promise<IServiceLayerResponse<IRequest>> {
        const c_result = await this.repository.Icontact_repo.getRequestsByPublicID(req_public_id);
        if (!c_result.success)
            return { success : c_result.success, log_message : c_result.log_message};

        return {success : c_result.success, data : c_result.data, log_message : c_result.log_message};
    }

    public async performVerdictRejoin(reqeust: IRequest, request_verdict: boolean): Promise<IServiceLayerResponse<IRoom>> {
        let status;
        if (request_verdict)
            status = "accepted";
        else
            status = "rejected";

        const c_result = await this.repository.Icontact_repo.updateRejoinRequest(status, reqeust.request_id);
        if (!c_result.success)
            return { success : c_result.success, log_message : c_result.log_message};

        if (request_verdict)
        {
            const room = await this.repository.Iroom_repo.getRoomByID(c_result.data!);  
            return {success : room.success, data : room.data, log_message : `you have ${status} the rejoin request`};     
        }

        return { success : request_verdict, log_message : c_result.log_message};
    }

    public async performRemoveReactive(room_id : number): Promise<IServiceLayerResponse> 
    {
        const c_result = await this.repository.Icontact_repo.removeReactive(room_id);
        return {success : c_result.success, log_message : c_result.log_message};
    }

}