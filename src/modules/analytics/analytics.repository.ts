import axios from 'axios';
import { VisitLog } from "../../shared/models/VisitLog";
// import { Container } from "@azure/cosmos"; // Closed Cosmos DB imports
// import { getCosmosClient } from "../../shared/database/cosmosClient";
// import { cosmosConfig } from '../../config/dbConfig';

const GA4_ENDPOINT = `https://www.google-analytics.com/mp/collect`;

export const analyticsRepository = {
    // container: null as Container | null, // Cosmos DB cancelled

    /**
     * Sends a custom event to Google Analytics 4 via Measurement Protocol.
     * This replaces the Cosmos DB 'createVisitLog' method.
     * 
     * @param {VisitLog} visitLog - The visit data to be sent as an event.
     * @returns {Promise<void>}
     */
    async sendGA4Event(visitLog: VisitLog): Promise<void> {
        const measurementId = process.env.GA4_MEASUREMENT_ID;
        const apiSecret = process.env.GA4_API_SECRET;

        // If keys are missing (Local Test), just log and exit
        if (!measurementId || !apiSecret) {
            console.warn("⚠️ [GA4]: Keys missing! Could not send to Google Analytics (Mock Mode).");
            // Mock event details logging removed for cleanup
            return;
        }

        try {
            // Google Analytics 4 Payload Format
            const payload = {
                client_id: visitLog.ip || 'anonymous_user', // IP or ID to distinguish the user
                events: [{
                    name: 'dealer_link_click', // Event Name
                    params: {
                        dealer_id: visitLog.dealerId,
                        link_hash: visitLog.linkHash,
                        user_agent: visitLog.userAgent,
                        engagement_time_msec: 100 // Optional
                    }
                }]
            };

            // HTTP POST Request
            await axios.post(`${GA4_ENDPOINT}?measurement_id=${measurementId}&api_secret=${apiSecret}`, payload);

            console.log(`✅ [GA4]: Event successfully sent -> Hash: ${visitLog.linkHash}`);
        } catch (error) {
            // Analytics error should not break the flow
            console.error("❌ [GA4 Error]: Data could not be sent.", error);
        }
    },

    // --- OLD COSMOS DB CODES (Keep commented out) ---
    /*
    async getContainer(): Promise<Container> { ... }
    async createVisitLog(visitLog: VisitLog): Promise<void> { ... }
    async getVisitsByDealerId(dealerId: number): Promise<VisitLog[]> { ... }
    */
};