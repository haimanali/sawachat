import express from 'express'
import http from 'http'
//server initializtion
const app = express();
const server = http.createServer(app);

//repository layer
import { IClientRepository } from './repository/IClientRepositoy';
import { ClientRepository } from './repository/ClientRepository';
const db_conn = DBConn.getInstance();
const Iclient_repo : IClientRepository = ClientRepository.getInstance(db_conn);

//sevice layer
import {ILoginService} from './service/Ilogin_service'
import {LoginService} from './service/login_service'
const Ilogin_service : ILoginService = LoginService.getInstance(Iclient_repo);


//controller layer
import {StatelessController} from './controller/StatelessController'
import {StatefulController} from './controller/StatefulController'
import { DBConn } from './repository/DBConn';
const stateless_controller : StatelessController = StatelessController.getInstance(app, Ilogin_service);
const stateful_controller : StatefulController = StatefulController.getInstance();

server.on('upgrade', (req, soc, buff) => {
    stateful_controller.handleUpgrade(req, soc, buff);
})

server.listen(3000, () => {console.log("server listening....")})