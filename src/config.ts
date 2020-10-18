import * as dotenv from "dotenv"
import { JsonRpc } from 'eosjs';
import { createDfuseClient } from "@dfuse/client"
;(global as any).fetch = require("node-fetch")
;(global as any).WebSocket = require("ws")

// Configs
require('dotenv').config();
dotenv.config();

if (!process.env.NODEOS_ENDPOINT) throw new Error("[NODEOS_ENDPOINT] is required");
if (!process.env.DFUSE_NETWORK) throw new Error("[DFUSE_NETWORK] is required");
if (!process.env.START_BLOCK) throw new Error("[START_BLOCK] is required");

export const endpoint = process.env.NODEOS_ENDPOINT;
export const rpc = new JsonRpc(endpoint, { fetch: require('node-fetch') });

export const ONE_HOUR = 60 * 60 * 2; // 1 hour
export const ONE_DAY = 24 * 60 * 60 * 2; // 1 day
export const PAUSE_MS = Number(process.env.PAUSE_MS || 0); // pause per each HTTP request
export const CONCURRENCY = Number(process.env.CONCURRENCY) || 5;
export const INTERVAL = Number(process.env.INTERVAL) || ONE_HOUR;
export const START_BLOCK = Number(process.env.START_BLOCK);

export const client = createDfuseClient({
  apiKey: process.env.DFUSE_API_KEY || "server_f470330f92e2057235a947fd2aaf702f",
  network: "eos.dfuse.eosnation.io",
});