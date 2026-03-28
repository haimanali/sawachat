import { IClientRepository } from "./repository/ClientRepository/IClientRepository.js";
import { IContactRepository } from "./repository/ContactRepository/IContactRepository.js";
import { IMessageRepository } from "./repository/MessageRepository/IMessageRepository.js";
import { IRoomRepository } from "./repository/RoomRepository/IRoomRepository.js";
import { IContactService } from "./service/ContactService/IContactService.js";
import { ILoginService } from "./service/LoginService/ILoginService.js";
import { IMessageService } from "./service/MessageService/IMessageService.js";
import { IRoomService } from "./service/RoomService/IRoomService.js";
import { ISessionService } from "./service/SessionService/ISessionService.js";
import { ISignUpService } from "./service/SignUpService/ISignUpService.js";


export interface Services
{
        readonly Iroom_service : IRoomService,
        readonly Icontact_service : IContactService,
        readonly Isession_service : ISessionService,
        readonly Imessage_service : IMessageService,
        readonly Isignup_service : ISignUpService,
        readonly Ilogin_service : ILoginService,
}

export interface Repository
{
    readonly Iclient_repo : IClientRepository,
    readonly Iroom_repo : IRoomRepository,
    readonly Icontact_repo : IContactRepository,
    readonly Imessage_repo : IMessageRepository,
}