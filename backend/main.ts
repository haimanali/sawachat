import express from 'express'
import http from 'http'
const app = express();
const server = http.createServer(app);

//sevice layer
import {ILoginService} from './service/Ilogin_service'
import {LoginService} from './service/login_service'
const Ilogin_service : ILoginService = new LoginService();


//controller layer
import {StatelessController} from './controller/StatelessController'
import {StatefulController} from './controller/StatefulController'
const stateless_controller : StatelessController = StatelessController.getInstance(app, Ilogin_service);
const stateful_controller : StatefulController = StatefulController.getInstance();

server.on('upgrade', (req, soc, buff) => {
    stateful_controller.handleUpgrade(req, soc, buff);
})

server.listen(3000, () => {console.log("server listening....")})