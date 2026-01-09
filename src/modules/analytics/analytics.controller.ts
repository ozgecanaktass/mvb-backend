import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { VisitLog } from '../../shared/models/VisitLog';
import { mockStore } from '../../shared/database/mockStore';
import { AppError } from '../../shared/utils/AppError';
import { analyticsRepository } from './analytics.repository';
import { dealerRepository } from '../dealers/dealers.repository';

const CONFIGURATION_URL = 'https://www.google.com/search?q=eyewear+configurator';

/**
 * Tracks a visit and redirects the user to the configuration URL.
 * Checks for valid dealer and logs the visit if not a duplicate/spam.
 *
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @returns {Promise<void>}
 */
export const trackAndRedirect = async (req: Request, res: Response) => {
    const { linkHash } = req.params;
    const clientIp = req.ip || '0.0.0.0';

    // 1. Find Dealer
    const dealer = await dealerRepository.findByLinkHash(linkHash);

    if (!dealer) {
        throw new AppError("Invalid link. Dealer not found.", 404);
    }

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
        // --- GA4 SUBMISSION ---
        try {
            // NOTE: Calling sendGA4Event instead of createVisitLog
            await analyticsRepository.sendGA4Event(newLog);
        } catch (error) {
            console.warn("[Analytics] GA4 submission error.", error);
        }

        // Backup to Mock Store (for visibility in tests)
        mockStore.visitLogs.push(newLog);

        const totalVisits = mockStore.visitLogs.filter(l => l.dealerId === dealer.id).length;
        console.log(`✅ [Analytics] Visit logged. Dealer: ${dealer.name} (Total in Mock: ${totalVisits})`);
    } else {
        console.log(`⚠️ [Analytics] Spam click detected.`);
    }

    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');

    res.redirect(`${CONFIGURATION_URL}?dealerId=${dealer.id}`);
};

/**
 * Retrieves analytics statistics for a specific dealer.
 * Currently fetches data from the Mock Store.
 *
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @returns {Promise<void>}
 */
export const getDealerStats = async (req: Request, res: Response) => {
    const dealerId = Number(req.params.dealerId);

    // Since fetching stats from GA4 (Reporting API) is complex...
    // we continue reading from Mock Store for now.
    const stats = mockStore.visitLogs.filter(log => log.dealerId === dealerId);

    res.status(200).json({
        success: true,
        dealerId: dealerId,
        totalVisits: stats.length,
        lastVisit: stats.length > 0 ? stats[stats.length - 1].timestamp : null,
        data: stats
    });
};