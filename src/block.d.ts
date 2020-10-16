export interface Block {
    timestamp: string;
    block_num: number;
    transactions: Transaction[];
}

export interface Transaction {
    status: string;
    cpu_usage_us: number;
    net_usage_words: number;
    trx: Trx
}

export interface Action {
    account: string;
    name: string;
    authorization: Authorization[];
    data: any;
    hex_data: string;
}

export interface Trx {
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

export interface Authorization {
    actor: string;
    permission: string;
}
