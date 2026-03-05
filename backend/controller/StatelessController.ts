import express, {Express} from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import path from 'path'
import { ILoginService } from '../service/Ilogin_service'
import { ILoginRequest } from '../requestFormat'


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
        this.app.get("/", (req, res) => {

            const session_id = req.cookies.session_id;

            if (session_id)
            {
                const result = this.Ilogin_service.verifySession(session_id);
                if (result.success)
                {
                    res.redirect(`/${result.username}`);
                    return;
                }
            }

            res.sendFile(path.resolve("frontend/public/index.html"));
        });

        this.app.get("/:page", (req, res) => {
            const target = (req.params.page).trim();
            const site_pages = ["login", "signup"];

            if(site_pages.includes(target))
            {
                res.sendFile(path.resolve(`frontend/public/${target}.html`));
            }
            else
            {
                const session_id = req.cookies.session_id;
                if(session_id)
                {
                    if(this.Ilogin_service.verifySession(session_id, target))
                    {
                        res.sendFile(path.resolve("frontend/private/home.html"));
                        return;
                    }
                }
                res.redirect("/login");
            }
        });

        this.app.post("/api/login", (req, res) => {

            const req_body : ILoginRequest = req.body;
            const payload = this.Ilogin_service.userLogin(req_body);

            if(payload.success)
            {
                if(req_body.auto_login)
                {
                    const cookie_expire = 14 * 24 * 60 * 60 * 1000; // 14 days
                    res.cookie("session_id", payload.session_id, {
                        expires : new Date(Date.now() + (cookie_expire)),
                        httpOnly : true,
                       //secure : true,
                    });                    
                }
                else
                {
                    res.cookie("session_id", payload.session_id, {
                        httpOnly : true,
                        //secure : true,
                    });   
                }

                res.json( payload );
            }
            else
            {
                res.json( {success : false, message : "failed to login"} );
            }

        });

        this.app.post("/api/signup", (req, res) => {


        });

    }
}
