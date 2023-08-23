import { prisma } from "./";
import { Block } from "../interfaces";
import { exampleEpoch } from "../interfaces";

export default async function insert_blocks(_blockList: Block[])
: Promise<boolean> {
    try {
        await prisma.d_block.createMany({
            data: _blockList.map((block) => ({
                number: BigInt(block.number),
                proposer_index: BigInt(block.proposer_index),
                hash: block.hash,
                timestamp: new Date(block.timestamp * 1000).toISOString(),
                fee_recipient: block.fee_recipient,
                parent_hash: block.parent_hash,
                logs_bloom: block.logs_bloom,
                state_root: block.state_root,
                gas_limit: block.gas_limit,
                gas_used: block.gas_used,
                transaction_count: BigInt(block.transaction_count),
            }))
        })
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
}

// Testing
    // insert_blocks(exampleEpoch.blocks!)
    // .then((success) => {
    //     if (success) {
    //         console.log("Blocks inserted");
    //     }
    //     else {
    //         console.log("Failed to insert blocks");
    //     }
    // })
    // .catch(err => console.log(err));