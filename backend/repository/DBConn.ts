//sudo systemctl start mysql *start db on terminal*



import mysql, { ResultSetHeader } from 'mysql2/promise'
import { IDBQuery, IDBUpdate } from '../responseFormat.js';

export class DBConn
{
    public static getInstance() : DBConn
    {
        if (DBConn.instance)
            return DBConn.instance;


        DBConn.instance = new DBConn();
        return DBConn.instance;
    }

    private pool : mysql.Pool;
    private static instance : DBConn;
    private constructor ()
    {
        this.pool = mysql.createPool({
            host: 'localhost',
            user: 'root',
            password: 'SawaChat10@', 
            database: 'sawachat',
            waitForConnections: true,
            connectionLimit: 10
        });
    }
    public async executeUpdate(sql : string, params :any[]) : Promise<IDBUpdate>{
        const [result] = await this.pool.execute(sql, params) as [ResultSetHeader, any[]];
        return {affectedRows : result.affectedRows, insertId : result.insertId};
    }

    public async executeQuery<T> (sql : string, params :any[]) : Promise<IDBQuery<T>>{
        const [result] = await this.pool.execute(sql, params) as [T[] , any[]];
        return {data : result, count : result.length};
    }
}