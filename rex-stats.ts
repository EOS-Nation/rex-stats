import { ONE_DAY, rpc, client } from "./src/config";
import { timeout } from "./src/utils";
import { Rexpool } from "./src/interfaces";

(async () => {
    const blockNum = await get_last_24h_block();

    console.log("history_block_num,rentrex,loan_num,total_lendable,total_lent,total_rent,total_rex,total_unlent");
    for (let i = 0; i < 365; i++) {
        await timeout(1000);
        const history_block_num = blockNum - i * ONE_DAY;
        const rexpool = await get_rexpool(history_block_num);

        const rentrex = calculateRentrex( to_number(rexpool.total_rent), to_number(rexpool.total_unlent), 1);
        const row = [history_block_num, Math.round(rentrex), rexpool.loan_num, to_number(rexpool.total_lendable), to_number(rexpool.total_lent), to_number(rexpool.total_rent), to_number(rexpool.total_rex), to_number(rexpool.total_unlent)].join(",");
        console.log(row);
        process.stderr.write(row + "\n");
    }
    client.release();
})();

async function get_rexpool( blockNum: number ): Promise<Rexpool> {
    try {
        const { rows } = await client.stateTable<Rexpool>("eosio", "eosio", "rexpool", { blockNum })
        if (rows[0].json) return rows[0].json;
        return get_rexpool( blockNum );
    } catch (e) {
        console.error(e);
        return get_rexpool( blockNum );
    }
}

function calculateRentrex( total_rent: number, total_unlent: number, payment: number ) {
    return get_bancor_output( total_rent, total_unlent, payment )
}

function to_number( quantity: string ) {
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
function calculateRexPrice(total_lent: number, total_unlent: number, total_rex: number) {
    const total_lendable = total_unlent + total_lent;
    return total_lendable / total_rex
}

function get_bancor_output( base_reserve: number, quote_reserve: number, quantity: number ): number {
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