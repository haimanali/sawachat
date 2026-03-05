import { IClientRepository } from "./IClientRepositoy";

export class ClientRepository implements IClientRepository
{
    public static getInstance() : ClientRepository
    {
        if(ClientRepository.instance)
            return ClientRepository.instance;

        ClientRepository.instance = new ClientRepository();
        return ClientRepository.instance;
    }

    private static instance : ClientRepository;
    private constructor()
    {

    }

    public compare(session_id: string, username: string): boolean {
        
    }

    public getUsername(session_id: string): string {
        
    }


}