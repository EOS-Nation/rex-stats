import PQueue from "p-queue";
import { ONE_DAY, ONE_HOUR, rpc, client } from "./src/config";
import { timeout, get_last_24h_block } from "./src/utils";
import { get_block, Block } from "./src/v1_get_block";

// (async () => {
//     const blockNum = await get_last_24h_block();
//     const block = await get_block(blockNum);
//     const timestamp = block.timestamp.split("T")[0];

//     console.log(["timestamp", "block_num", "biller","cpu_usage_us"]);
//     console.log(get_cpu_usage_biller(block));
// })();


function get_cpu_usage_biller(block: Block) {
    const billers = []
    for ( const transaction of block.transactions ) {
        const { cpu_usage_us } = transaction;
        if (!transaction.trx.transaction) continue;
        const biller = transaction.trx.transaction.actions[0].authorization[0].actor;

        // console.log(biller, cpu_usage_us);
        billers.push({ biller, cpu_usage_us });
    }
    return billers;
}

( async () => {
    // const start_block = await get_last_24h_block();
    const start_block = 147149451 - 1 - ONE_HOUR; // 2020-10-15T00:00:00.000
    const end_block = start_block - ONE_DAY + ONE_HOUR;
    // const timestamp = (await get_block(start_block)).timestamp.split("T")[0];

    // map<biller, cpu_usuage_us>

    const dates: Map<string, Map<string, number>> = new Map();

    // queue up promises
    const queue = new PQueue({concurrency: 5});

    for (let i = start_block; i > end_block; i--) {
        queue.add(async () => {
            const block = await get_block(i);
            const timestamp = block.timestamp.split("T")[0];
            console.log(i, block.timestamp)
            for ( const { biller, cpu_usage_us } of get_cpu_usage_biller(block)) {
                const billers = dates.get( timestamp ) || new Map();
                billers.set(biller, cpu_usage_us + Number(billers.get(biller) || 0 ))
                dates.set( timestamp, billers );
            }
        });
    }

    // wait until queue is finished
    await queue.onIdle();

    // logging
    console.log(["timestamp", "block_num", "biller","cpu_usage_us"].join(","));

    for ( const [timestamp, billers] of dates) {
        for ( const [biller, cpu_usage_us] of billers) {
            console.log([timestamp, biller, cpu_usage_us].join(","));
        }
    }
    // console.log(billers);
})();