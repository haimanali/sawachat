import React, { createContext, useContext, useEffect, useRef, ReactNode, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { IPayloadInterface, IPayloadRequestType, IPayloadResponseType } from '../interfaces/payload/EPaylaod';
import { initKey } from '../services/initKey'
import { msgDecryption } from '../services/msgDecryption'
import { IMessagePublic } from '../interfaces/public/IMessagePublic'
import { IRequestPublic } from '../interfaces/public/IRequestPublic'
import { IRoomPublic } from '../interfaces/public/IRoomPublic'
import { IClientPublic } from '../interfaces/public/IClientPublic'
import { NavigateFunction } from "react-router-dom";
import { ISocketContext } from '../interfaces/context/ISocketContext';
import { IRoomCache } from '../interfaces/UI/IRoomCache';



const SocketContext = createContext<ISocketContext | undefined>(undefined);

export const SocketProvider = ({ children, userState, status, navigate, showToast }: { children: ReactNode, userState: IClientPublic, status: "authorized" | "loading", navigate: NavigateFunction, showToast(msg: string): void }) => {


    const socketRef = useRef<Socket | null>(null);

    const [rooms, setRooms] = useState<IRoomPublic[]>([]);
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


    useEffect(() => {
        const updateActivity = () => { 
            last_activity.current = Date.now();

            if (!socketRef.current?.active && !socketRef.current?.connected)
            {
                socketRef.current?.connect();
                showToast("welcome back!");
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
        const interval = setInterval( () => {

            const idle_time = Date.now() - last_activity.current;
            const THREE_HOURS = 1000 * 60 * 60 * 3;
    
            if (socketRef.current?.connected && idle_time < THREE_HOURS && document.visibilityState === "visible")
            {
                socketRef.current.emit("message");
            }
            else
            {
                showToast("disconneted due to long inactivity");
                socketRef.current?.disconnect();
            }
            
        }, 1000 * 60 * 15);

        return () => { clearInterval(interval) };

    }, [socketRef.current]);


    useEffect(() => {

        if (status !== "authorized")
            return;

        if (!socketRef.current) {
            socketRef.current = io("http://localhost:3000", {
                withCredentials: true,
                autoConnect: true,
            });

            const ws = socketRef.current;


            ws.on(IPayloadResponseType.ONLOAD_ROOMS, (response) => {
                const payload: IPayloadInterface<IRoomPublic[]> = response.payload;
                const room_items: IRoomPublic[] = payload.data!;
                setLoadingRooms(false);

                if (room_items.length === 0) {
                    setHasMoreRooms(false);
                    return;
                }

                setRooms((prev) => {
                    const existing_ids = new Set(prev.map(room => room.public_id));
                    const new_rooms = room_items.filter((room) => !existing_ids.has(room.public_id));

                    return [...new_rooms, ...prev];
                });

                setActiveRoomSetup(payload.data![0]);

                rooms_cursor.current = room_items[room_items.length - 1].created_at;

                if (room_items.length < IPayloadRequestType.LIMIT) {
                    setHasMoreRooms(false);
                    return;
                }
            });

            ws.on(IPayloadResponseType.ONLOAD_REQUESTS, (response) => {
                const payload: IPayloadInterface<IRequestPublic[]> = response.payload;
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

            ws.on(IPayloadResponseType.ONLOAD_MESSAGES, async (response) => {
                const payload: IPayloadInterface<IMessagePublic[]> = response.payload;
                const encmessage_items: IMessagePublic[] = payload.data!;
                setLoadingMessages(false);

                if (encmessage_items.length === 0) {
                    setHasMoreMessages(false);
                    return;
                }


                const crypto_key = await initKey(activeRoomRef.current!.enc_key);

                const decrpyt_messages = await Promise.all(encmessage_items.map(async (enc_message) => {

                    const decrpyted_text = await msgDecryption(enc_message.content, crypto_key, enc_message.iv);

                    return {
                        ...enc_message,
                        content: decrpyted_text,
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

            ws.on(IPayloadResponseType.ONSEND_MESSAGE, async (response) => {
                const payload: IPayloadInterface<{ enc_message: IMessagePublic, iv: string }> = response.payload;

                const enc_message = payload.data!.enc_message;
                const iv = payload.data!.iv;

                if (enc_message.room_public_id !== activeRoomRef.current?.public_id)
                    return;

                const crypto_key = await initKey(activeRoomRef.current!.enc_key);
                const dercrypted_text = await msgDecryption(enc_message.content, crypto_key, iv);

                let message: IMessagePublic =
                {
                    ...enc_message,
                    is_sent: true,
                    is_delivered: false,
                    is_read: false,
                    content: dercrypted_text,
                }

                setMessages((prev) => [...prev, message]);

                setRoomCache((prev) => {
                    const curr_room = prev[enc_message.room_public_id];

                    if (!curr_room)
                        return prev;

                    return {
                        ...prev,
                        [enc_message.room_public_id]: {
                            ...curr_room,
                            messages: [...curr_room.messages, message],
                        },
                    };
                });


            });

            ws.on(IPayloadResponseType.ONRECEIVE_MESSAGE, async (response) => {
                const payload: IPayloadInterface<{ enc_message: IMessagePublic, iv: string }> = response.payload;
                const enc_message = payload.data!.enc_message;

                const request_payload = {
                    type: IPayloadRequestType.MESSAGE_RECEIVED,
                    payload: {
                        msg_public_id: enc_message.public_id,
                        room_public_id: enc_message.room_public_id,
                        s_username: enc_message.username,
                        is_delivered: true,
                    },
                };

                ws.emit("message", request_payload);

                setRoomCache((prev) => {
                    const curr_room = prev[enc_message.room_public_id];

                    if (!curr_room)
                        return prev;

                    return {
                        ...prev,
                        [enc_message.room_public_id]: {
                            ...curr_room,
                            messages: [...curr_room.messages, message],
                        },
                    };
                });

                if (enc_message.room_public_id !== activeRoomRef.current?.public_id)
                    return;


                const iv = payload.data!.iv;

                const crypto_key = await initKey(activeRoomRef.current!.enc_key);
                const dercrypted_text = await msgDecryption(enc_message.content, crypto_key, iv);

                let message: IMessagePublic =
                {
                    ...enc_message,
                    is_sent: true,
                    is_delivered: true,
                    is_read: false,
                    content: dercrypted_text,
                }

                setMessages((prev) => [...prev, message]);


            });

            ws.on(IPayloadResponseType.ONMESSAGE_RECEIVED, (response) => {
                const payload: IPayloadInterface<{ msg_public_id: string, room_public_id: string, is_delivered: boolean }> = response.payload;

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

            ws.on(IPayloadResponseType.ONSEND_REQUEST, (response) => {
                const payload: IPayloadInterface<IRequestPublic> = response.payload;

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


            ws.on(IPayloadResponseType.ONRECEIVE_REQUEST, (response) => {

                const payload: IPayloadInterface<IRequestPublic> = response.payload;

                setRequests(prev => {
                    if (prev.some(req => req.public_id === payload.data!.public_id))
                        return prev;

                    return [payload.data!, ...prev];
                });
            });

            ws.on(IPayloadResponseType.ONVERDICT_REQUEST, (response) => {

                const payload: IPayloadInterface<string> = response.payload;

                setRequests(prev => prev.filter(req => req.public_id !== payload.data!));

                showToast(payload.log_message);
            });

            ws.on(IPayloadResponseType.ONCREATE_CONTACT, (response) => {
                const payload: IPayloadInterface<IRoomPublic> = response.payload;

                setRooms(prev => {
                    if (prev.some(room => room.public_id === payload.data!.public_id))
                        return prev;

                    return [payload.data!, ...prev];
                });
            });

            ws.on(IPayloadResponseType.ONDELETE_CONTACT, (response) => {
                const payload: IPayloadInterface = response.payload;
                showToast(payload.log_message);

                setRoomCache((prev) => {
                    const { [activeRoomRef.current!.public_id]: _, ...rest } = prev;
                    return rest;
                });

                setRooms((prev) => prev.filter(room => room.public_id !== activeRoomRef.current!.public_id));
                setActiveRoomSetup(rooms.length <= 0 ? null : rooms[rooms.length - 1]);
            });

            ws.on(IPayloadResponseType.ONDEACTIVATE_CONTACT, (response) => {
                const payload: IPayloadInterface<{ room_public_id: string }> = response.payload;

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

            ws.on(IPayloadResponseType.ONREJOIN_REQUEST, (response) => {
                const payload: IPayloadInterface = response.payload;

                showToast(payload.log_message);
            });

            ws.on(IPayloadResponseType.ONRECEIVE_REJOIN, (response) => {
                const payload: IPayloadInterface<IRequestPublic> = response.payload;
                if (!payload.success)
                    return; 1

                setRequests(prev => {
                    if (prev.some(req => req.public_id === payload.data!.public_id))
                        return prev;

                    return [payload.data!, ...prev];
                });
            });

            ws.on(IPayloadResponseType.ONVERDICT_REJOIN, (response) => {
                const payload: IPayloadInterface<{ req_public_id: string, room: IRoomPublic }> = response.payload;
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

            ws.on(IPayloadResponseType.ONACTIVATE_CONTACT, (response) => {
                const payload: IPayloadInterface<{ room_public_id: string }> = response.payload;

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


            ws.on("connect", () => {

                ws.emit("message", { type: IPayloadRequestType.DELIVER_RECEIVED_MESSAGES });

                const request_payload1 = {
                    type: IPayloadRequestType.LOAD_ROOMS,
                    payload: {
                        cursor: null,
                    },
                };

                ws.emit("message", request_payload1);

                const request_payload2 = {
                    type: IPayloadRequestType.LOAD_REQUESTS,
                    payload: {
                        cursor: null,
                    },
                };

                ws.emit("message", request_payload2);
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


