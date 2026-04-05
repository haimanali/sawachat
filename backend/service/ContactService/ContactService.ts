import { Repository } from "../../componantParams.js";
import { IRequest } from "../../domain/IRequest.js";
import { IServiceLayerResponse } from "../../responseFormat.js";
import { IContactService } from "./IContactService.js";
import { v4 as generateRequestPublicID } from "uuid";


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

    public async performSendRequest(r_user_id: number, s_user_id : number): Promise<IServiceLayerResponse<IRequest>> 
    {
        const is_pending = await this.repository.Icontact_repo.isRequestPending(r_user_id, s_user_id);

        if (is_pending.data)
            return {
                success : false,
                log_message : "Request has already been sent",
            };
            
        const c_result = await this.repository.Icontact_repo.insertContactRequest(generateRequestPublicID(), r_user_id, s_user_id);
        
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


}