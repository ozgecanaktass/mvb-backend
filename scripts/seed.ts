import sql from 'mssql';
import { CosmosClient } from '@azure/cosmos';
import dotenv from 'dotenv';
import path from 'path';
import https from 'https';

// Load .env file
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

console.log(`🔍 Configuration file: ${envPath}`);

// SQL Settings
const sqlConfig = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASS || 'TestPassword123@',
    database: 'master',
    server: process.env.DB_SERVER || '127.0.0.1',
    port: 1433,
    options: { encrypt: false, trustServerCertificate: true }
};

// Cosmos Settings
const cosmosEndpoint = process.env.COSMOS_ENDPOINT;
const cosmosKey = process.env.COSMOS_KEY;
const cosmosDbId = process.env.COSMOS_DATABASE_ID || 'EyewearDB';
const cosmosContainerId = 'visits';

const runSeed = async () => {
    console.log("🚀 Starting database seed...");

    // --- 1. SQL SERVER SETUP ---
    try {
        console.log("🔌 [SQL] Connecting to server...");
        const pool = await sql.connect(sqlConfig);

        // Create DB
        await pool.query(`
            IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = '${process.env.DB_NAME || 'EyewearDB'}')
            BEGIN
                CREATE DATABASE ${process.env.DB_NAME || 'EyewearDB'};
                PRINT 'SQL Database created.';
            END
        `);
        
        await pool.close();
        
        // Connect to actual DB
        const appPool = await sql.connect({ ...sqlConfig, database: process.env.DB_NAME || 'EyewearDB' });
        console.log("✅ [SQL] Connected to database. Checking tables...");

        // Create Tables (Order: Dealers -> Users -> Orders -> Appointments)
        const createTablesQuery = `
            -- 1. Dealers Table
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='dealers' and xtype='U')
            BEGIN
                CREATE TABLE dealers (
                    id bigint PRIMARY KEY IDENTITY(1,1),
                    name nvarchar(255) NOT NULL,
                    link_hash nvarchar(128) NOT NULL UNIQUE,
                    is_active bit DEFAULT 1,
                    created_at datetimeoffset DEFAULT SYSUTCDATETIME(),
                    updated_at datetimeoffset DEFAULT SYSUTCDATETIME()
                );
                PRINT 'Dealers table created.';
            END

            -- 2. Users Table
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' and xtype='U')
            BEGIN
                CREATE TABLE users (
                    id bigint PRIMARY KEY IDENTITY(1,1),
                    email nvarchar(255) NOT NULL UNIQUE,
                    password_hash nvarchar(512) NOT NULL,
                    name nvarchar(255) NULL,
                    role nvarchar(50) DEFAULT 'dealer_user',
                    dealer_id bigint NULL REFERENCES dealers(id),
                    dealer_limit int DEFAULT 10,
                    is_active bit DEFAULT 1,
                    created_at datetimeoffset DEFAULT SYSUTCDATETIME(),
                    updated_at datetimeoffset DEFAULT SYSUTCDATETIME()
                );
                PRINT 'Users table created.';
            END

            -- 3. Orders Table
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='orders' and xtype='U')
            BEGIN
                CREATE TABLE orders (
                    id bigint PRIMARY KEY IDENTITY(1,1),
                    dealer_id bigint NOT NULL,
                    customer_name nvarchar(255),
                    configuration nvarchar(max),
                    status nvarchar(50) DEFAULT 'Pending',
                    created_at datetimeoffset DEFAULT SYSUTCDATETIME(),
                    updated_at datetimeoffset DEFAULT SYSUTCDATETIME(),
                    FOREIGN KEY (dealer_id) REFERENCES dealers(id)
                );
                PRINT 'Orders table created.';
            END

            -- 4. Appointments Table (NEW)
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='appointments' and xtype='U')
            BEGIN
                CREATE TABLE appointments (
                    id bigint PRIMARY KEY IDENTITY(1,1),
                    dealer_id bigint NOT NULL,
                    customer_name nvarchar(255) NOT NULL,
                    appointment_date datetimeoffset NOT NULL,
                    type nvarchar(50), -- 'Eye Exam', 'Styling' etc.
                    status nvarchar(50) DEFAULT 'Scheduled',
                    notes nvarchar(max) NULL,
                    created_at datetimeoffset DEFAULT SYSUTCDATETIME(),
                    updated_at datetimeoffset DEFAULT SYSUTCDATETIME(),
                    FOREIGN KEY (dealer_id) REFERENCES dealers(id)
                );
                PRINT 'Appointments table created.';
            END
        `;
        await appPool.query(createTablesQuery);

        // Add Admin User (Seed Data)
        const checkUser = await appPool.query("SELECT * FROM users WHERE email = 'admin@uretici.com'");
        if (checkUser.recordset.length === 0) {
            await appPool.query(`
                INSERT INTO users (email, password_hash, name, role, dealer_id) 
                VALUES ('admin@uretici.com', 'admin-sifresi', 'Admin', 'producer_admin', NULL)
            `);
            console.log("👤 [SQL] Admin user added.");
        }
        
        await appPool.close();
        console.log("✅ [SQL] SQL Server setup completed.");

    } catch (error) {
        console.error("❌ [SQL Error]:", error);
    }

    // --- 2. COSMOS DB SETUP ---
    try {
        if (!cosmosEndpoint || !cosmosKey) {
            console.warn("⚠️ [Cosmos] Settings missing, skipping setup.");
        } else {
            console.log("🔌 [Cosmos] Connecting to emulator...");
            
            const client = new CosmosClient({ 
                endpoint: cosmosEndpoint, 
                key: cosmosKey,
                agent: new https.Agent({
                    rejectUnauthorized: false
                })
            });

            const { database } = await client.databases.createIfNotExists({ id: cosmosDbId });
            console.log(`🔨 [Cosmos] Database '${database.id}' ready.`);

            const { container } = await database.containers.createIfNotExists({ 
                id: cosmosContainerId, 
                partitionKey: { paths: ['/linkHash'] } 
            });
            console.log(`📦 [Cosmos] Container '${container.id}' ready.`);
            
            console.log("✅ [Cosmos] Cosmos DB setup completed.");
        }
    } catch (error) {
        console.error("❌ [Cosmos Error]:", error);
    }

    console.log("🚀 SETUP FINISHED. You can start the app with 'npm run dev'.");
};

runSeed();