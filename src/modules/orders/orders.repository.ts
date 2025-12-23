import sql from 'mssql';
import { getNewConnection } from '../../shared/database/azureSql'; // Use pool-less connection
import { Order, CreateOrderDTO } from '../../shared/models/Order';

export const orderRepository = {

    /**
     * retrieve all orders from the database -> for producer admins
     */
    async findAll(): Promise<Order[]> {
        const pool = await getNewConnection();
        try {
            const result = await pool.request().query(`
                SELECT 
                    id, dealer_id as dealerId, customer_name as customerName,
                    configuration, status, created_at as createdAt, updated_at as updatedAt
                FROM orders 
                ORDER BY created_at DESC
            `);

            return result.recordset.map(row => ({
                ...row,
                configuration: JSON.parse(row.configuration)
            })) as Order[];
        } catch (error) {
            console.error('[SQL Error] Failed to fetch all orders:', error);
            return [];
        } finally {
            pool.close();
        }
    },

    // Retrieve orders for a specific dealer -> used for dealer users/admins
    async findByDealerId(dealerId: number): Promise<Order[]> {
        const pool = await getNewConnection();
        try {
            const result = await pool.request()
                .input('dealerId', sql.BigInt, dealerId)
                .query(`
                    SELECT 
                        id, dealer_id as dealerId, customer_name as customerName,
                        configuration, status, created_at as createdAt, updated_at as updatedAt
                    FROM orders 
                    WHERE dealer_id = @dealerId
                    ORDER BY created_at DESC
                `);

            return result.recordset.map(row => ({
                ...row,
                configuration: JSON.parse(row.configuration)
            })) as Order[];
        } catch (error) {
            console.error('[SQL Error] Failed to fetch dealer orders:', error);
            return [];
        } finally {
            pool.close();
        }
    },

    /**
     * Find a single order by ID.
     */
    async findById(id: number): Promise<Order | undefined> {
        const pool = await getNewConnection();
        try {
            const result = await pool.request()
                .input('id', sql.BigInt, id)
                .query(`
                    SELECT 
                        id, dealer_id as dealerId, customer_name as customerName,
                        configuration, status, created_at as createdAt, updated_at as updatedAt
                    FROM orders 
                    WHERE id = @id
                `);

            if (result.recordset.length === 0) return undefined;

            const row = result.recordset[0];
            return {
                ...row,
                configuration: JSON.parse(row.configuration)
            } as Order;
        } catch (error) {
            console.error('[SQL Error] Order not found:', error);
            return undefined;
        } finally {
            pool.close();
        }
    },

    /**
     * Create a new order.
     */
    async create(orderData: CreateOrderDTO): Promise<Order> {
        const pool = await getNewConnection();
        try {
            const configString = JSON.stringify(orderData.configuration);

            const result = await pool.request()
                .input('dealerId', sql.BigInt, orderData.dealerId)
                .input('customerName', sql.NVarChar, orderData.customerName)
                .input('configuration', sql.NVarChar(sql.MAX), configString)
                .input('status', sql.NVarChar, 'Pending')
                .query(`
                    INSERT INTO orders (dealer_id, customer_name, configuration, status, created_at, updated_at)
                    OUTPUT INSERTED.id, INSERTED.created_at as createdAt, INSERTED.updated_at as updatedAt
                    VALUES (@dealerId, @customerName, @configuration, @status, GETDATE(), GETDATE())
                `);

            const inserted = result.recordset[0];

            return {
                id: inserted.id,
                dealerId: orderData.dealerId,
                customerName: orderData.customerName,
                status: 'Pending',
                configuration: orderData.configuration,
                createdAt: inserted.createdAt,
                updatedAt: inserted.updatedAt
            };
        } finally {
            pool.close();
        }
    },

    /**
     * Update order status.
     */
    async updateStatus(id: number, status: string): Promise<void> {
        const pool = await getNewConnection();
        try {
            await pool.request()
                .input('id', sql.BigInt, id)
                .input('status', sql.NVarChar, status)
                .query(`
                    UPDATE orders 
                    SET status = @status, updated_at = GETDATE()
                    WHERE id = @id
                `);
        } finally {
            pool.close();
        }
    }
};