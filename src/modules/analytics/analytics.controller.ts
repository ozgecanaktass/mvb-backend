import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { VisitLog } from '../../shared/models/VisitLog';
import { mockStore } from '../../shared/database/mockStore';
import { AppError } from '../../shared/utils/AppError';
import { analyticsRepository } from './analytics.repository';
import { dealerRepository } from '../dealers/dealers.repository';

const CONFIGURATION_URL = 'https://www.google.com/search?q=eyewear+configurator';

// GET /l/:linkHash
export const trackAndRedirect = async (req: Request, res: Response) => {
    const { linkHash } = req.params;
    const clientIp = req.ip || '0.0.0.0';
    
    // 1. Find Dealer (from SQL Database)
    let dealer;
    try {
        dealer = await dealerRepository.findByLinkHash(linkHash);
    } catch (error) {
        console.error('[Analytics] Dealer finding error:', error);
        throw new AppError("Error finding dealer.", 500);
    }

    if (!dealer) {
        throw new AppError("Invalid link. Dealer not found.", 404);
    }

    // Spam Protection
    const isDuplicate = mockStore.visitLogs.some(log => {
        const timeDiff = new Date().getTime() - log.timestamp.getTime();
        return log.linkHash === linkHash && log.ip === clientIp && timeDiff < 5000;
    });

    const newLog: VisitLog = {
        id: uuidv4(),
        linkHash: linkHash,
        dealerId: dealer.id,
        ip: clientIp,
        userAgent: req.headers['user-agent'] || 'unknown',
        timestamp: new Date()
    };

    if (!isDuplicate) {
        // --- HYBRID LOGGING STRATEGY ---
        try {
            await analyticsRepository.createVisitLog(newLog);
        } catch (error) {
            console.warn("[Analytics] Failed to write to Cosmos DB.", error);
        }

        mockStore.visitLogs.push(newLog);
        
        console.log(`[Analytics] Visit logged. Dealer: ${dealer.name}`);
    } else {
        console.log(`[Analytics] Spam click detected. Dealer: ${dealer.name}`);
    }

    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');

    res.redirect(`${CONFIGURATION_URL}?dealerId=${dealer.id}`);
};

// GET /api/v1/analytics/stats/:dealerId
export const getDealerStats = async (req: Request, res: Response) => {
    const dealerId = Number(req.params.dealerId);
    
    let stats: VisitLog[] = [];
    try {
         stats = await analyticsRepository.getVisitsByDealerId(dealerId);
    } catch (error) {
        console.error("[Analytics] Error reading from Cosmos DB:", error);
    }

    if (stats.length === 0) {
        console.log("[Analytics] Cosmos DB empty, fetching from Mock Store...");
        stats = mockStore.visitLogs.filter(log => log.dealerId === dealerId);
    }

    res.status(200).json({
        success: true,
        dealerId: dealerId,
        totalVisits: stats.length,
        lastVisit: stats.length > 0 ? stats[stats.length - 1].timestamp : null
    });
};