import { Router } from "express";
import { getOrders, createOrder, updateOrderStatus } from "./orders.controller";

// can add middlewares here later for auth !!

const router = Router();

router.get("/", getOrders);
router.post("/", createOrder);
router.patch("/:id/status", updateOrderStatus); // update order status /api/v1/orders/5002/status

export default router;