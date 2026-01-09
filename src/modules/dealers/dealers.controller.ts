import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { DealerCreateDTO, Dealer } from '../../shared/models/Dealer';
import { AppError } from '../../shared/utils/AppError';
import { dealerRepository } from './dealers.repository';

// GET /api/v1/dealers
export const getDealers = async (req: Request, res: Response) => {
    try {
        const dealers = await dealerRepository.findAll();

        res.status(200).json({
            success: true,
            count: dealers.length,
            data: dealers
        });
    } catch (error) {
        throw new AppError("Failed to retrieve dealers.", 500);
    }
};

// POST /api/v1/dealers
export const createDealer = async (req: Request, res: Response) => {
    const { name } = req.body as DealerCreateDTO;

    if (!name) {
        throw new AppError("Dealer name is required.", 400);
    }

    const newDealer: Dealer = {
        id: 0,
        name,
        currentLinkHash: uuidv4(),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    try {
        const savedDealer = await dealerRepository.create(newDealer);

        res.status(201).json({
            success: true,
            message: "Dealer successfully saved. (Firebase)",
            data: savedDealer
        });
    } catch (error) {
        throw new AppError("Failed to create dealer.", 500);
    }
};