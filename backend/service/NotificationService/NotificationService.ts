import { Repository } from "../../componantParams.js";
import { INotification } from "../../domain/INotification.js";
import { NotificationTypeUnion } from "../../domain/Notifications/NotificationTypeUnion.js";
import { ENotificationType, INotificaitonTypeCount } from "../../notificationFormat.js";
import { IServiceLayerResponse } from "../../responseFormat.js";
import { INotificationService } from "./INotificationService.js";
import { v4 } from "uuid";

// this service handles all the system notifications (friend requests, room creates, etc)
export class NotificationService implements INotificationService
{
    public static getInstance(repository : Repository) : NotificationService
    {
        if (NotificationService.instance)
            return NotificationService.instance;

        NotificationService.instance = new NotificationService(repository);
        return NotificationService.instance;
    }


    private static instance : NotificationService;
    private repository : Repository;
    private constructor (repository : Repository)
    {
        this.repository = repository;
    }


    // generates a unique id for the notification
    public generatePublicID(): IServiceLayerResponse<string> {
        return {success : true, data : v4(), log_message : "public id generated"};
    }

    // this gets all unread notifications for a user
    public async performLoadNotifications(user_id: number): Promise<IServiceLayerResponse<{total : INotificaitonTypeCount, notifications : INotification<NotificationTypeUnion> []}>> {
        const result = await this.repository.Inotif_repo.getNotificationsByUserID(user_id, false);
        const count = await this.repository.Inotif_repo.getNotificationCountByID(user_id);

        return {success : result.success, data : {total : count.data!, notifications : result.data!}, log_message : result.log_message};
    }

    // this marks notifications as read based on their type
    public async performMarkAsReadType(type: ENotificationType): Promise<IServiceLayerResponse> {
        const result = await this.repository.Inotif_repo.updateNotificationReadByType(type, true);
        return {success : result.success, data : result.data, log_message : result.log_message};
    }

    // this marks a specific notification as read using its id
    public async performMarkAsReadPID(notif_public_id: string): Promise<IServiceLayerResponse> {
        const result = await this.repository.Inotif_repo.updateNotificationReadByPID(notif_public_id, true);
        return {success : result.success, log_message : result.log_message};
    }

    // this creates a new notification in the database
    public async performPushNotifcation(public_id : string, payload : NotificationTypeUnion, type : ENotificationType, user_id : number): Promise<IServiceLayerResponse<INotification<NotificationTypeUnion>>> {
        const result = await this.repository.Inotif_repo.insertNotificationRecord(public_id, user_id, payload, type);
        return {success : result.success, data : result.data, log_message : result.log_message};
    }
}