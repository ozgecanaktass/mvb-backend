import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { VisitLog } from '../../shared/models/VisitLog';
// import { mockStore } from '../../shared/database/mockStore'; 
import { AppError } from '../../shared/utils/AppError';
import { analyticsRepository } from './analytics.repository';
import { dealerRepository } from '../dealers/dealers.repository';

const CONFIGURATION_URL = 'https://www.google.com/search?q=eyewear+configurator';

export const trackAndRedirect = async (req: Request, res: Response) => {
    const { linkHash } = req.params;
    
    console.log(`[DEBUG] Request: ${linkHash}`);

    // find dealer by linkHash
    const dealer = await dealerRepository.findByLinkHash(linkHash);

    if (!dealer) {
        console.log("❌ [DEBUG] Failed to find dealer!");
        throw new AppError("Invalid link.", 404);
    }

    console.log(`✅ [DEBUG] Dealer found: ${dealer.name} (ID: ${dealer.id})`);

    const newLog: VisitLog = {
        id: uuidv4(),
        linkHash: linkHash,
        dealerId: dealer.id,
        ip: req.ip || '0.0.0.0',
        userAgent: req.headers['user-agent'] || 'unknown',
        timestamp: new Date()
    };

    // save to cosmos db
    try {
        console.log("⏳ [DEBUG] saving visit log to Cosmos DB...");
        await analyticsRepository.createVisitLog(newLog);
        console.log("✅ [DEBUG] Visit log saved successfully.");
    } catch (error) {
        console.error("❌ [DEBUG] failed to save visit log:", error);
    }

    // cache control headers 
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');

    // redirect to configuration URL
    res.redirect(`${CONFIGURATION_URL}?dealerId=${dealer.id}`);
};

export const getDealerStats = async (req: Request, res: Response) => {
    const dealerId = Number(req.params.dealerId);
    
    console.log(`📊 [DEBUG] analytics request: Dealer ${dealerId}`);

    // fetch visit logs from cosmos db
    const stats = await analyticsRepository.getVisitsByDealerId(dealerId);
    
    console.log(`✅ [DEBUG] record count: ${stats.length}`);

    res.status(200).json({
        success: true,
        dealerId: dealerId,
        totalVisits: stats.length,
        lastVisit: stats.length > 0 ? stats[stats.length - 1].timestamp : null,
        data: stats // return all visit logs !!
    });
};