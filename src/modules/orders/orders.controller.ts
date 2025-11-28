import { Request, Response } from "express";
import { mockStore } from "../../shared/database/mockStore";
import { Order, CreateOrderDTO } from "../../shared/models/Order";
import { AppError } from "../../shared/utils/AppError";
import { count } from "console";

// GET / api/v1/orders/:orderId
// in future i will use this to get a specific order by id 
export const getOrders = (req: Request, res: Response) => {
    res.status(200).json({
        success : true,
        count: mockStore.orders.length,
        data: mockStore.orders
    });
}

// POST / api/v1/orders
export const createOrder = (req: Request, res: Response) => {
    const {dealerId, customerName, configuration} = req.body as CreateOrderDTO;

    if (!dealerId || !customerName || !configuration) {
        throw new AppError("Missing required fields.", 400);
    }

    // create new order object
    const newOrder: Order = {
        id: 5000 + mockStore.orders.length + 1 ,
        dealerId,
        customerName: customerName || "Guest Customer",
        configuration,
        status: "Pending",
        createdAt: new Date(),
        updatedAt: new Date()
    };

    // save to mockStore
    mockStore.orders.push(newOrder);

    res.status(201).json({
        success: true,
        message: "Order created successfully.",
        data: newOrder
    });
};

export const updateOrderStatus = (req: Request, res: Response) => {
    const orderId = Number(req.params.id);
    const { status } = req.body;

    // Siparişi bul
    const order = mockStore.orders.find(o => o.id === orderId);

    if (!order) {
        throw new AppError("Order not found.", 404);
    }

    // Durumu güncelle
    order.status = status;
    order.updatedAt = new Date();

    res.status(200).json({
        success: true,
        message: `Order status updated successfully as ${status}.`,
        data : order
    });
};