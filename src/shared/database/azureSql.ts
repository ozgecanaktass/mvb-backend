import sql from 'mssql';
import { sqlConfig } from '../../config/dbConfig';

// function to get a new SQL connection pool
export const getNewConnection = async (): Promise<sql.ConnectionPool> => {
    try {
        console.log(`🔄 [SQL]: Connecting to -> ${sqlConfig.server} (User: ${sqlConfig.user})`);
        // build the config object for the connection
        const config: sql.config = {
            user: sqlConfig.user!,
            password: sqlConfig.password!,
            server: sqlConfig.server!, 
            database: sqlConfig.database!,
            port: 1433, // Standard SQL Server port
            options: {
                encrypt: false, 
                trustServerCertificate: true, 
                enableArithAbort: true
            },
            pool: {
                max: 10,
                min: 0,
                idleTimeoutMillis: 30000
            }
        };
        const pool = await new sql.ConnectionPool(config).connect();
        
        console.log("✅ [SQL]: Connection established successfully.");
        return pool;
    } catch (error) {
        console.error('❌ [SQL Error] Connection failed:', error);
        throw error; 
    }
};

