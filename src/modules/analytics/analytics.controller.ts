import {Request, Response} from 'express';
import {v4 as uuidv4} from 'uuid';
import { VisitLog } from '../../shared/models/VisitLog';
import { dealerDatabase, mockStore } from '../../shared/database/mockStore';
import { AppError } from '../../shared/utils/AppError';

// for test i use a constant URL
const CONFIGURATION_URL = 'https://www.google.com/search?q=eyewear+configurator';

export const trackAndRedirect = (req: Request, res: Response) => {
    const { linkHash } = req.params;
    const clientIp = req.ip || '0.0.0.0';
    const dealer = dealerDatabase.find(d => d.currentLinkHash === linkHash); // check if linkHash is valid

    // prevent duplicate logs within 5 seconds from same IP and linkHash (!!!)
    const isDuplicate = mockStore.visitLogs.some(log => {
        const timeDiff = new Date().getTime() - log.timestamp.getTime();
        return log.linkHash === linkHash && log.ip === clientIp && timeDiff < 5000;
    });

    if (!dealer) {
        throw new AppError("Invalid link.", 404);
    }
    // log the visit 
    const newLog: VisitLog = {
        id: uuidv4(),
        linkHash: linkHash,
        dealerId: dealer.id,

        ip: req.ip || '0.0.0.0',
        userAgent: req.headers['user-agent'] || 'unknown',
        timestamp: new Date()
    };

    // save the log -> mockStore
    mockStore.visitLogs.push(newLog);
    const dealerTotalVisits = mockStore.visitLogs.filter(l => l.dealerId === dealer.id).length;

    console.log(`Visit logged. Dealer: ${dealer.name} (Total: ${dealerTotalVisits})`);

    // cache control headers to prevent caching !!!!!
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');

    // redirect costumer to configuration URL
    // added dealer id so configurator can see the dealer
    res.redirect(`${CONFIGURATION_URL}?dealerId=${dealer.id}`);
};

// GET / api/v1/analytics/stats/:dealerId
// for get the dealer stats
export const getDealerStats = (req: Request, res: Response) => {
    const dealerId = Number(req.params.dealerId);
    const stats = mockStore.visitLogs.filter(log => log.dealerId === dealerId); //filter logs for this dealerq

    res.status(200).json({
        success: true,
        dealerId: dealerId,
        totalVisits: stats.length,
        lastVisits: stats.sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0,10) // last 10 visits
    });
};