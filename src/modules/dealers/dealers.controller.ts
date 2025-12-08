import { Request, Response } from 'express';
import { dealerDatabase } from '../../shared/database/mockStore';
import { DealerCreateDTO, Dealer } from '../../shared/models/Dealer';
import { v4 as uuidv4 } from 'uuid'; // for creating unique link hashes
//import { dealersRepository } from './dealers.repository';

// (GET /api/v1/dealers)
export const getDealers = (req: Request, res: Response) => {
    // Azure SQL integration example (commented out for now)
    /*
    const dealers = await dealerRepository.findAll();
    res.status(200).json({
        success: true,
        data: dealers
    });
    return;
    */

    // return all dealers from the mock database
    res.status(200).json({
        success: true,
        data: dealerDatabase
    });
};

// (POST /api/v1/dealers)
export const createDealer = async (req: Request, res: Response) => {
    //const { v4: uuidv4 } = await import('uuid');
    const { name} = req.body as DealerCreateDTO;

    if (!name) {
        return res.status(400).json({ success: false, message: "Dealer name is required." });
    }

    const newDealer: Dealer = {
        id: dealerDatabase.length + 1, // simple ID generation
        name,
        currentLinkHash: uuidv4(), // generate random secure hash
        isActive: true,
        createdAt: new Date()
    };

    /*
    const savedDealer = await dealerRepository.create(newDealer);
    res.status(201).json({
        success: true,
        message: "Dealer created successfully.",
        data: savedDealer
    });
    return;
    */

    // Add to mock database
    dealerDatabase.push(newDealer);

    res.status(201).json({
        success: true,
        message: "Dealer created successfully.",
        data: newDealer
    });
};