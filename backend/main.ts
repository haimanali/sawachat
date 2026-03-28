//server initializtion
import express from 'express'
import http from 'http'
//repository layer
import { IClientRepository } from './repository/ClientRepository/IClientRepository.js';
import { ClientRepository } from './repository/ClientRepository/ClientRepository.js';

import { IRoomRepository } from './repository/RoomRepository/IRoomRepository.js';
import { RoomRepository } from './repository/RoomRepository/RoomRepository.js';

import { IContactRepository } from './repository/ContactRepository/IContactRepository.js';
import { ContactRepositiry } from './repository/ContactRepository/ContactRepository.js';

import { IMessageRepository } from './repository/MessageRepository/IMessageRepository.js';
import { MessageRepository } from "./repository/MessageRepository/MessageRepository.js"; 

import { DBConn } from './repository/DBConn.js';

//sevice layer
import { ILoginService } from './service/LoginService/ILoginService.js'
import { LoginService } from './service/LoginService/LoginService.js'

import { ISignUpService } from './service/SignUpService/ISignUpService.js';
import { SignUpService } from './service/SignUpService/SignUpService.js';

import { IRoomService } from './service/RoomService/IRoomService.js';
import { RoomService } from './service/RoomService/RoomService.js';

import { ContactService } from './service/ContactService/ContactService.js';
import { IContactService } from './service/ContactService/IContactService.js';

import { IMessageService } from './service/MessageService/IMessageService.js';
import { MessageService } from './service/MessageService/MessageService.js';
//Application layer

import {IApiApplication} from "./Application/IApiApplication.js"
import {ApiApplication} from "./Application/ApiApplication.js"

//controller layer
import {StatelessController} from './controller/StatelessController.js'
import {StatefulController} from './controller/StatefulController.js'

//services object
import { Repository, Services } from './componantParams.js';
import { ISessionService } from './service/SessionService/ISessionService.js';
import { SessionService } from './service/SessionService/SessionService.js';



try
{
const app = express();
const server = http.createServer(app);

const db_conn = DBConn.getInstance();

const Iclient_repo : IClientRepository = ClientRepository.getInstance(db_conn);
const Iroom_repo : IRoomRepository = RoomRepository.getInstance(db_conn);
const Icontact_repo : IContactRepository = ContactRepositiry.getInstance(db_conn);
const Imessage_repo : IMessageRepository = MessageRepository.getInstance(db_conn);

const repository : Repository = 
{
    Iclient_repo : Iclient_repo,
    Iroom_repo : Iroom_repo,
    Icontact_repo : Icontact_repo,
    Imessage_repo : Imessage_repo,
}


const Isignup_service : ISignUpService = SignUpService.getInstance(repository);
const Ilogin_service : ILoginService = LoginService.getInstance(repository);
const Iroom_service : IRoomService = RoomService.getInstance(repository);
const Imessage_service : IMessageService = MessageService.getInstance(repository);
const Icontact_service : IContactService = ContactService.getInstance(repository);
const Isession_service : ISessionService = SessionService.getInstance(repository);


const services : Services = {
        Iroom_service : Iroom_service,
        Icontact_service : Icontact_service,
        Isession_service : Isession_service,
        Imessage_service : Imessage_service,
        Ilogin_service : Ilogin_service,
        Isignup_service : Isignup_service,
}


const Iapp_layer : IApiApplication = ApiApplication.getInstance(services);

const stateless_controller : StatelessController = StatelessController.getInstance(app, Iapp_layer);
const stateful_controller : StatefulController = StatefulController.getInstance(server, Iapp_layer);

server.listen(3000, () => {console.log("server listening....")})   

}
catch(error)
{
    console.log(error);
}
