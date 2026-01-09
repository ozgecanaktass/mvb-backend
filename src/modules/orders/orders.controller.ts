import { Request, Response } from 'express';
import { CreateOrderDTO, Order } from '../../shared/models/Order';
import { AppError } from '../../shared/utils/AppError';
import { orderRepository } from './orders.repository';

/**
 * Retrieves orders based on the authenticated user's role.
 * Producer Admin gets all orders; Dealer Users get only their own orders.
 */
export const getOrders = async (req: Request, res: Response) => {
    try {
        const user = req.user;

        if (!user) {
            throw new AppError("Unauthorized access. User information not found.", 401);
        }

        let orders: Order[] = [];

        // Producer Admin: Fetch all orders
        if (user.role === 'producer_admin') {
            orders = await orderRepository.findAll();
        }
        // Dealer Admin or Staff: Fetch orders only for their specific Dealer
        else if (user.dealerId) {
            orders = await orderRepository.findByDealerId(user.dealerId);
        }

        res.status(200).json({
            success: true,
            count: orders.length,
            data: orders
        });
    } catch (error) {
        if (error instanceof AppError) throw error;
        throw new AppError("Failed to retrieve orders.", 500);
    }
};

/**
 * Creates a new order for a specific dealer.
 */
export const createOrder = async (req: Request, res: Response) => {
    let { dealerId, customerName, configuration } = req.body as CreateOrderDTO;

    const user = req.user;

    // Security: Enforce dealerId for Dealer Admin or User roles
    if (user && (user.role === 'dealer_admin' || user.role === 'dealer_user')) {
        if (user.dealerId) {
            dealerId = user.dealerId;
        } else {
            throw new AppError("Dealer ID not found for user.", 400);
        }
    }

    if (!dealerId || !configuration) {
        throw new AppError("Dealer ID and Configuration data are required.", 400);
    }

    try {
        const newOrder = await orderRepository.create({ dealerId, customerName, configuration });

        res.status(201).json({
            success: true,
            message: "Order created successfully.",
            data: newOrder
        });
    } catch (error) {
        throw new AppError("Failed to create order.", 500);
    }
};

/**
 * Updates the status of an existing order.
 */
export const updateOrderStatus = async (req: Request, res: Response) => {
    const orderId = req.params.id;
    const { status } = req.body;

    if (!status) {
        throw new AppError("New status is required.", 400);
    }

    try {
        // Check if order exists
        const order = await orderRepository.findById(orderId);
        if (!order) {
            throw new AppError("Order not found.", 404);
        }

        // Update status
        await orderRepository.updateStatus(orderId, status);

        res.status(200).json({
            success: true,
            message: `Order status updated to '${status}'.`
        });
    } catch (error) {
        if (error instanceof AppError) throw error;
        throw new AppError("Failed to update status.", 500);
    }
};