import PQueue from "p-queue";
import { INTERVAL, CONCURRENCY, START_BLOCK } from "./src/config";
import { get_block, Block } from "./src/v1_get_block";
import * as fs from "fs";
import * as path from "path";


function get_cpu_usage_biller(block: Block) {
    const billers = []
    for ( const transaction of block.transactions ) {
        const { cpu_usage_us } = transaction;
        if (!transaction.trx.transaction) continue;
        const { account, name, authorization } = transaction.trx.transaction.actions[0];
        const biller = authorization[0].actor;

        // console.log(biller, cpu_usage_us);
        billers.push({ name, account, biller, cpu_usage_us });
    }
    return billers;
}

async function start(start_block: number, interval: number ): Promise<any> {
    const end_block = start_block - interval;
    const timestamp = (await get_block(start_block)).timestamp.split(".")[0];

    // map<biller, cpu_usuage_us>
    const billers: Map<string, number> = new Map();
    const accounts: Map<string, number> = new Map();
    const actions: Map<string, number> = new Map();

    // queue up promises
    const queue = new PQueue({concurrency: CONCURRENCY});

    for (let i = start_block; i > end_block; i--) {
        queue.add(async () => {
            const block = await get_block(i);
            for ( const { name, account, biller, cpu_usage_us } of get_cpu_usage_biller(block)) {
                billers.set(biller, cpu_usage_us + Number(billers.get(biller) || 0 ))
                accounts.set(account, cpu_usage_us + Number(accounts.get(account) || 0 ))
                actions.set(name, cpu_usage_us + Number(actions.get(name) || 0 ))
            }
        });
    }

    // wait until queue is finished
    await queue.onIdle();

    // save files
    save_file( "biller", billers, timestamp );
    save_file( "account", accounts, timestamp );
    save_file( "action", actions, timestamp );

    return start( start_block - interval, interval)
}

function save_file( type: string, data: Map<string, number>, timestamp: string ) {
    const filepath = path.join(__dirname, "stats", `cpu_usage-${type}-${timestamp}.csv`);
    console.log("saved ", filepath);
    const writer = fs.createWriteStream(filepath)
    writer.write(["timestamp", "block_num", type, "cpu_usage_us"].join(",") + "\n");

    for ( const [row, cpu_usage_us] of data) {
        writer.write([timestamp, row, cpu_usage_us].join(",") + "\n");
    }
}

(async () => {
    // START_BLOCK = 147149451 // 2020-10-15T00:00:00.000
    start(START_BLOCK, INTERVAL);
})();
