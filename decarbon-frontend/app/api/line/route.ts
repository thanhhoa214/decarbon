import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { LineChartData } from "@/app/types/api.model";
import { format } from "path";

declare global {
  interface BigInt {
    toJSON(): string;
  }
}

(BigInt.prototype as any).toJSON = function () {
  return String(this);
};

// export async function GET({ url }: NextRequest) {
//   const searchParams = url && new URL(url).searchParams;
//   const from = (searchParams && searchParams.get("from")) || "2023-05-29";
//   const to = (searchParams && searchParams.get("to")) || "2023-06-08";
//   const result: LineChartData =
//     await prisma.$queryRaw`SELECT * FROM get_line_chart_data(${from}, ${to})`;
//   return NextResponse.json(result);
// }

// commit: support real data query
export async function GET({ url }: NextRequest) {
    const searchParams = url && new URL(url).searchParams;
    const from = (searchParams && searchParams.get("from")) || "2023-05-29";
    const to = (searchParams && searchParams.get("to")) || "2023-06-08";
    const addressList = searchParams && searchParams.getAll("address");
    
    if (addressList.length <= 0) {
        return NextResponse.json(null);
    }
    
    try {
        const transactions: Record<string, any>[] = await prisma.$queryRaw`
            SELECT * FROM get_transactions(${from}::date, ${to}::date, ${addressList})
        `;
        console.log(transactions.length); //debug
        let dailyEmissionsData: Record<string, Record<string, number>> = {};
        for (const txn of transactions) {
            const sender = txn.t_from_address;
            const receiver = txn.t_to_address
            const formattedDate = new Date(txn.t_block_timestamp).toLocaleDateString('en-US');
            
            if (!dailyEmissionsData[formattedDate]) {
                dailyEmissionsData[formattedDate] = {};
            }

            if (addressList.includes(sender)) {
                dailyEmissionsData[formattedDate][sender] = (dailyEmissionsData[formattedDate][sender] || 0) + txn.t_emission_by_transaction
            }
            
            if (addressList.includes(receiver)) {
                dailyEmissionsData[formattedDate][receiver] = (dailyEmissionsData[formattedDate][receiver] || 0) + txn.t_emission_by_balance
            }
        }
        let result: LineChartData = [];
        
        for (const key_date of Object.keys(dailyEmissionsData)) {
            const addresses = dailyEmissionsData[key_date];
            for (const key_address of Object.keys(addresses)) {
                result.push({
                    address: key_address,
                    ghg_emission: addresses[key_address].toString(),
                    date_actual: key_date,
                });
            }
        }
        
        return NextResponse.json(result);
    } catch (err) {
        console.error(`GET method of api/line: ${err}`);
    }
}
