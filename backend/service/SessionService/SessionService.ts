import { Repository } from "../../componantParams.js";
import { IClient } from "../../domain/IClient.js";
import { IServiceLayerResponse } from "../../responseFormat.js";
import { ISessionService } from "./ISessionService.js";
import { v4 as uuidv4 } from 'uuid';

// this service keeps track of user sessions and verification
export class SessionService implements ISessionService {
    public static getInstance(repository: Repository): SessionService {
        if (SessionService.instance)
            return SessionService.instance;

        SessionService.instance = new SessionService(repository);
        return SessionService.instance;
    }

    private static instance: SessionService;
    private repository: Repository;

    private constructor(repository: Repository) {
        this.repository = repository;
    }


    // creates a random id for a new session
    public generateSessionID(): IServiceLayerResponse<string> {
        return {
            success: true,
            data: uuidv4(),
            log_message: "session id generated.."
        };
    }

    // makes the user's session last longer
    public async performExtendSession(user_id: number): Promise<IServiceLayerResponse> {
        const result = await this.repository.Iclient_repo.extendSessionByUserID(user_id);
        return result;
    }

    // checks if a session id is still valid and returns the user info
    public async performVerifySession(session_id: string): Promise<IServiceLayerResponse<IClient>> {
        const cl_result = await this.repository.Iclient_repo.getClientBySessionID(session_id);

        if (!cl_result.success) {
            return { success: false, log_message: "user doesn't exists, please SignUp.." };
        }

        return {
            success: true,
            data: cl_result.data!,
            log_message: "Account found, user logged in..",
        };
    }

    // finds a user by their unique database id
    public async performVerifyUserID(user_id: number): Promise<IServiceLayerResponse<IClient>> {
        const cl_result = await this.repository.Iclient_repo.getClientByUserID(user_id);

        if (!cl_result.success) {
            return { success: false, log_message: "user doesn't exists" };
        }

        return {
            success: true,
            data: cl_result.data!,
            log_message: "Account found, user logged in..",
        };
    }

    // checks if a username exists in our system
    public async performVerifyUsername(username: string): Promise<IServiceLayerResponse<IClient>> {
        const cl_result = await this.repository.Iclient_repo.checkClientExist(username);

        if (!cl_result.success) {
            return { success: false, log_message: "user doesn't exists" };
        }

        return {
            success: true,
            data: cl_result.data!,
            log_message: "Account found, user logged in..",
        };
    }

    // removes a session from the database when the user logs out
    public async performLogOutSession(session_id: string): Promise<IServiceLayerResponse> {
        return await this.repository.Iclient_repo.removeClientSession(session_id);
    }

    // updates the user's nickname in the database
    public async performUpdateNickname(user_id: number, nickname: string): Promise<IServiceLayerResponse> {
        return await this.repository.Iclient_repo.updateNickname(user_id, nickname);
    }

    // updates the user's avatar image
    public async performUpdateAvatar(user_id: number, avatar: string): Promise<IServiceLayerResponse> {
        return await this.repository.Iclient_repo.updateAvatar(user_id, avatar);
    }

    public performValidateUsernamePrompt(username: string): IServiceLayerResponse{
        const user = username.trim();

        if (!/^[A-Za-z0-9_]{3,16}$/.test(user)) {
            return {
                success: false,
                log_message: "Username must be 3-16 letters, numbers, or underscores"
            };
        }

        return { success: true, log_message: "Username is valid" };
    }

    public performValidateNicknamePrompt(nickname: string): IServiceLayerResponse {
        const nick = nickname.trim();

        if (nick.length < 2 || nick.length > 8) {
            return {
                success: false,
                log_message: "Nickname must be 2-8 characters long"
            };
        }

        return { success: true, log_message: "Nickname is valid" };
    }

    public performValidatePasswordPrompt(password: string): IServiceLayerResponse {
        const pass = password.trim();

        const hasUpper = /[A-Z]/.test(pass);
        const hasLower = /[a-z]/.test(pass);
        const hasNum = /[0-9]/.test(pass);
        const hasSpec = /[^A-Za-z0-9]/.test(pass);

        if (pass.length < 8) {
            return { success: false, log_message: "Password must be at least 8 characters" };
        }

        if (!hasUpper || !hasLower || !hasNum || !hasSpec) {
            return {
                success: false,
                log_message: "Password must contain uppercase, lowercase, number, and special character."
            };
        }

        return { success: true, log_message: "Password is valid" };
    }

    public performtValidateRequestPrompt(prompt: string): IServiceLayerResponse {
        if (prompt.length === 0)
            return {
                success : false,
                log_message : "the field is empty",
            };
        
        return {
            success : true,
            log_message : "request prompt is valid",
        };
    }


    public performValidateMessagePrompt(prompt: string): IServiceLayerResponse {
        if (prompt.length === 0)
            return {
                success : false,
                log_message : "the field is empty",
            };
        
        return {
            success : true,
            log_message : "message prompt is valid",
        };
    }
}
