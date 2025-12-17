import sql from 'mssql';
import { CosmosClient } from '@azure/cosmos';
import dotenv from 'dotenv';
import path from 'path';
import https from 'https';

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
        
        // Asıl DB'ye bağlan
        const appPool = await sql.connect({ ...sqlConfig, database: process.env.DB_NAME || 'EyewearDB' });
        console.log("✅ [SQL] Veritabanına geçildi. Tablolar kontrol ediliyor...");

        // Tabloları Oluştur (Sıralama Düzeltildi: Dealers -> Users -> Orders)
        const createTablesQuery = `
            -- 1. Dealers Tablosu (Önce bunu oluşturuyoruz çünkü Users buna bağlı)
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
                PRINT 'Dealers tablosu oluşturuldu.';
            END

            -- 2. Users Tablosu (Dealers tablosuna referans verdiği için ondan sonra gelmeli)
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' and xtype='U')
            BEGIN
                CREATE TABLE users (
                    id bigint PRIMARY KEY IDENTITY(1,1),
                    email nvarchar(255) NOT NULL UNIQUE,
                    password_hash nvarchar(512) NOT NULL,
                    name nvarchar(255) NULL,
                    role nvarchar(50) DEFAULT 'dealer_user',
                    dealer_id bigint NULL REFERENCES dealers(id), -- FK hatası vermemesi için dealers tablosu var olmalı
                    dealer_limit int DEFAULT 10,
                    is_active bit DEFAULT 1,
                    created_at datetimeoffset DEFAULT SYSUTCDATETIME(),
                    updated_at datetimeoffset DEFAULT SYSUTCDATETIME()
                );
                PRINT 'Users tablosu oluşturuldu.';
            END

            -- 3. Orders Tablosu
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
                PRINT 'Orders tablosu oluşturuldu.';
            END
        `;
        await appPool.query(createTablesQuery);

        // Admin Ekle
        const checkUser = await appPool.query("SELECT * FROM users WHERE email = 'admin@uretici.com'");
        if (checkUser.recordset.length === 0) {
            // Admin, dealer_id'si NULL olan bir kullanıcıdır.
            await appPool.query(`
                INSERT INTO users (email, password_hash, name, role, dealer_id) 
                VALUES ('admin@uretici.com', 'admin-sifresi', 'Admin', 'producer_admin', NULL)
            `);
            console.log("👤 [SQL] Admin kullanıcısı eklendi.");
        }
        
        await appPool.close();
        console.log("✅ [SQL] SQL Server kurulumu tamamlandı.");

    } catch (error) {
        console.error("❌ [SQL Hatası]:", error);
    }

    // --- 2. COSMOS DB KURULUMU ---
    try {
        if (!cosmosEndpoint || !cosmosKey) {
            console.warn("⚠️ [Cosmos] Ayarlar eksik, kurulum atlanıyor.");
        } else {
            console.log("🔌 [Cosmos] Emülatöre bağlanılıyor...");
            
            const client = new CosmosClient({ 
                endpoint: cosmosEndpoint, 
                key: cosmosKey,
                agent: new https.Agent({
                    rejectUnauthorized: false
                })
            });

            const { database } = await client.databases.createIfNotExists({ id: cosmosDbId });
            console.log(`🔨 [Cosmos] Veritabanı '${database.id}' hazır.`);

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