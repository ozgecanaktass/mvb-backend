import sql from 'mssql';
import { getNewConnection } from '../../shared/database/azureSql'; 
import { Dealer } from '../../shared/models/Dealer';

export const dealerRepository = {

    // fetch all dealers from the database
    async findAll(): Promise<Dealer[]> {
        // get new connection
        const pool = await getNewConnection();
        try {
            const result = await pool.request().query(`
                SELECT 
                    id, name, link_hash as currentLinkHash, 
                    is_active as isActive, 
                    created_at as createdAt, updated_at as updatedAt 
                FROM dealers 
                ORDER BY created_at DESC
            `);
            return result.recordset as Dealer[];
        } catch (error) {
            console.error('[SQL Error] Failed to fetch dealers:', error);
            return [];
        } finally {
            pool.close(); 
        }
    },
    /*
    // find dealer by link hash
    async findByLinkHash(linkHash: string): Promise<Dealer | undefined> {
        const pool = await getNewConnection();
        try {
            const result = await pool.request()
                .input('linkHash', sql.NVarChar, linkHash)
                .query(`
                    SELECT 
                        id, name, link_hash as currentLinkHash, 
                        is_active as isActive 
                    FROM dealers 
                    WHERE link_hash = @linkHash
                `);
            return result.recordset[0] as Dealer | undefined;
        } catch (error) {
            console.error('[SQL Error] Dealer not found by hash:', error);
            return undefined;
        } finally {
            pool.close();
        }
    },*/

    // find dealer by link hash
    async findByLinkHash(linkHash: string): Promise<Dealer | undefined> {
        const pool = await getNewConnection();
        try {
            console.log(`🔎 [SQL Repo] Search "${linkHash}"`);

            const result = await pool.request()
                .input('linkHash', sql.NVarChar, linkHash)
                .query(`
                    SELECT 
                        id, name, link_hash as currentLinkHash, 
                        is_active as isActive 
                    FROM dealers 
                    WHERE link_hash = @linkHash
                `);
            
            if (result.recordset[0]) {
                console.log(`✅ [SQL Repo] Found: ${result.recordset[0].name}`);
            } else {
                console.log(`❌ [SQL Repo] No record found with this hash!`);
            }

            return result.recordset[0] as Dealer | undefined;
        } catch (error) {
            console.error('[SQL Error] Dealer not found by hash:', error);
            return undefined;
        } finally {
            pool.close();
        }
    },

    // create new dealer
    async create(dealerData: Dealer): Promise<Dealer> {
        const pool = await getNewConnection();
        try {
            // using parameterized query to prevent SQL Injection
            const result = await pool.request()
                .input('name', sql.NVarChar, dealerData.name)
                .input('linkHash', sql.NVarChar, dealerData.currentLinkHash)
                .input('isActive', sql.Bit, dealerData.isActive ? 1 : 0)
                .query(`
                    INSERT INTO dealers (name, link_hash, is_active, created_at, updated_at)
                    OUTPUT INSERTED.id
                    VALUES (@name, @linkHash, @isActive, GETDATE(), GETDATE())
                `);

            const newId = result.recordset[0].id;
            return { ...dealerData, id: newId };
        } finally {
            pool.close();
        }
    }
};