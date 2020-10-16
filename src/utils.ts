import * as path from "path";
import * as fs from "fs";
import * as write from "write-json-file";
import * as load from "load-json-file";
import { ONE_DAY, rpc } from "./config";

export function timeout(ms: number) {
  return new Promise((resolve) => {
    setTimeout(() => {
      return resolve();
    }, ms);
  })
}

export function parseTimestamp( timestamp: string ) {
  return timestamp.split(".")[0];
}

export function to_number( quantity: string ) {
  return Number(quantity.split(" ")[0]);
}

/**
 * Total Lent = 1418702.1005 EOS
 * Total Unlent = 5341430.3522 EOS
 * Total REX = 25572825752.8234 REX
 *
 * Total lendable = Total Unlent + Total Lent = 5341430.3522 + 1418702.1005 = 6760132.4527 EOS
 * REX price = Total lendable / Total REX = 1 / (6760132.4527 / 25572825752.8234) = 3782.8882:1 REX
 */
export function calculateRexPrice(total_lent: number, total_unlent: number, total_rex: number) {
  const total_lendable = total_unlent + total_lent;
  return total_lendable / total_rex
}

export function get_bancor_output( base_reserve: number, quote_reserve: number, quantity: number ): number {
  const out = (quantity * quote_reserve) / (base_reserve + quantity);
  if ( out < 0 ) return 0;
  return out;
}

export async function get_last_24h_block(): Promise<number> {
  try {
      const { last_irreversible_block_num } = await rpc.get_info();
      // minus 1 hour & round down to the nearest 1 hour interval
      return (last_irreversible_block_num - ONE_DAY) - last_irreversible_block_num % ONE_DAY;
  } catch (e) {
      console.error("[ERROR] ❗️ get info");
      await timeout(5000) // pause for 5s
  }
  return get_last_24h_block();
}

// export function exists( block_num: number ) {
//   return fs.existsSync(path.join(process.cwd(), "tmp", `${network}-${block_num}.json`));
// }

// export function save_local( block_num: number, json: Count ) {
//   write.sync(path.join(process.cwd(), "tmp", `${network}-${block_num}.json`), json);
// }

// export async function save( block_num: number, json: Count, retry = 10): Promise<void> {
//   save_local( block_num, json );

//   if (retry <= 0) {
//     console.error(JSON.stringify({error: "failed to push on-chain", block_num, json}));
//     return;
//   }
// }

// export function loads( block_num: number ): Count {
//   return load.sync(path.join(process.cwd(), "tmp", `${network}-${block_num}.json`));
// }
