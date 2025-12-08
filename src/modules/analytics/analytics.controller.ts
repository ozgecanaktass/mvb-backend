import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { VisitLog } from '../../shared/models/VisitLog';
import { dealerDatabase, mockStore } from '../../shared/database/mockStore';
import { AppError } from '../../shared/utils/AppError';
import { analyticsRepository } from './analytics.repository';

// constant for redirect URL
const CONFIGURATION_URL = 'https://www.google.com/search?q=eyewear+configurator';

// GET /l/:linkHash
export const trackAndRedirect = async (req: Request, res: Response) => {
    const { linkHash } = req.params;
    const clientIp = req.ip || '0.0.0.0';
    
    // find dealer by linkHash from mock database
    const dealer = dealerDatabase.find(d => d.currentLinkHash === linkHash); 

    // spam control: check if a log with same linkHash and IP exists in last 5 seconds
    const isDuplicate = mockStore.visitLogs.some(log => {
        const timeDiff = new Date().getTime() - log.timestamp.getTime();
        return log.linkHash === linkHash && log.ip === clientIp && timeDiff < 5000;
    });

    if (!dealer) {
        throw new AppError("Invalid link.", 404);
    }

    // Create log object
    const newLog: VisitLog = {
        id: uuidv4(),
        linkHash: linkHash,
        dealerId: dealer.id,
        ip: clientIp,
        userAgent: req.headers['user-agent'] || 'unknown',
        timestamp: new Date()
    };

    if (!isDuplicate) {
        // --- HYBRID RECORDING LOGIC ---
        try {
            //first try to write to the real DB (Cosmos)
            await analyticsRepository.createVisitLog(newLog);
        } catch (error) {
            console.warn("Cosmos DB write error, using Mock Store.");
        }

        // in any case, also write to Mock Store (to ensure demo and statistics)
        mockStore.visitLogs.push(newLog);
        
        console.log(`Visit logged. Dealer: ${dealer.name} (Total in Mock: ${mockStore.visitLogs.filter(l => l.dealerId === dealer.id).length})`);
    } else {
        console.log(`Spam click detected. Dealer: ${dealer.name}`);
    }

    //  Prevent Caching
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');

    // redirect
    res.redirect(`${CONFIGURATION_URL}?dealerId=${dealer.id}`);
};

// GET /api/v1/analytics/stats/:dealerId
export const getDealerStats = async (req: Request, res: Response) => {
    const dealerId = Number(req.params.dealerId);
    
    //hybrid fetching logic
    let stats = await analyticsRepository.getVisitsByDealerId(dealerId);

    if (stats.length === 0) {
        console.log("cosmos db returned no data, falling back to mock store");
        stats = mockStore.visitLogs.filter(log => log.dealerId === dealerId);
    }

    res.status(200).json({
        success: true,
        dealerId: dealerId,
        totalVisits: stats.length,
        lastVisit: stats.length > 0 ? stats[stats.length - 1].timestamp : null
    });
};