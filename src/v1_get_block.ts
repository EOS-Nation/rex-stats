import { rpc } from "./config";
import { timeout } from "./utils";

export interface Block {
    timestamp: string;
    block_num: number;
    transactions: Transaction[];
}

interface Transaction {
    status: string;
    cpu_usage_us: number;
    net_usage_words: number;
    trx: Trx
}

interface Action {
    account: string;
    name: string;
    authorization: Authorization[];
    data: any;
    hex_data: string;
}

interface Trx {
    id: string;
    signatures: string[];
    compression: string;
    packed_context_free_data: string;
    context_free_data: [],
    packed_trx: string;
    transaction: {
        expiration: string;
        ref_block_num: number;
        ref_block_prefix: number;
        max_net_usage_words: number;
        max_cpu_usage_ms: number;
        delay_sec: number;
        context_free_actions: [];
        actions: Action[];
    }
}

interface Authorization {
    actor: string;
    permission: string;
}

interface BlockError {
    code: number;
    message: string;
    error: {
        code: number;
        name: string;
        what: string;
        details: {message: string}[];
    }
}

// v1/trace_api/get_block
export async function get_block( block_num: number, retry = 3 ): Promise<Block> {
    retry -= 1;
    if ( retry < 0 ) {
        console.error(`[ERROR] ❌ v1 get block API critical error [${block_num}] - max retries`);
        process.exit();
    }
    try {
        const block: any = rpc.get_block( block_num );
        return block;
        // const params = {method: "POST", body: JSON.stringify({block_num}) };
        // const response = await fetch(endpoint_trace_api + "/v1/trace_api/get_block", params);
        // if ( block.error ) {
        //     console.error(`[ERROR] ❗️ trace API error [${block_num}] -`, block.message);
        //     await timeout(1000); // pause for 1s
        //     return get_block( block_num, retry );
        // }
        // return block;
    } catch (e) {
        console.error(`[ERROR] ❗️ trace API error [${block_num}]`);
        await timeout(1000); // pause for 1s
        return get_block( block_num );
    }
}

// (async () => {
//     console.log(await get_block(39381711));
// })()