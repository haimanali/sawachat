//sudo systemctl start mysql *start db on terminal*
import mysql from 'mysql2/promise'
import { toUpperCase } from 'zod';

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
    public async execute (){

    }
}