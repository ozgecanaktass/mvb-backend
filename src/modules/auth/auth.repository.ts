import sql from 'mssql';
import { getSqlPool } from '../../shared/database/azureSql';
import { User } from '../../shared/models/User';

export const authRepository = {
    // Fİnd user by email for authentication
    async findByEmail(email: string): Promise<User | undefined> {
        try {
            const pool = getSqlPool();
            
            const result = await pool.request()
                .input('email', sql.NVarChar, email)
                .query(`
                    SELECT 
                        id, email, password_hash as passwordHash, 
                        name, role, is_active as isActive, 
                        created_at as createdAt, updated_at as updatedAt
                    FROM users 
                    WHERE email = @email
                `);
                
            return result.recordset[0] as User | undefined;
        } catch (error) {
            console.error('[SQL Hatası] Kullanıcı bulunamadı:', error);
            return undefined;
        }
    },

    // create a new user record
    async create(user: User): Promise<User> {
        const pool = getSqlPool();
        
        const result = await pool.request()
            .input('email', sql.NVarChar, user.email)
            .input('passwordHash', sql.NVarChar, user.passwordHash)
            .input('name', sql.NVarChar, user.name)
            .input('role', sql.NVarChar, user.role)
            .input('isActive', sql.Bit, user.isActive ? 1 : 0)
            .query(`
                INSERT INTO users (email, password_hash, name, role, is_active, created_at, updated_at)
                OUTPUT INSERTED.id
                VALUES (@email, @passwordHash, @name, @role, @isActive, GETDATE(), GETDATE())
            `);

        const newId = result.recordset[0].id;
        return { ...user, id: newId };
    }
};