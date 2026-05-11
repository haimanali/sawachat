import { INotification } from "../../domain/INotification.js";
import { NotificationTypeUnion } from "../../domain/Notifications/NotificationTypeUnion.js";
import { INotificationRecord } from "../../entity/INotificationRecord.js";
import { ENotificationType, INotificaitonTypeCount } from "../../notificationFormat.js";
import { IPayloadRequestType } from "../../requestFormat.js";
import { IRepositoryLayerResponse } from "../../responseFormat.js";
import { DBConn } from "../DBConn.js";
import { INotificationRepository } from "./INotificationRepository.js";

// this repository handles all the sql queries for notifications
export class NotificationRepository implements INotificationRepository {
    public static getInstance(db_conn: DBConn): NotificationRepository {
        if (NotificationRepository.instance)
            return NotificationRepository.instance;

        NotificationRepository.instance = new NotificationRepository(db_conn);
        return NotificationRepository.instance;
    }

    private static instance: NotificationRepository;
    private db_conn: DBConn;
    private constructor(db_conn: DBConn) {
        this.db_conn = db_conn;
    }


    // helper to find a notification in the database by its id
    public async getNotificationById(notification_id: number): Promise<IRepositoryLayerResponse<INotification<NotificationTypeUnion>>> {
        const sql = "select BIN_TO_UUID(public_id) as public_id, type, created_at, payload from Notification where notification_id = ?";
        const result = await this.db_conn.executeQuery<INotificationRecord<NotificationTypeUnion>>(sql, [notification_id]);

        if (result.count <= 0)
            return { success: false, log_message: "fetch has failed" };

        return {
            success: true,
            data: result.data[0],
            log_message: "got notificaiton be id",
        };
    }

    // this gets the latest notifications for a user, grouped by type
    public async getNotificationsByUserID(user_id: number, is_read: boolean): Promise<IRepositoryLayerResponse<INotification<NotificationTypeUnion>[]>> {
        const sql = `
            SELECT * FROM (
                    SELECT notification_id, BIN_TO_UUID(public_id) as public_id, type, payload, created_at,
                    ROW_NUMBER() OVER (PARTITION BY type ORDER BY created_at DESC) as row_num
                    FROM Notification 
                    WHERE user_id = ? AND is_read = ?
                ) as ranked 
                WHERE row_num <= ${IPayloadRequestType.LIMIT}`;


        const result = await this.db_conn.executeQuery<INotificationRecord<NotificationTypeUnion>>(sql, [user_id, is_read]);

        return {
            success: true,
            data: result.data,
            log_message: "got users notifications",

        };
    }

    // this counts how many unread notifications a user has for each category
    public async getNotificationCountByID(user_id: number): Promise<IRepositoryLayerResponse<INotificaitonTypeCount>> {
        const sql = `select type, count(*) as total from Notification where user_id = ? and is_read = false group by type`
        const result = await this.db_conn.executeQuery<{ type: ENotificationType, total: number }>(sql, [user_id]);

        const notif_count_type = result.data.reduce((acc, row) => {
            if (row.type in acc)
                acc[row.type as keyof INotificaitonTypeCount] += row.total;
            return acc;
        }, {
            [ENotificationType.CREATE_CONTACT]: 0,
            [ENotificationType.RECEIVE_REQUEST]: 0,

        } as INotificaitonTypeCount);

        return {
            success: true,
            data: notif_count_type,
            log_message: "got notif count",
        };
    }

    // inserts a new notification into the database
    public async insertNotificationRecord(public_id: string, user_id: number, payload: NotificationTypeUnion, type: ENotificationType): Promise<IRepositoryLayerResponse<INotification<NotificationTypeUnion>>> {
        const sql = "insert into Notification (public_id, user_id, type, payload, is_read) values (UUID_TO_BIN(?), ?, ?, ?, ?) ";
        const result = await this.db_conn.executeUpdate(sql, [public_id, user_id, type, JSON.stringify(payload), false]);

        if (result.affectedRows <= 0)
            throw Error("something went wrong");

        const notificaiton = await this.getNotificationById(result.insertId);
        if (!notificaiton.success)
            throw Error("something went wrong");

        return {
            success: true,
            data: notificaiton.data,
            log_message: "notification inserted",
        };
    }

    // marks multiple notifications as read at once based on their type
    public async updateNotificationReadByType(type: ENotificationType, is_read: boolean): Promise<IRepositoryLayerResponse> {
        const sql = "update Notification set is_read = ? where type = ?";
        const result = await this.db_conn.executeUpdate(sql, [is_read, type]);

        if (result.affectedRows <= 0)
            return {
                success: false,
                log_message: "invalid notification public uuid",
            };

        return {
            success: true,
            log_message: "noification marked as read",
        };
    }

    // marks a single specific notification as read using its public id
    public async updateNotificationReadByPID(notif_public_id: string, is_read: boolean): Promise<IRepositoryLayerResponse> {
        const sql = "update Notification set is_read = ? where public_id = UUID_TO_BIN(?)";
        const result = await this.db_conn.executeUpdate(sql, [is_read, notif_public_id]);

        if (result.affectedRows <= 0)
            return {
                success: false,
                log_message: "invalid notification public uuid",
            };

        return {
            success: true,
            log_message: "noification marked as read",
        };
    }
}