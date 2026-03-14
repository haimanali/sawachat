//server initializtion
import express from 'express'
import http from 'http'
//repository layer
import { IClientRepository } from './repository/IClientRepository.js';
import { ClientRepository } from './repository/ClientRepository.js';
//sevice layer
import { ILoginService } from './service/ILoginService.js'
import { LoginService } from './service/LoginService.js'
import { ISignUpService } from './service/ISignUpService.js';
import { SignUpService } from './service/SignUpService.js';
//controller layer
import {StatelessController} from './controller/StatelessController.js'
import {StatefulController} from './controller/StatefulController.js'
import { DBConn } from './repository/DBConn.js';

try
{
const app = express();
const server = http.createServer(app);


const db_conn = DBConn.getInstance();
const Iclient_repo : IClientRepository = ClientRepository.getInstance(db_conn);


const Isignup_service : ISignUpService = SignUpService.getInstance(Iclient_repo);
const Ilogin_service : ILoginService = LoginService.getInstance(Iclient_repo);


const stateless_controller : StatelessController = StatelessController.getInstance(app, Ilogin_service, Isignup_service);
const stateful_controller : StatefulController = StatefulController.getInstance();


    server.on('upgrade', (req, soc, buff) => {
        stateful_controller.handleUpgrade(req, soc, buff);
    })

    server.listen(3000, () => {console.log("server listening....")})   

}
catch(error)
{
    console.log(error);
}
