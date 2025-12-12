import { Container } from "@azure/cosmos";
import { getCosmosClient } from "../../shared/database/cosmosClient";
import { VisitLog } from "../../shared/models/VisitLog";
import { cosmosConfig } from '../../config/dbConfig';

export const analyticsRepository = {
    container: null as Container | null,

    // lazily initialize and get the Cosmos DB container
    async getContainer(): Promise<Container> {
        if (!this.container) {
            const client = getCosmosClient();
            const database = client.database(cosmosConfig.databaseId);
            this.container = database.container(cosmosConfig.containerId);
        }
        return this.container;
    },

    // saves a visit log to Cosmos DB
    async createVisitLog(visitLog: VisitLog): Promise<void> {
        try {
            const container = await this.getContainer();
            
            // ensure dealerId is stored as a number
            const logToSave = { 
                ...visitLog, 
                dealerId: Number(visitLog.dealerId) 
            };
            
            await container.items.create(logToSave);
            
            console.log(`[Cosmos DB]: Visit log successfully saved. Hash: ${visitLog.linkHash}, Dealer: ${logToSave.dealerId}`);
        } catch (error) {
            console.error("[Cosmos DB Error] Failed to save visit log:", error);
        }
    },

    // retrieves visit logs for a dealer with optional date filtering
    // date filters are expected in 'YYYY-MM-DD' format
    async getVisitsByDealerId(dealerId: number, startDate?: string, endDate?: string): Promise<VisitLog[]> {
        try {
            const container = await this.getContainer();

            let queryText = "SELECT * FROM c WHERE c.dealerId = @dealerId";
            const parameters: any[] = [{ name: "@dealerId", value: Number(dealerId) }];

            if (startDate) {
                queryText += " AND c.timestamp >= @startDate";
                parameters.push({ name: "@startDate", value: startDate });
            }

            if (endDate) {
                queryText += " AND c.timestamp <= @endDate";
                parameters.push({ name: "@endDate", value: endDate });
            }

            const querySpec = {
                query: queryText,
                parameters: parameters
            };

            const { resources: items } = await container.items.query<VisitLog>(querySpec).fetchAll();
            
            return items;
        } catch (error) {
            console.error("[Cosmos DB Error] Failed to fetch visit logs:", error);
            return []; 
        }
    }
};