import sql from 'mssql';
import { getSqlPool } from '../../shared/database/azureSql';
import { Dealer } from '../../shared/models/Dealer';


// data access layer between azure sql and dealers module
// controller will call these methods and this will interact with the database (sql sorgusu)
export const dealersRepository = {

    async findAll (): Promise<Dealer[]> {
        try {
            const pool = getSqlPool();
            // SQL query to fetch all dealers 
            // list of dealers ordered by creation date descending
            const result = await pool.request().query(`
                SELECT 
                    id, name, link_hash as currentLinkHash, 
                    quota_limit as quotaLimit, is_active as isActive, 
                    created_at as createdAt, updated_at as updatedAt 
                FROM dealers 
                ORDER BY created_at DESC
            `);

            return result.recordset as Dealer[];
        } catch (error) {
            console.error("Error fetching dealers:", error);
            return []; // return an empty array in case of error so that the application can handle it gracefully
        }
    },

    async findByLinkHash(linkHash: string): Promise<Dealer | undefined> {
        try {
            const pool = getSqlPool();
            // prevent SQL injection by using parameterized query 
            const result = await pool.request()
                .input('linkHash', sql.NVarChar, linkHash)
                .query(`
                    SELECT 
                        id, name, link_hash as currentLinkHash, 
                        quota_limit as quotaLimit, is_active as isActive 
                    FROM dealers 
                    WHERE link_hash = @linkHash
                `);
            return result.recordset[0] as Dealer | undefined;
        } catch (error) {
            console.error("Error fetching dealer by link hash:", error);
            return undefined; // return undefined in case of error
        }
    },

    // create a new dealer record
    async create(dealerData: Dealer): Promise<Dealer> {
        const pool = getSqlPool();
        
        const result = await pool.request()
            .input('name', sql.NVarChar, dealerData.name)
            .input('linkHash', sql.NVarChar, dealerData.currentLinkHash)
            .input('quotaLimit', sql.Int, dealerData.quotaLimit)
            .input('isActive', sql.Bit, dealerData.isActive ? 1 : 0)
            .query(`
                INSERT INTO dealers (name, link_hash, quota_limit, is_active, created_at, updated_at)
                OUTPUT INSERTED.id
                VALUES (@name, @linkHash, @quotaLimit, @isActive, GETDATE(), GETDATE())
            `);

        const newId = result.recordset[0].id;
        
        return { ...dealerData, id: newId };
    }
};