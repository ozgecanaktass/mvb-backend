// get the details from .env file and create a cosmos client
import {CosmosClient} from "@azure/cosmos";
import dotenv from 'dotenv';
import e from "express";

dotenv.config();

// get connection details (can be undefined)
const ENDPOINT = process.env.COSMOS_ENDPOINT ;
const KEY = process.env.COSMOS_KEY ;

// for hiding the client instance
let client : CosmosClient | null = null;

// singleton : if its connected, return the same instance

//  starts the cosmosdb client and returns it
export function getCosmosClient() : CosmosClient {
    if (client) {
        return client;
    }   

    if (!ENDPOINT || !KEY) {
        throw new Error("Cosmos DB connection details are not set in environment variables. Check the .env file");
    }

    // create a new client
    console.log("Connecting to Cosmos DB...");
    client = new CosmosClient({endpoint: ENDPOINT, key: KEY});

    return client;
}