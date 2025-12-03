import sql from 'mssql';
import { sqlConfig } from '../../config/dbConfig';

// singleton pattern for SQL connection pool
let pool: sql.ConnectionPool | null = null;

export const connectToSql = async () => {
    try{
        if(!sqlConfig.connectionString){
            console.warn("SQL connection string is not defined.");
            return null;
    }
    console.log("Connecting to Azure SQL Database...");
    pool = await sql.connect(sqlConfig.connectionString);
    console.log("Connected to Azure SQL Database.");
    return pool;
    } catch (error) {
        console.error("Error connecting to Azure SQL Database:", error);
        return null;
    }
};

export const getSqlPool = (): sql.ConnectionPool => {
    if (!pool) {
        throw new Error("SQL Connection Pool is not initialized. Call connectToSql first.");
    }
    return pool;
};