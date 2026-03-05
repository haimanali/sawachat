import { ILoginResponse } from "../responseFormat";
import { ILoginService } from "./Ilogin_service";
import { IClientRepository } from '../repository/IClientRepositoy'
import { ILoginRequest } from "../requestFormat";

export class LoginService implements ILoginService{
    public static getInstance(Iclient_repo : IClientRepository) : LoginService
    {
        if(LoginService.instance)
            return LoginService.instance;

        LoginService.instance = new LoginService(Iclient_repo);
        return LoginService.instance;
    }

    private static instance : LoginService;
    private Iclient_repo : IClientRepository;
    private constructor(Iclient_repo : IClientRepository)
    {
        this.Iclient_repo = Iclient_repo;
    }

    private genarateSessionID() : string 
    {

    }

    private hashPassword(passw : string) : string
    {

    }


    //overrides
    public verifySession(session_id : string, username? : string) : ILoginResponse
    {
        if(username)
        {
            return {
                success : this.Iclient_repo.compare(session_id, username),
                username: username,
                session_id: session_id,
            };
     
        }
        else
        {
            return{
                success : true,
                username: this.Iclient_repo.getUsername(session_id),
                session_id: session_id,
            }
        }
    }

    public userLogin(req_body: ILoginRequest): ILoginResponse 
    {
        
    }

}
