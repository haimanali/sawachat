import { z } from 'zod'
import { ENotificationType } from './notificationFormat.js';

export enum IPayloadRequestType {
    EXTEND_SESSION = "extend_session",
    ONLINE_STATUS = "online_status",

    MESSAGE_RECEIVED = "message_received",
    SEND_MESSAGE = "send_message",
    UPDATE_LAST_READ = "update_last_read",
    SEND_REQUEST = "send_request",
    VERDICT_REQUEST = "verdict_request_create_room",
    VERDICT_REJOIN = "verdict_rejoin",
    LOAD_ROOMS = "load_rooms",
    LOAD_REQUESTS = "load_requests",
    LOAD_MESSAGES = "load_messages",
    LOAD_NOTIFICATIONS = "load_notifications",
    LOAD_CONTACTS = "load_contacts",
    DELIVER_RECEIVED_MESSAGES = "deliver_received_messages",
    DELETE_CONTACT = "delete_contact",
    REJOIN_REQUEST = "rejoin_request",
    MARK_NOTIF_READ = "mark_notif_read",
    BULK_NOTIF_READ = "bulk_notif_read",
    UPDATE_NICKNAME = "update_nickname",
    UPDATE_AVATAR = "update_avatar",
    LIMIT = 10,
}


//stateless schema
export const login_schema = z.object({
    auto_login: z.boolean().default(false),
    username: z.string(),
    password: z.string(),
});

export type ILoginRequest = z.infer<typeof login_schema>;


export const signup_schema = z.object({
    username: z.string(),
    nickname: z.string(),
    password: z.string(),
});

export type ISignUpRequest = z.infer<typeof signup_schema>;

//stateful schema
const load_requests = z.object({
    type: z.literal(IPayloadRequestType.LOAD_REQUESTS),
});

const load_rooms = z.object({
    type: z.literal(IPayloadRequestType.LOAD_ROOMS),
    payload: z.object({
        cursor: z.coerce.date().nullable(),
    }),
});

const load_messages = z.object({
    type: z.literal(IPayloadRequestType.LOAD_MESSAGES),
    payload: z.object({
        room_public_id: z.string().max(36),
        cursor: z.coerce.date().nullable(),
    }),
});

const deliver_received_messages = z.object({
    type: z.literal(IPayloadRequestType.DELIVER_RECEIVED_MESSAGES)
});

const verdict_req_schema = z.object(
    {
        type: z.literal(IPayloadRequestType.VERDICT_REQUEST),
        payload: z.object({
            username: z.string().min(2).max(16),
            req_public_id: z.string().max(36),
            verdict: z.boolean().default(true),
        }),
    }
);
const send_request_schema = z.object(
    {
        type: z.literal(IPayloadRequestType.SEND_REQUEST),
        payload: z.object({
            username: z.string().min(2).max(16),
        }),
    }
);
const send_message_schema = z.object(
    {
        type: z.literal(IPayloadRequestType.SEND_MESSAGE),
        payload: z.object({
            room_public_id: z.string().max(36),
            msg_content: z.string().min(1).max(300),
            iv: z.string().max(32),
        }),
    }
);

const message_received = z.object({
    type: z.literal(IPayloadRequestType.MESSAGE_RECEIVED),
    payload: z.object({
        msg_public_id: z.string().max(36),
        room_public_id: z.string().max(36),
        s_username: z.string().max(16),
        is_delivered: z.boolean(),
    }),
});

const leave_room = z.object({
    type: z.literal(IPayloadRequestType.DELETE_CONTACT),
    payload: z.object({
        room_public_id: z.string().max(36),
        username: z.string().min(2).max(16),
    }),
});


const rejoin_request = z.object({
    type: z.literal(IPayloadRequestType.REJOIN_REQUEST),
    payload: z.object({
        room_public_id: z.string().max(36),
        username: z.string().min(2).max(16),
    }),

});

const verdict_rejoin = z.object({
    type: z.literal(IPayloadRequestType.VERDICT_REJOIN),
    payload: z.object({
        req_public_id: z.string().max(36),
        username: z.string().min(2).max(16),
        verdict: z.boolean(),
    }),
});

const load_notifications = z.object({
    type: z.literal(IPayloadRequestType.LOAD_NOTIFICATIONS),
});

const load_contacts = z.object({
    type: z.literal(IPayloadRequestType.LOAD_CONTACTS),
});

const mark_notif_read = z.object({
    type: z.literal(IPayloadRequestType.MARK_NOTIF_READ),
    payload: z.object({
        notif_public_id: z.string().max(36),
    }),
});

const bulk_notif_read = z.object({
    type: z.literal(IPayloadRequestType.BULK_NOTIF_READ),
    payload: z.object({
        type: z.enum(ENotificationType),
    }),
});

const update_last_read = z.object({
    type: z.literal(IPayloadRequestType.UPDATE_LAST_READ),
    payload: z.object({
        room_public_id: z.string().max(36),
        read_receipts: z.boolean(),
    }),
});

const update_nickname = z.object({
    type: z.literal(IPayloadRequestType.UPDATE_NICKNAME),
    payload: z.object({
        nickname: z.string().min(2).max(16),
    }),
});

const update_avatar = z.object({
    type: z.literal(IPayloadRequestType.UPDATE_AVATAR),
    payload: z.object({
        avatar: z.string(),
    }),
});

export const action_schema = z.discriminatedUnion("type", [
    load_messages,
    load_rooms,
    load_requests,
    send_message_schema,
    message_received,
    send_request_schema,
    verdict_req_schema,
    leave_room,
    rejoin_request,
    deliver_received_messages,
    verdict_rejoin,
    load_notifications,
    load_contacts,
    mark_notif_read,
    bulk_notif_read,
    update_last_read,
    update_nickname,
    update_avatar
]);

export type IActionRequest = z.infer<typeof action_schema>;