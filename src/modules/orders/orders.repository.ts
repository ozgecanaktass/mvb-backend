import sql from 'mssql';
import { getSqlPool } from '../../shared/database/azureSql';
import { Order, CreateOrderDTO } from '../../shared/models/Order';

export const orderRepository = {
    // Retrieve all orders from the database
    // parse configuration JSON string back to object
    async findAll(): Promise<Order[]> {
        try {
            const pool = getSqlPool();
            const result = await pool.request().query(`
                SELECT 
                    id, dealer_id as dealerId, customer_name as customerName,
                    configuration, status, created_at as createdAt, updated_at as updatedAt
                FROM orders 
                ORDER BY created_at DESC
            `);
            
            // Return each row from the database
            return result.recordset.map(row => ({
                ...row,
                // Parse the JSON string from SQL back to an object
                configuration: JSON.parse(row.configuration) 
            })) as Order[];
        } catch (error) {
            console.error('[SQL Error] Orders could not be retrieved:', error);
            return [];
        }
    },

    //find the order by id
    async findById(id: number): Promise<Order | undefined> {
        try {
            const pool = getSqlPool();
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
        }
    },

    // create a new order record
    // turn the inserted order with parsed configuration for saving
    async create(orderData: CreateOrderDTO): Promise<Order> {
        const pool = getSqlPool();
        
        // convert the configuration object to a JSON string
        const configString = JSON.stringify(orderData.configuration);

        const result = await pool.request()
            .input('dealerId', sql.BigInt, orderData.dealerId)
            .input('customerName', sql.NVarChar, orderData.customerName)
            .input('configuration', sql.NVarChar(sql.MAX), configString)
            .input('status', sql.NVarChar, 'Pending') // Varsayılan durum
            .query(`
                INSERT INTO orders (dealer_id, customer_name, configuration, status, created_at, updated_at)
                OUTPUT INSERTED.id, INSERTED.created_at as createdAt, INSERTED.updated_at as updatedAt
                VALUES (@dealerId, @customerName, @configuration, @status, GETDATE(), GETDATE())
            `);

        const inserted = result.recordset[0];
        
        // Return the saved data
        return {
            id: inserted.id,
            dealerId: orderData.dealerId,
            customerName: orderData.customerName,
            status: 'Pending',
            configuration: orderData.configuration,
            createdAt: inserted.createdAt,
            updatedAt: inserted.updatedAt
        };
    },
    // update order status
    async updateStatus(id: number, status: string): Promise<void> {
        const pool = getSqlPool();
        await pool.request()
            .input('id', sql.BigInt, id)
            .input('status', sql.NVarChar, status)
            .query(`
                UPDATE orders 
                SET status = @status, updated_at = GETDATE()
                WHERE id = @id
            `);
    }
};