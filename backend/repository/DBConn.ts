//sudo systemctl start mysql *start db on terminal*

import mysql, { ResultSetHeader } from 'mysql2/promise'
import { IDBQuery, IDBUpdate } from '../responseFormat.js';
import { AsyncLocalStorage } from 'node:async_hooks';

// this is the core database connection class
// it uses a pool to manage multiple mysql connections at once
export class DBConn {
    public static getInstance(): DBConn {
        if (DBConn.instance)
            return DBConn.instance;


        DBConn.instance = new DBConn();
        return DBConn.instance;
    }
    private static instance: DBConn;

    private static conn_pools = new AsyncLocalStorage<mysql.PoolConnection>();
    private static pool: mysql.Pool;

    private constructor() {
        // we connect to the local sawachat database on wamp
        DBConn.pool = mysql.createPool({
            host: 'localhost',
            user: 'root',
            password: 'SawaChat10@', // local development password
            database: 'sawachat',

            typeCast: (field, next) => {

                if (["STRING", "VAR_STRING", "BINARY", "VARBINARY", "JSON"].includes(field.type)) {
                    const val = field.string("utf8");
                    if (!val) return null;

                    const cleanVal = val.replace(/^[\s\0]+|[\s\0]+$/g, "");

                    if (field.type === "JSON") {
                        return JSON.parse(cleanVal);
                    }
                    return cleanVal;
                }

                return next();
            },

            waitForConnections: true,
            connectionLimit: 50,
        });
    }

    // this helps us run a group of sql commands as a single transaction
    public static async runTransaction(conn: mysql.PoolConnection, work: () => Promise<void>): Promise<void> {
        return await DBConn.conn_pools.run(conn, work);
    }

    // this starts a new transaction
    public static async beginTransaction(): Promise<mysql.PoolConnection> {
        const conn = await DBConn.pool.getConnection();
        conn.beginTransaction();
        return conn;
    }

    // this function handles sql updates like insert or update
    public async executeUpdate(sql: string, params: any[]): Promise<IDBUpdate> {

        const curr_conn = DBConn.conn_pools.getStore() || DBConn.pool;

        const [result] = await curr_conn.execute(sql, params) as [ResultSetHeader, any[]];
        return { affectedRows: result.affectedRows, insertId: result.insertId };
    }

    // this function handles sql queries like select
    public async executeQuery<T>(sql: string, params: any[]): Promise<IDBQuery<T>> {
        const curr_conn = DBConn.conn_pools.getStore() || DBConn.pool;

        const [result] = await curr_conn.execute(sql, params) as [T[], any[]];

        return { data: result, count: result.length };
    }
}
