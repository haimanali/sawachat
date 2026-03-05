import express, {Express} from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import path from 'path'
import { ILoginService } from '../service/Ilogin_service'


export class StatelessController {

    public static getInstance(app : Express, Ilogin_service : ILoginService) : StatelessController {
        if (StatelessController.instance) 
            return StatelessController.instance;

        StatelessController.instance = new StatelessController(app, Ilogin_service);
        return StatelessController.instance;
    }

    private static instance : StatelessController;
    private Ilogin_service : ILoginService;
    private app : Express;
    private constructor (app : Express, Ilogin_service : ILoginService )
    {
        this.Ilogin_service = Ilogin_service;
        this.app = app;
        this.app.use(express.static("frontend/public"));
        this.app.use(cors({
            origin : "localhost:3000",
            methods : ["post", "get", "put", "delete"],
        }));
        this.app.use(express.json());
        this.app.use(cookieParser());

        this.initRoutes();
    }

    private initRoutes() : void 
    {

    }
}
