import { ILoginService } from "./ILoginService.js";
import { Repository } from '../../componantParams.js'
import { IClient } from "../../domain/IClient.js";
import { IServiceLayerResponse } from "../../responseFormat.js";

export class LoginService implements ILoginService{
    public static getInstance(repository : Repository) : LoginService
    {
        if(LoginService.instance)
            return LoginService.instance;

        LoginService.instance = new LoginService(repository);
        return LoginService.instance;
    }

    private static instance : LoginService;
    private repository : Repository;
    private constructor(repository : Repository)
    {
        this.repository = repository;
    }

    //overrides


    public async performUserLogin(session_id : string, username : string, password : string, auto_login : boolean): Promise<IServiceLayerResponse<IClient>> 
    {
        const c_result = await this.repository.Iclient_repo.validateClient(username, password);

        if (!c_result.success)
            return {
                success : false,
                log_message : "either the username / password are invalid..",
            };

        const expire = new Date();
        if(auto_login)
            expire.setDate(expire.getDate() + 14);
        else
            expire.setHours(expire.getHours() + 2);

        await this.repository.Iclient_repo.insertClientSession(session_id, c_result.data!.user_id, expire);

        return {
            success : true,
            data : c_result.data,
            log_message : "Account found, user logged in..",
        };        
    }

}
