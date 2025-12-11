import { Request, Response } from "express";
//import { mockStore } from "../../shared/database/mockStore";
import { Order, CreateOrderDTO } from "../../shared/models/Order";
import { AppError } from "../../shared/utils/AppError";
import { count } from "console";
import { orderRepository } from './orders.repository';

// GET / api/v1/orders/:orderId
// in future i will use this to get a specific order by id 
export const getOrders = async (req: Request, res: Response) => {

    try {
        const orders = await orderRepository.findAll();
        return res.status(200).json({
            success: true,
            count: orders.length,
            data: orders
        });
    } catch (error) {
        throw new AppError("Orders could not be retrieved.", 500);
    }
};

// POST / api/v1/orders
export const createOrder = async (req: Request, res: Response) => {
    const {dealerId, customerName, configuration} = req.body as CreateOrderDTO;

    if (!dealerId || !customerName || !configuration) {
        throw new AppError("Missing required fields.", 400);
    }

    try {
        const newOrder = await orderRepository.create({ dealerId, customerName, configuration });
        return res.status(201).json({
            success: true,
            message: "Order saved to Azure SQL successfully.",
            data: newOrder
        });
    } catch (error) {
         console.error(error); 
        throw new AppError("Order could not be created.", 500);
    }
};

// PUT / api/v1/orders/:id/status
export const updateOrderStatus = async(req: Request, res: Response) => {
    const orderId = Number(req.params.id);
    const { status } = req.body;

    try {
        const order = await orderRepository.findById(orderId);
        if (!order) {
            throw new AppError("Order not found.", 404);
        }
        await orderRepository.updateStatus(orderId, status);
        
        return res.status(200).json({
            success: true,
            message: `Order status updated successfully as ${status} (SQL).`
        });
    } catch (error) {
        // If error is AppError, throw it, otherwise throw general error
        if (error instanceof AppError) throw error;
        throw new AppError("Status could not be updated.", 500);
    }
};