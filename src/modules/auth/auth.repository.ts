import sql from 'mssql';
import { getNewConnection } from '../../shared/database/azureSql'; // Use pool-less connection
import { User } from '../../shared/models/User';

// repository for user authentication and management
export const authRepository = {
    async findByEmail(email: string): Promise<User | undefined> {
        const pool = await getNewConnection();
        try {
            const result = await pool.request()
                .input('email', sql.NVarChar, email)
                .query(`
                    SELECT 
                        id, 
                        email, 
                        password_hash as passwordHash, 
                        name, 
                        role, 
                        dealer_limit as dealerLimit, 
                        is_active as isActive, 
                        created_at as createdAt, 
                        updated_at as updatedAt
                    FROM users 
                    WHERE email = @email
                `);
            
            // log the result for debugging
            console.log('🔍 [Repo] SQL Result:', result.recordset[0]);

            return result.recordset[0] as User | undefined;
        } catch (error) {
            console.error('[SQL Error] User not found:', error);
            return undefined;
        } finally {
            pool.close();
        }
    },

    // create new user
    async create(user: User): Promise<User> {
        const pool = await getNewConnection();
        try {
            const result = await pool.request()
                .input('email', sql.NVarChar, user.email)
                .input('passwordHash', sql.NVarChar, user.passwordHash)
                .input('name', sql.NVarChar, user.name)
                .input('role', sql.NVarChar, user.role)
                // Use default 10 if dealerLimit is not provided
                .input('dealerLimit', sql.Int, user.dealerLimit || 10) 
                .input('isActive', sql.Bit, user.isActive ? 1 : 0)
                .query(`
                    INSERT INTO users (email, password_hash, name, role, dealer_limit, is_active, created_at, updated_at)
                    OUTPUT INSERTED.id
                    VALUES (@email, @passwordHash, @name, @role, @dealerLimit, @isActive, GETDATE(), GETDATE())
                `);

            const newId = result.recordset[0].id;
            return { ...user, id: newId };
        } catch (error) {
            console.error('[SQL Error] Failed to create user:', error);
            throw error; 
        } finally {
            pool.close();
        }
    }
};