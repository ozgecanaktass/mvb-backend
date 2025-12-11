import { Container } from "@azure/cosmos";
import { getCosmosClient } from "../../shared/database/cosmosClient";
import { VisitLog } from "../../shared/models/VisitLog";
import { cosmosConfig } from '../../config/dbConfig';

export const analyticsRepository = {
    container: null as Container | null,
 //  gets the Cosmos DB container, creates if not exists
    async getContainer(): Promise<Container> {
        if (!this.container) {
            const client = getCosmosClient();
            
            // check / create database
            const { database } = await client.databases.createIfNotExists({ 
                id: cosmosConfig.databaseId 
            });
            console.log(`[Cosmos DB]: Database '${database.id}' verified.`);

            // check / create container
            // partition key definition is critical (/linkHash)
            const { container } = await database.containers.createIfNotExists({ 
                id: cosmosConfig.containerId,
                partitionKey: { paths: ['/linkHash'] } 
            });
            console.log(`[Cosmos DB]: Container '${container.id}' verified.`);

            this.container = container;
        }
        return this.container;
    },

    // creates a new visit log entry
    async createVisitLog(visitLog: VisitLog): Promise<void> {
        try {
            const container = await this.getContainer();
            
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

    // fetches visit logs by dealer ID
    async getVisitsByDealerId(dealerId: number): Promise<VisitLog[]> {
        try {
            const container = await this.getContainer();

            const querySpec = {
                query: "SELECT * FROM c WHERE c.dealerId = @dealerId",
                parameters: [
                    {
                        name: "@dealerId",
                        value: Number(dealerId)
                    }
                ]
            };

            const { resources: items } = await container.items.query<VisitLog>(querySpec).fetchAll();
            
            return items;
        } catch (error) {
            console.error("[Cosmos DB Error] Failed to fetch visit logs:", error);
            return []; 
        }
    }
};