import React, { createContext, useContext, useEffect, useRef, ReactNode, useState, use } from 'react';
import { io, Socket } from 'socket.io-client';
import { INotificaitonTypeCount, IPayloadInterface, IPayloadRequestType, IPayloadResponseType } from '../interfaces/payload/EPaylaod';
import { initKey } from '../services/initKey'
import { msgDecryption } from '../services/msgDecryption'
import { IMessagePublic } from '../interfaces/public/IMessagePublic'
import { IRequestPublic } from '../interfaces/public/IRequestPublic'
import { IRoomPublic } from '../interfaces/public/IRoomPublic'
import { IClientPublic } from '../interfaces/public/IClientPublic'
import { NavigateFunction } from "react-router-dom";
import { ISocketContext } from '../interfaces/context/ISocketContext';
import { IRoomCache } from '../interfaces/UI/IRoomCache';
import { INotificationPublic } from '../interfaces/public/INotificationPublic';
import { ENotificationType, IGlobalNotifCount, NotificationTypeUnion } from '../interfaces/UI/notificationFormat';
import { INotificationState } from '../interfaces/UI/INotificationState';
import { IContactState } from '../interfaces/UI/IContactState';



const SocketContext = createContext<ISocketContext | undefined>(undefined);

export const SocketProvider = ({ children, userState, setUserState, status, navigate, showToast }: { children: ReactNode, userState: IClientPublic, setUserState: React.Dispatch<React.SetStateAction<IClientPublic | null>>, status: "authorized" | "loading", navigate: NavigateFunction, showToast(msg: string): void }) => {


    const socketRef = useRef<Socket | null>(null);

    const [notifications, setNotifications] = useState<INotificationState>({
        [ENotificationType.CREATE_CONTACT]: {},
        [ENotificationType.RECEIVE_REQUEST]: {},
    });

    const [notifCountType, setNotifCountType] = useState<IGlobalNotifCount>(
        {
            [ENotificationType.CREATE_CONTACT]: 0,
            [ENotificationType.RECEIVE_REQUEST]: 0,
            [ENotificationType.RECEIVE_MESSAGE]: 0,
        }
    );

    const [onlineStatus, setOnlineStatus] = useState<"online" | "offline">("online");
    const online_status_ref = useRef<"online" | "offline">("online");
    const [contacts, setContacts] = useState<Record<string, IContactState>>({});

    const [rooms, setRooms] = useState<IRoomPublic[]>([]);
    const rooms_ref = useRef<IRoomPublic[]>([]);

    const [roomCache, setRoomCache] = useState<Record<string, IRoomCache>>({});
    const [hasMoreRooms, setHasMoreRooms] = useState<boolean>(true);
    const [activeRoomSetup, setActiveRoomSetup] = useState<IRoomPublic | null>(null);
    const [roomSettingsMenu, setRoomSettingsMenu] = useState<boolean>(false);

    const [requests, setRequests] = useState<IRequestPublic[]>([]);
    const [hasMoreRequests, setHasMoreRequests] = useState<boolean>(true);

    const [messages, setMessages] = useState<IMessagePublic[]>([]);
    const [hasMoreMessages, setHasMoreMessages] = useState<boolean>(true);
    const [msgInputDOM, setMsgInputDOM] = useState<boolean>(true);

    const [settingsPOPUP, setSettingsPOPUP] = useState<boolean>(false);
    const [addContactPOPUP, setaddContactPOPUP] = useState<boolean>(false);
    const [contactRequestError, setContactRequestError] = useState<string>("");
    const [addContactUsername, setAddContactUsername] = useState<string>("");

    const requests_cursor = useRef<Date | null>(null);
    const [loadingRequests, setLoadingRequests] = useState<boolean>(true);

    const rooms_cursor = useRef<Date | null>(null);
    const activeRoomRef = useRef<IRoomPublic | null>(null);
    const [loadingRooms, setLoadingRooms] = useState<boolean>(true);

    const messages_cursor = useRef<Date | null>(null);
    const [loadingMessages, setLoadingMessages] = useState<boolean>(true);

    const last_activity = useRef(Date.now());

    const [activeTab, setActive] = useState<"rooms" | "requests">("rooms");

    useEffect( () => {
        rooms_ref.current = rooms;
    }, [rooms]);

    useEffect(() => {
        const updateActivity = () => {
            if (!document.hasFocus())
                return;
            last_activity.current = Date.now();

            if (!socketRef.current?.active && !socketRef.current?.connected) {
                socketRef.current?.connect();
            }

            if (online_status_ref.current === "offline" && socketRef.current?.connected) {
                socketRef.current.emit(IPayloadRequestType.ONLINE_STATUS);
            }
        };
        window.addEventListener("mousemove", updateActivity);
        window.addEventListener("keydown", updateActivity);

        return () => {
            window.removeEventListener("mousemove", updateActivity);
            window.removeEventListener("keydown", updateActivity);
        };
    }, []);

    useEffect(() => {
        if (status !== "authorized")
            return;

        const interval = setInterval(() => {

            const idle_time = Date.now() - last_activity.current;
            const THREE_HOURS = 1000 * 60 * 60 * 3;

            if (socketRef.current?.connected && idle_time < THREE_HOURS) {
                socketRef.current.emit(IPayloadRequestType.EXTEND_SESSION);
            }

        }, 1000 * 60 * 15);

        return () => { clearInterval(interval) };

    }, [socketRef.current]);


    useEffect(() => {
        if (status !== "authorized")
            return;

        const interval = setInterval(() => {
            const idle_time = Date.now() - last_activity.current;
            const FIVE_MIN = 1000 * 60 * 5;

            if (socketRef.current?.connected && idle_time < FIVE_MIN) {
                socketRef.current.emit(IPayloadRequestType.ONLINE_STATUS);
            }

        }, 1000 * 60 * 2.5);

        return () => { clearInterval(interval) };

    }, [socketRef.current]);


    useEffect(() => {

        if (status !== "authorized")
            return;

        if (!socketRef.current) {
            socketRef.current = io("http://localhost:3000", {
                withCredentials: true,
                autoConnect: true,
                reconnectionAttempts: 3
            });

            const ws = socketRef.current;

            ws.on("connect_error", async (err) => {
                console.error("Connection failed:", err.message);

                if (err.message === IPayloadResponseType.ONAUTH_FAIL) {
                    navigate("/login");
                }
            });

            ws.on(IPayloadResponseType.ONUPDATE_USER_ONLINE_STATUS, (payload: IPayloadInterface<{ state: 'online' | 'offline' }>) => {
                const state = payload.data!.state;
                setOnlineStatus(state);
                online_status_ref.current = state;

                switch (state) {
                    case 'online': { showToast("welcome back!"); } break;
                    case 'offline': { showToast("Status changed to Offline due to long inactivity"); } break;
                };

            });

            ws.on(IPayloadResponseType.ONONLINE_STATUS, (payload: IPayloadInterface<{ username: string, state: 'online' | 'offline' }>) => {
                const { username, state } = payload.data!;

                setContacts((prev) => {
                    if (!prev[username])
                        return prev;


                    return {
                        ...prev,
                        [username]: {
                            ...prev[username],
                            onlineState: state
                        }
                    };
                });
            });

            ws.on(IPayloadResponseType.ONLOAD_CONTACTS, (payload: IPayloadInterface<IContactState[]>) => {
                const contactsArray = payload.data!;

                setContacts((prev) => {
                    const contact_obj = contactsArray.reduce((acc, contact) => {
                        acc[contact.client.username] = contact;
                        return acc;
                    }, {} as Record<string, IContactState>);

                    return {
                        ...prev,
                        ...contact_obj,
                    };
                });
            });

            ws.on(IPayloadResponseType.ONLOAD_NOTIFICATIONS, (payload: IPayloadInterface<{ total: INotificaitonTypeCount, notifications: INotificationPublic<NotificationTypeUnion>[] }>) => {
                const notification_items = payload.data!.notifications;
                const total_record = payload.data!.total;
                if (notification_items.length <= 0)
                    return;

                setNotifCountType((prev) => {
                    return {
                        ...prev,
                        [ENotificationType.CREATE_CONTACT]: total_record.create_contact,
                        [ENotificationType.RECEIVE_REQUEST]: total_record.receive_request,
                    };
                });
                setNotifications((prev) => {
                    const prev_items = { ...prev };

                    notification_items.forEach((notif) => {

                        switch (notif.payload.type) {
                            case ENotificationType.CREATE_CONTACT:
                                {
                                    prev_items[ENotificationType.CREATE_CONTACT][notif.payload.room.public_id] = notif;
                                }
                                break;
                            case ENotificationType.RECEIVE_REQUEST:
                                {
                                    prev_items[ENotificationType.RECEIVE_REQUEST][notif.payload.request.public_id] = notif;
                                }
                                break;
                            default:
                                break;
                        }

                    });

                    return prev_items;
                });
                let wel_msg = ``;
                if (notifCountType[ENotificationType.CREATE_CONTACT] > 0)
                    wel_msg += `${notifCountType[ENotificationType.CREATE_CONTACT]} new Contacts,`
                if (notifCountType[ENotificationType.RECEIVE_MESSAGE] > 0)
                    wel_msg += ` ${notifCountType[ENotificationType.RECEIVE_MESSAGE]} new Messages,`
                if (notifCountType[ENotificationType.RECEIVE_REQUEST] > 0)
                    wel_msg += ` ${notifCountType[ENotificationType.RECEIVE_REQUEST]} new Requests`

                if (wel_msg)
                    showToast(wel_msg);

            });

            ws.on(IPayloadResponseType.ONTRIGGER_NOTIFICATION, (payload: IPayloadInterface<INotificationPublic<NotificationTypeUnion>>) => {
                const notification_item = payload.data!;

                setNotifications((prev) => {
                    const type = notification_item.payload.type;

                    let entityId: string;

                    switch (type) {
                        case ENotificationType.CREATE_CONTACT:
                            {
                                entityId = notification_item.payload.room.public_id;
                            }
                            break;
                        case ENotificationType.RECEIVE_REQUEST:
                            {
                                entityId = notification_item.payload.request.public_id;
                            }
                            break;
                    }

                    if (prev[type] && prev[type][entityId]) {
                        return prev;
                    }

                    const updatedTypeGroup = {
                        ...prev[type],
                        [entityId]: notification_item
                    };

                    const newNotifications = {
                        ...prev,
                        [type]: updatedTypeGroup
                    };

                    setNotifCountType((prevCounts) => ({
                        ...prevCounts,
                        [type]: Object.keys(updatedTypeGroup).length
                    }));

                    return newNotifications;
                });
            });

            ws.on(IPayloadResponseType.ONLOAD_ROOMS, (payload: IPayloadInterface<{ total_unread: number, rooms: IRoomPublic[] }>) => {
                const room_items: IRoomPublic[] = payload.data!.rooms;
                setLoadingRooms(false);
                setNotifCountType((prev) => {
                    return {
                        ...prev,
                        [ENotificationType.RECEIVE_MESSAGE]: payload.data!.total_unread,
                    };
                });

                if (room_items.length === 0) {
                    setHasMoreRooms(false);
                    return;
                }

                setRooms((prev) => {
                    const existing_ids = new Set(prev.map(room => room.public_id));
                    const new_rooms = room_items.filter((room) => !existing_ids.has(room.public_id));

                    return [...new_rooms, ...prev];
                });

                setActiveRoomSetup(room_items[0]);

                rooms_cursor.current = room_items[room_items.length - 1].created_at;

                if (room_items.length < IPayloadRequestType.LIMIT) {
                    setHasMoreRooms(false);
                    return;
                }
            });

            ws.on(IPayloadResponseType.ONLOAD_REQUESTS, (payload: IPayloadInterface<IRequestPublic[]>) => {
                const request_items: IRequestPublic[] = payload.data!;
                setLoadingRequests(false);

                if (request_items.length === 0) {
                    setHasMoreRequests(false);
                    return;
                }

                requests_cursor.current = request_items[request_items.length - 1].created_at;


                setRequests((prev) => {
                    const existing_ids = new Set(prev.map(req => req.public_id));
                    const new_requests = request_items.filter((req) => !existing_ids.has(req.public_id));

                    return [...new_requests, ...prev];
                });

                if (request_items.length < IPayloadRequestType.LIMIT) {
                    setHasMoreRequests(false);
                    return;
                }
            });

            ws.on(IPayloadResponseType.ONLOAD_MESSAGES, async (payload: IPayloadInterface<IMessagePublic[]>) => {
                const encmessage_items: IMessagePublic[] = payload.data!;
                setLoadingMessages(false);

                if (encmessage_items.length === 0) {
                    setHasMoreMessages(false);
                    return;
                }


                const crypto_key = await initKey(activeRoomRef.current!.enc_key);

                const decrpyt_messages = await Promise.all(encmessage_items.map(async (enc_message) => {
                    let content;
                    if (enc_message.is_del)
                        content = enc_message.content;
                    else
                        content = await msgDecryption(enc_message.content, crypto_key, enc_message.iv);

                    return {
                        ...enc_message,
                        content: content,
                    };

                }));

                decrpyt_messages.reverse();

                setMessages((prev) => {
                    const existing_ids = new Set(prev.map(m => m.public_id));
                    const new_messages = decrpyt_messages.filter((d_msg) => !existing_ids.has(d_msg.public_id));

                    return [...new_messages, ...prev];
                });

                messages_cursor.current = encmessage_items[encmessage_items.length - 1].created_at;

                setRoomCache((prev) => {

                    const curr_room_msgs = prev[activeRoomRef.current!.public_id]?.messages || [];

                    return {
                        ...prev,
                        [activeRoomRef.current!.public_id]: {
                            messages: [...decrpyt_messages, ...curr_room_msgs],
                            cursor: messages_cursor.current,
                            hasMore: !(decrpyt_messages.length < IPayloadRequestType.LIMIT),
                            msgInputDOM: activeRoomRef.current!.is_active,
                            settingsMenu: false,
                        }

                    };

                });


                if (encmessage_items.length < IPayloadRequestType.LIMIT) {
                    setHasMoreMessages(false);
                    return;
                }
            });

            ws.on(IPayloadResponseType.ONSEND_MESSAGE, async (payload: IPayloadInterface<{ enc_message: IMessagePublic, iv: string }>) => {
                const enc_message = payload.data!.enc_message;
                const iv = payload.data!.iv;
                const roomID = enc_message.room_public_id;
                const isActiveRoom = activeRoomRef.current?.public_id === roomID;

                const crypto_key = await initKey(activeRoomRef.current!.enc_key);
                const decrypted_text = await msgDecryption(enc_message.content, crypto_key, iv);

                const message: IMessagePublic = {
                    ...enc_message,
                    is_sent: true,
                    is_delivered: false,
                    is_read: false,
                    content: decrypted_text,
                };

                setRooms((prev) => {
                    const updatedRooms = prev.map((room) => {
                        if (room.public_id === roomID) {
                            return {
                                ...room,
                                unread_msgs: room.unread_msgs,
                                last_msg_date: new Date(),
                                last_message_payload: enc_message
                            };
                        }
                        return room;
                    });

                    return [...updatedRooms].sort((a, b) =>
                        new Date(b.last_msg_date).getTime() - new Date(a.last_msg_date).getTime()
                    );
                });

                setRoomCache((prev) => {
                    const curr_room = prev[roomID];
                    if (!curr_room) return prev;
                    return {
                        ...prev,
                        [roomID]: {
                            ...curr_room,
                            messages: [...curr_room.messages, message],
                        },
                    };
                });

                if (isActiveRoom) {
                    setMessages((prev) => [...prev, message]);
                }
            });

            ws.on(IPayloadResponseType.ONDELETE_MESSAGE, (payload: IPayloadInterface<{ msg_public_id: string, room_public_id: string }>) => {
                const { msg_public_id, room_public_id } = payload.data!;

                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.public_id === msg_public_id
                            ? { ...msg, is_del: true, content: IPayloadResponseType.MESSAGE_DELELTED }
                            : msg
                    )
                );

                setRoomCache((prev) => {
                    const curr_room = prev[room_public_id];
                    if (!curr_room) return prev;

                    return {
                        ...prev,
                        [room_public_id]: {
                            ...curr_room,
                            messages: curr_room.messages.map((msg) =>
                                msg.public_id === msg_public_id
                                    ? { ...msg, is_del: true, content: IPayloadResponseType.MESSAGE_DELELTED }
                                    : msg
                            ),
                        },
                    };
                });

            });

            ws.on(IPayloadResponseType.ONRECEIVE_MESSAGE, async (payload: IPayloadInterface<{ enc_message: IMessagePublic, iv: string }>) => {
                const enc_message = payload.data!.enc_message;
                const roomID = enc_message.room_public_id;
                const isActiveRoom = activeRoomRef.current?.public_id === roomID;

                console.log(activeRoomRef.current!.public_id);
                console.log(roomID);


                ws.emit("message", {
                    type: IPayloadRequestType.MESSAGE_RECEIVED,
                    payload: {
                        msg_public_id: enc_message.public_id,
                        room_public_id: roomID,
                        s_username: enc_message.username,
                        is_delivered: true,
                    },
                });

                setRooms((prev) => {
                    const updatedRooms = prev.map((room) => {
                        if (room.public_id === roomID) {
                            return {
                                ...room,
                                unread_msgs: isActiveRoom ? room.unread_msgs : room.unread_msgs + 1,
                                last_msg_date: new Date(),
                                last_message_payload: enc_message
                            };
                        }
                        return room;
                    });

                    return [...updatedRooms].sort((a, b) =>
                        new Date(b.last_msg_date).getTime() - new Date(a.last_msg_date).getTime()
                    );
                });

                if (!isActiveRoom) {
                    setNotifCountType((prev) => ({
                        ...prev,
                        [ENotificationType.RECEIVE_MESSAGE]: prev[ENotificationType.RECEIVE_MESSAGE] + 1
                    }));
                }

                const enc_key = isActiveRoom ? activeRoomRef.current?.enc_key : rooms_ref.current.find( r => r.public_id === enc_message.room_public_id)?.enc_key;
                if (!enc_key)
                    return;

                const crypto_key = await initKey(enc_key);
                const decrypted_text = await msgDecryption(enc_message.content, crypto_key, payload.data!.iv);
                
                const fullMessage: IMessagePublic = {
                    ...enc_message,
                    is_sent: true,
                    is_delivered: true,
                    is_read: false,
                    content: decrypted_text,
                };
                
                setRoomCache((prev) => {
                    const curr_room = prev[roomID];
                    if (!curr_room) return prev;
                    return {
                        ...prev,
                        [roomID]: { ...curr_room, messages: [...curr_room.messages, fullMessage] }
                    };
                });
                
                if (!isActiveRoom)
                    return;

                setMessages((prev) => [...prev, fullMessage]);
            });

            ws.on(IPayloadResponseType.ONMESSAGE_RECEIVED, (payload: IPayloadInterface<{ msg_public_id: string, room_public_id: string, is_delivered: boolean }>) => {
                setRoomCache((prev) => {
                    const curr_room = prev[payload.data!.room_public_id];

                    if (!curr_room)
                        return prev;

                    return {
                        ...prev,
                        [payload.data!.room_public_id]: {
                            ...curr_room,
                            messages: curr_room.messages.map((msg) => {

                                if (msg.public_id === payload.data!.msg_public_id)
                                    return { ...msg, is_delivered: payload.data!.is_delivered };

                                return msg;
                            }),
                        },
                    };
                });

                if (payload.data!.room_public_id !== activeRoomRef.current?.public_id)
                    return;

                setMessages((prev) => prev.map(message => {
                    if (message.public_id === payload.data!.msg_public_id)
                        return { ...message, is_delivered: payload.data!.is_delivered };

                    return message;
                }));

            });

            ws.on(IPayloadResponseType.ONSEND_REQUEST, (payload: IPayloadInterface<IRequestPublic>) => {

                setAddContactUsername("");

                if (!payload.success) {
                    setContactRequestError(payload.log_message);

                    setTimeout(() => {
                        setContactRequestError("");
                    }, 1000);

                    return;
                }

                setaddContactPOPUP(false);
                showToast(payload.log_message);

            });


            ws.on(IPayloadResponseType.ONRECEIVE_REQUEST, (payload: IPayloadInterface<IRequestPublic>) => {

                setRequests(prev => {
                    if (prev.some(req => req.public_id === payload.data!.public_id))
                        return prev;

                    return [payload.data!, ...prev];
                });
            });

            ws.on(IPayloadResponseType.ONVERDICT_REQUEST, (payload: IPayloadInterface<string>) => {

                setRequests(prev => prev.filter(req => req.public_id !== payload.data!));

                showToast(payload.log_message);
            });

            ws.on(IPayloadResponseType.ONCREATE_CONTACT, (payload: IPayloadInterface<{ room: IRoomPublic, contact: IClientPublic, onlineState: "online" | "offline" }>) => {
                const { contact, room, onlineState } = payload.data!;

                setRooms(prev => {
                    if (prev.some(r => r.public_id === room.public_id))
                        return prev;

                    return [room, ...prev];
                });

                setContacts((prev) => {
                    return {
                        ...prev,
                        [contact.username]: {
                            client: contact,
                            onlineState: onlineState,
                        },
                    };
                });

            });

            ws.on(IPayloadResponseType.ONDELETE_CONTACT, (payload: IPayloadInterface<IClientPublic>) => {
                showToast(payload.log_message);

                setRoomCache((prev) => {
                    const { [activeRoomRef.current!.public_id]: _, ...rest } = prev;
                    return rest;
                });

                setRooms((prev) => prev.filter(room => room.public_id !== activeRoomRef.current!.public_id));
                setActiveRoomSetup(rooms.length <= 0 ? null : rooms[rooms.length - 1]);

            });

            ws.on(IPayloadResponseType.ONREMOVE_CONTACT, (payload: IPayloadInterface<IClientPublic>) => {
                setContacts((prev) => {
                    const { [payload.data!.username]: _, ...rest } = prev;
                    return rest;
                });
            });


            ws.on(IPayloadResponseType.ONDEACTIVATE_CONTACT, (payload: IPayloadInterface<{ room_public_id: string }>) => {
                if (payload.data!.room_public_id === activeRoomRef.current!.public_id)
                    setMsgInputDOM(false);

                setRoomCache((prev) => {
                    const curr_room = prev[payload.data!.room_public_id];

                    if (!curr_room)
                        return prev;

                    return {
                        ...prev,
                        [payload.data!.room_public_id]: {
                            ...curr_room,
                            msgInputDOM: false,
                        },
                    };
                });

                setRooms((prev) => prev.map((room) => room.public_id === payload.data!.room_public_id ? { ...room, is_active: false } : room));

            });

            ws.on(IPayloadResponseType.ONREJOIN_REQUEST, (payload: IPayloadInterface) => {
                showToast(payload.log_message);
            });

            ws.on(IPayloadResponseType.ONRECEIVE_REJOIN, (payload: IPayloadInterface<IRequestPublic>) => {
                if (!payload.success)
                    return; 1

                setRequests(prev => {
                    if (prev.some(req => req.public_id === payload.data!.public_id))
                        return prev;

                    return [payload.data!, ...prev];
                });
            });

            ws.on(IPayloadResponseType.ONVERDICT_REJOIN, (payload: IPayloadInterface<{ req_public_id: string, room: IRoomPublic }>) => {
                showToast(payload.log_message);
                setRequests((prev) => prev.filter(req => req.public_id !== payload.data!.req_public_id));

                if (!payload.success)
                    return;

                setRooms(prev => {
                    if (prev.some(room => room.public_id === payload.data!.room.public_id))
                        return prev;

                    return [payload.data!.room, ...prev];
                });
            });

            ws.on(IPayloadResponseType.ONACTIVATE_CONTACT, (payload: IPayloadInterface<{ room_public_id: string }>) => {
                if (!payload.success)
                    return;

                if (activeRoomRef.current?.public_id === payload.data!.room_public_id)
                    setMsgInputDOM(payload.success);

                setRoomCache((prev) => {
                    const curr_room = prev[payload.data!.room_public_id];

                    if (!curr_room)
                        return prev;

                    return {
                        ...prev,
                        [payload.data!.room_public_id]: {
                            ...curr_room,
                            msgInputDOM: payload.success,
                        },
                    };
                });
            });


            ws.on(IPayloadResponseType.ONBAN, (payload: IPayloadInterface) => {
                navigate(`/u/${userState.username}/ban`, { replace: true });
                setUserState(null);
                socketRef.current?.disconnect();
            })


            ws.on("connect", () => {
                console.log("client connected");

                ws.emit("message", { type: IPayloadRequestType.DELIVER_RECEIVED_MESSAGES });

                const request_payload1 = {
                    type: IPayloadRequestType.LOAD_ROOMS,
                    payload: {
                        cursor: null,
                    },
                };

                ws.emit("message", request_payload1);

                const request_payload2 = { type: IPayloadRequestType.LOAD_REQUESTS };

                ws.emit("message", request_payload2);

                const request_payload3 = { type: IPayloadRequestType.LOAD_NOTIFICATIONS };

                ws.emit("message", request_payload3);

                const request_payload4 = { type: IPayloadRequestType.LOAD_CONTACTS };

                ws.emit("message", request_payload4);

            });

            ws.on("disconnect", () => {
                console.log("client has disconnected");
            });

            ws.on("error", (reason) => {
                console.log(reason);
            })
        }


        return () => {
            if (socketRef.current) {
                socketRef.current.removeAllListeners();
                socketRef.current.disconnect();

                setRoomCache({});
                setMessages([]);
                setRooms([]);
                setRequests([]);

                socketRef.current = null;
                activeRoomRef.current = null;
                requests_cursor.current = null;
                rooms_cursor.current = null;
                messages_cursor.current = null;
            }
        };
    }, [status]);


    const value: ISocketContext = {
        socket: socketRef.current!,
        rooms, setRooms,
        messages, setMessages,
        requests, setRequests,
        activeRoomSetup, setActiveRoomSetup,
        userState,
        navigate,
        setaddContactPOPUP,
        setHasMoreMessages,
        setSettingsPOPUP,
        addContactPOPUP,
        messages_cursor,
        activeRoomRef,
        contactRequestError,
        addContactUsername,
        setAddContactUsername,
        settingsPOPUP,
        loadingMessages,
        loadingRequests,
        loadingRooms,
        roomCache,
        setRoomCache,
        msgInputDOM,
        setMsgInputDOM,
        roomSettingsMenu,
        setRoomSettingsMenu,
        activeTab,
        setActive,
        notifications,
        notifCountType,
        setNotifCountType,
        setNotifications,
        onlineStatus,
        contacts,
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};

// 3. Custom hook for easy access
export const useSocket = () => {
    const context = useContext(SocketContext);
    if (context === undefined) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};


