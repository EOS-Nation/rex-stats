import { createDfuseClient, InboundMessage, InboundMessageType, waitFor } from "@dfuse/client"
import { createWriteStream } from "fs";

// Configs
require('dotenv').config();

declare var global: any;
global.fetch = require("node-fetch");
global.WebSocket = require("ws");

export const DFUSE_SERVER_KEY = process.env.DFUSE_SERVER_KEY || "";
export const DFUSE_API_NETWORK = process.env.DFUSE_API_NETWORK || "mainnet";


// Write Stream
const stats = createWriteStream("stats.csv", {encoding: "utf8"});
stats.write("block_num,total_lent,total_unlent,total_rex,rex_price,rex_ratio\n")

function handleMessage(message: InboundMessage) {
  if (message.type !== InboundMessageType.TABLE_DELTA) {
    return
  }
  if (!message.data.dbop.old) return;

  const after = message.data.dbop.new.json;

  const total_lent = toNum(after.total_lent);
  const total_unlent = toNum(after.total_unlent);
  const total_rex = toNum(after.total_rex);
  const rex_price = calculateRexPrice(total_lent, total_unlent, total_rex);
  const rex_ratio = 1 / rex_price;
  const block_num = message.data.block_num;

  console.log(JSON.stringify({block_num, total_lent, total_unlent, total_rex, rex_price, rex_ratio}))
  stats.write([block_num, total_lent, total_unlent, total_rex, rex_price, rex_ratio].join(",") + "\n");
}

function toNum(str: string) {
  return Number(str.split(" ")[0]);
}

/**
 * Total Lent = 1418702.1005 EOS
 * Total Unlent = 5341430.3522 EOS
 * Total REX = 25572825752.8234 REX
 *
 * Total lendable = Total Unlent + Total Lent = 5341430.3522 + 1418702.1005 = 6760132.4527 EOS
 * REX price = Total lendable / Total REX = 1 / (6760132.4527 / 25572825752.8234) = 3782.8882:1 REX
 */
function calculateRexPrice(total_lent: number, total_unlent: number, total_rex: number) {
  const total_lendable = total_unlent + total_lent;
  return total_lendable / total_rex
}

async function main() {
  let client = createDfuseClient({
    apiKey: DFUSE_SERVER_KEY,
    network: DFUSE_API_NETWORK,
  });

  const data = { code: "eosio", scope: "eosio", table: "rexpool"};
  const stream = await client.streamTableRows(data, handleMessage, {start_block: 55860000 })

  // await waitFor(15000)
  // await stream.close()
}

main().catch(e => console.error(e));