/*import sql from 'mssql';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connectionString = process.env.AZURE_SQL_CONNECTION_STRING;

if (!connectionString) {
    console.error("❌ ERROR: AZURE_SQL_CONNECTION_STRING is not defined in environment variables");
    console.error("Set it in the .env file");
    process.exit(1);
}

const runSeed = async () => {
    console.log("🔄 Database seeding started...");
    let pool: sql.ConnectionPool | null = null;

    try {
        // Connect to master database to create EyewearDB if it doesn't exist
        const masterConnString = connectionString.replace(/Database=[^;]+/, "Database=master");

        console.log("🔌 Connecting to master database...");
        pool = await sql.connect(masterConnString);

        // create EyewearDB if it doesn't exist
        console.log("🔨 Creating EyewearDB if it doesn't exist...");
        await pool.query(`
            IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'EyewearDB')
            BEGIN
                CREATE DATABASE EyewearDB;
                PRINT 'EyewearDB created.';
            END
        `);

        // Close master connection and connect to EyewearDB
        await pool.close();
        pool = await sql.connect(connectionString);

        console.log("✅ connected to EyewearDB. Creating tables...");

        // create tables if they don't exist
        const createTablesQuery = `
            -- Users Tablosu
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' and xtype='U')
            BEGIN
                CREATE TABLE users (
                    id bigint PRIMARY KEY IDENTITY(1,1),
                    email nvarchar(255) NOT NULL UNIQUE,
                    password_hash nvarchar(512) NOT NULL,
                    name nvarchar(255) NULL,
                    role nvarchar(50) DEFAULT 'producer',
                    dealer_limit int DEFAULT 10,
                    is_active bit DEFAULT 1,
                    created_at datetimeoffset DEFAULT SYSUTCDATETIME(),
                    updated_at datetimeoffset DEFAULT SYSUTCDATETIME()
                );
                PRINT 'Created users table.';
            END

            -- Dealers Tablosu
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
                PRINT 'Created dealers table.';
            END

            -- Orders Tablosu
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
                PRINT 'Created orders table.';
            END
        `;

        await pool.query(createTablesQuery);
        console.log("✅ all tables are created or already exist.");

        // Insert sample data
        console.log("🌱 Inserting sample data...");
        
        // Add admin user if not exists
        const checkUser = await pool.query("SELECT * FROM users WHERE email = 'admin@uretici.com'");
        if (checkUser.recordset.length === 0) {
            await pool.query(`
                INSERT INTO users (email, password_hash, name, role)
                VALUES ('admin@uretici.com', 'admin-sifresi', 'Sistem Yöneticisi', 'superuser');
            `);
            console.log("👤 Admin user added.");
        }

    } catch (error) {
        console.error("❌ Error:", error);
    } finally {
        if (pool) {
            await pool.close();
            console.log("🔌 Connection closed.");
        }
    }
};

runSeed();*/

import sql from 'mssql';
import { CosmosClient } from '@azure/cosmos'; // YENİ: Cosmos SDK
import dotenv from 'dotenv';
import path from 'path';
import https from 'https'; // HTTPS Agent için gerekli

// .env dosyasını yükle
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

console.log(`🔍 Yapılandırma dosyası: ${envPath}`);

// SQL Ayarları
const sqlConfig = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASS || 'TestPassword123@',
    database: 'master',
    server: process.env.DB_SERVER || '127.0.0.1',
    port: 1433,
    options: { encrypt: false, trustServerCertificate: true }
};

// Cosmos Ayarları
const cosmosEndpoint = process.env.COSMOS_ENDPOINT;
const cosmosKey = process.env.COSMOS_KEY;
const cosmosDbId = process.env.COSMOS_DATABASE_ID || 'EyewearDB';
const cosmosContainerId = 'visits';

const runSeed = async () => {
    console.log("🚀 Veritabanı kurulumu (Seed) başlatılıyor...");

    // --- 1. SQL SERVER KURULUMU ---
    try {
        console.log("🔌 [SQL] Sunucuya bağlanılıyor...");
        const pool = await sql.connect(sqlConfig);

        // DB Oluştur
        await pool.query(`
            IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = '${process.env.DB_NAME || 'EyewearDB'}')
            BEGIN
                CREATE DATABASE ${process.env.DB_NAME || 'EyewearDB'};
                PRINT 'SQL Veritabanı oluşturuldu.';
            END
        `);
        
        await pool.close();
        
        // Asıl DB'ye bağlan ve Tabloları oluştur
        const appPool = await sql.connect({ ...sqlConfig, database: process.env.DB_NAME || 'EyewearDB' });
        console.log("✅ [SQL] Veritabanına geçildi. Tablolar kontrol ediliyor...");

        // Tablo Sorguları (Öncekiyle aynı)
        const createTablesQuery = `
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' and xtype='U')
            BEGIN
                CREATE TABLE users (
                    id bigint PRIMARY KEY IDENTITY(1,1),
                    email nvarchar(255) NOT NULL UNIQUE,
                    password_hash nvarchar(512) NOT NULL,
                    name nvarchar(255) NULL,
                    role nvarchar(50) DEFAULT 'producer',
                    dealer_limit int DEFAULT 10,
                    is_active bit DEFAULT 1,
                    created_at datetimeoffset DEFAULT SYSUTCDATETIME(),
                    updated_at datetimeoffset DEFAULT SYSUTCDATETIME()
                );
                PRINT 'Users tablosu hazır.';
            END

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
                PRINT 'Dealers tablosu hazır.';
            END

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
                PRINT 'Orders tablosu hazır.';
            END
        `;
        await appPool.query(createTablesQuery);

        // Admin Ekle
        const checkUser = await appPool.query("SELECT * FROM users WHERE email = 'admin@uretici.com'");
        if (checkUser.recordset.length === 0) {
            await appPool.query(`INSERT INTO users (email, password_hash, name, role) VALUES ('admin@uretici.com', 'admin-sifresi', 'Admin', 'superuser')`);
            console.log("👤 [SQL] Admin kullanıcısı eklendi.");
        }
        
        await appPool.close();
        console.log("✅ [SQL] SQL Server kurulumu tamamlandı.");

    } catch (error) {
        console.error("❌ [SQL Hatası]:", error);
    }

    // --- 2. COSMOS DB KURULUMU (YENİ) ---
    try {
        if (!cosmosEndpoint || !cosmosKey) {
            console.warn("⚠️ [Cosmos] Ayarlar eksik, kurulum atlanıyor.");
        } else {
            console.log("🔌 [Cosmos] Emülatöre bağlanılıyor...");
            
            // DÜZELTME: SSL doğrulamasını devre dışı bırakan Agent ekliyoruz
            const client = new CosmosClient({ 
                endpoint: cosmosEndpoint, 
                key: cosmosKey,
                agent: new https.Agent({
                    rejectUnauthorized: false
                })
            });

            // Veritabanını Oluştur
            const { database } = await client.databases.createIfNotExists({ id: cosmosDbId });
            console.log(`🔨 [Cosmos] Veritabanı '${database.id}' hazır.`);

            // Konteyneri Oluştur (Partition Key: /linkHash)
            const { container } = await database.containers.createIfNotExists({ 
                id: cosmosContainerId, 
                partitionKey: { paths: ['/linkHash'] } 
            });
            console.log(`📦 [Cosmos] Konteyner '${container.id}' hazır.`);
            
            console.log("✅ [Cosmos] Cosmos DB kurulumu tamamlandı.");
        }
    } catch (error) {
        console.error("❌ [Cosmos Hatası]:", error);
    }

    console.log("🚀 KURULUM BİTTİ. 'npm run dev' ile uygulamayı başlatabilirsin.");
};

runSeed();