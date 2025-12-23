import { Request, Response } from 'express';
import { CreateOrderDTO, Order } from '../../shared/models/Order';
import { AppError } from '../../shared/utils/AppError';
import { orderRepository } from './orders.repository';

// GET /api/v1/orders
export const getOrders = async (req: Request, res: Response) => {
    try {
        const user = req.user;

        if (!user) {
            throw new AppError("Unauthorized access. User information not found.", 401);
        }

        let orders: Order[] = [];

        // if the user is a producer, fetch all orders
        if (user.role === 'producer_admin') {
            orders = await orderRepository.findAll();
        }
        // dealer only fetches their own orders
        else if (user.dealerId) {
            orders = await orderRepository.findByDealerId(Number(user.dealerId));
        }

        res.status(200).json({
            success: true,
            count: orders.length,
            data: orders
        });
    } catch (error) {
        if (error instanceof AppError) throw error;
        throw new AppError("Orders could not be retrieved.", 500);
    }
};

// POST /api/v1/orders
export const createOrder = async (req: Request, res: Response) => {
    let { dealerId, customerName, configuration } = req.body as CreateOrderDTO;

    const user = req.user;

    if (user && (user.role === 'dealer_admin' || user.role === 'dealer_user')) {
        if (user.dealerId) {
            dealerId = user.dealerId;
        } else {
            throw new AppError("Dealer ID not found.", 400);
        }
    }

    if (!dealerId || !configuration) {
        throw new AppError("Dealer ID and Configuration data are required.", 400);
    }

    try {
        const newOrder = await orderRepository.create({ dealerId, customerName, configuration });

        res.status(201).json({
            success: true,
            message: "Order successfully created.",
            data: newOrder
        });
    } catch (error) {
        throw new AppError("Order could not be created.", 500);
    }
};

// PATCH /api/v1/orders/:id/status
export const updateOrderStatus = async (req: Request, res: Response) => {
    const orderId = Number(req.params.id);
    const { status } = req.body;

    if (!status) {
        throw new AppError("New status must be specified.", 400);
    }

    try {
        const order = await orderRepository.findById(orderId);
        if (!order) {
            throw new AppError("Order not found.", 404);
        }

        await orderRepository.updateStatus(orderId, status);

        res.status(200).json({
            success: true,
            message: `Order status updated to '${status}'.`
        });
    } catch (error) {
        if (error instanceof AppError) throw error;
        throw new AppError("Status could not be updated.", 500);
    }
};