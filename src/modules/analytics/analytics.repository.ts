import { Container } from "@azure/cosmos";
import { getCosmosClient } from "../../shared/database/cosmosClient";
import { VisitLog } from "../../shared/models/VisitLog";
import { cosmosConfig } from '../../config/dbConfig';

export const analyticsRepository = {
    container: null as Container | null,

    // cosmos container initialization
    async getContainer(): Promise<Container> {
        if (!this.container) {
            const client = getCosmosClient();
            const database = client.database(cosmosConfig.databaseId);
            this.container = database.container(cosmosConfig.containerId);
        }
        return this.container;
    },

    // save visit log to cosmos db
    async createVisitLog(visitLog: VisitLog): Promise<void> {
        try {
            const container = await this.getContainer();
            await container.items.create(visitLog); // insert the visit log
            console.log("Visit log saved successfully.");
        } catch (error) {
            console.error("Error saving visit log:", error);
            // we do not throw the error, as analytics failure should not block main app flow 
        }
    
    },

    async getVisitsByDealerId(dealerId: number): Promise<VisitLog[]> {
        try {
            const container = await this.getContainer();

            const querySpec = {
                query: "SELECT * FROM c WHERE c.dealerId = @dealerId",
                parameters: [
                    {
                        name: "@dealerId",
                        value: dealerId
                    }
                ]
            };

            const { resources: items } = await container.items.query<VisitLog>(querySpec).fetchAll();
            return items;
        } catch (error) {
            console.error("Error fetching visits:", error);
            return []; // return empty array on error
        }
    }
}