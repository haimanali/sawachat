import { IClientRepository } from "../repository/IClientRepositoy";
import { ISignUpRequest } from "../requestFormat";
import { ISignUpService } from "./ISignUpService";

export class SignUpService implements ISignUpService
{
        public static getInstance(Iclient_repo : IClientRepository) : SignUpService
        {
            if(SignUpService.instance)
                return SignUpService.instance;
    
            SignUpService.instance = new SignUpService(Iclient_repo);
            return SignUpService.instance;
        }
    
        private static instance : SignUpService;
        private Iclient_repo : IClientRepository;
        private constructor(Iclient_repo : IClientRepository)
        {
            this.Iclient_repo = Iclient_repo;
        }


        //overrides
        public async userSignUp(req_body: ISignUpRequest): Promise<void> {
            await this.Iclient_repo.insertUserRecord(req_body.username, req_body.nickname, req_body.password);
        }
}