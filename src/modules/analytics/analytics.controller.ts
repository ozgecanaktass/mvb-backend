import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { VisitLog } from '../../shared/models/VisitLog';
import { mockStore } from '../../shared/database/mockStore';
import { AppError } from '../../shared/utils/AppError';
import { analyticsRepository } from './analytics.repository';
import { dealerRepository } from '../dealers/dealers.repository';

const CONFIGURATION_URL = 'https://www.google.com/search?q=eyewear+configurator';

/**
 * GET /l/:linkHash
 * Handles link tracking, logging, and redirection.
 */
export const trackAndRedirect = async (req: Request, res: Response) => {
    const { linkHash } = req.params;
    const clientIp = req.ip || '0.0.0.0';
    
    // find dealer by link hash
    // We use the repository to fetch the dealer associated with the hash.
    const dealer = await dealerRepository.findByLinkHash(linkHash);

    if (!dealer) {
        throw new AppError("Invalid link. Dealer not found.", 404);
    }

    // Spam Protection (In-Memory Check)
    // Check if the same IP clicked the same link within the last 5 seconds
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
        
        // Try to save to Cosmos DB (The Real Database)
        try {
            await analyticsRepository.createVisitLog(newLog);
        } catch (error) {
            console.warn("[Analytics] Failed to write to Cosmos DB. Falling back to Mock Store.", error);
        }

        // ALWAYS save to Mock Store (For Demo & Fallback)
        // This ensures stats are visible even if Cosmos DB fails or is not configured.
        mockStore.visitLogs.push(newLog);
        
        const totalVisits = mockStore.visitLogs.filter(l => l.dealerId === dealer.id).length;
        console.log(`[Analytics] Visit logged. Dealer: ${dealer.name} (Total in Mock: ${totalVisits})`);
    } else {
        console.log(`[Analytics] Spam click detected. Dealer: ${dealer.name}`);
    }

    // Prevent Browser Caching for accurate tracking
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');

    // Redirect user to the Configurator with Dealer ID
    res.redirect(`${CONFIGURATION_URL}?dealerId=${dealer.id}`);
};

/**
 * GET /api/v1/analytics/stats/:dealerId
 * Returns click statistics for a specific dealer.
 * Ensures dealers can only see their own stats !!
 */
export const getDealerStats = async (req: Request, res: Response) => {
    const requestedDealerId = Number(req.params.dealerId);
    
    const currentUser = req.user; 

    if (!currentUser) {
        throw new AppError("You must be logged in.", 401);
    }

    // debug log to verify roles and IDs
    console.log(`[Analytics Auth Check] Role: ${currentUser.role}, UserDealerId: ${currentUser.dealerId}, Requested: ${requestedDealerId}`);

    // RULE:
    // If the user is 'producer_admin', they can see everything
    // Otherwise, the user's dealerId must equal the requested dealerId
    const isProducer = currentUser.role === 'producer_admin';
    const isOwnDealer = Number(currentUser.dealerId) === requestedDealerId;

    if (!isProducer && !isOwnDealer) {
        throw new AppError("You do not have permission to view these statistics.", 403);
    }
    
    // date filters
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    
    // try to fetch from Cosmos DB
    let stats: VisitLog[] = [];
    try {
         stats = await analyticsRepository.getVisitsByDealerId(requestedDealerId, startDate, endDate);
    } catch (error) {
        console.error("[Analytics] Error reading from Cosmos DB:", error);
    }

    res.status(200).json({
        success: true,
        dealerId: requestedDealerId,
        filters: { startDate, endDate },
        totalVisits: stats.length,
        lastVisit: stats.length > 0 ? stats[stats.length - 1].timestamp : null,
        data: stats
    });
};