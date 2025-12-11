import sql from 'mssql';
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

runSeed();