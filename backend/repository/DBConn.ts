//sudo systemctl start mysql *start db on terminal*

import mysql, { ResultSetHeader } from 'mysql2/promise'
import { IDBQuery, IDBUpdate } from '../responseFormat.js';
import { AsyncLocalStorage } from 'node:async_hooks';

export class DBConn
{
    public static getInstance() : DBConn
    {
        if (DBConn.instance)
            return DBConn.instance;


        DBConn.instance = new DBConn();
        return DBConn.instance;
    }
    private static instance : DBConn;

    private static conn_pools = new AsyncLocalStorage<mysql.PoolConnection>();
    private static pool : mysql.Pool;
    
    private constructor ()
    {
        DBConn.pool = mysql.createPool({
            host: 'localhost',
            user: 'root',
            password: 'SawaChat10@', //must change can't hard code it..
            database: 'sawachat',

            typeCast : (field, next) => {  
                if (field.type === "JSON")
                {
                    const val = field.string("utf8");
                    return val ? JSON.parse(val) : null; 
                }

                return next();
            },

            waitForConnections: true,
            connectionLimit: 10
        });
    }

    public static async runTransaction(conn : mysql.PoolConnection, work : () => Promise<void>) : Promise<void>
    {
        return await DBConn.conn_pools.run(conn, work);
    }

    public static async beginTransaction() : Promise<mysql.PoolConnection>
    {
        const conn = await DBConn.pool.getConnection();
        conn.beginTransaction();
        return conn;
    }

    public async executeUpdate(sql : string, params :any[]) : Promise<IDBUpdate>{

        const curr_conn = DBConn.conn_pools.getStore() || DBConn.pool;

        const [result] = await curr_conn.execute(sql, params) as [ResultSetHeader, any[]];
        return {affectedRows : result.affectedRows, insertId : result.insertId};
    }

    public async executeQuery<T>(sql: string, params: any[]): Promise<IDBQuery<T>> {
        const curr_conn = DBConn.conn_pools.getStore() || DBConn.pool;

        const [result] = await curr_conn.execute(sql, params) as [T[], any[]];
        
        return { data: result, count: result.length };
    }
}