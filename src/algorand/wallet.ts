import { algodClient } from "./config";


export async function getWalletInfo(address: string) {
    const accountInfo = await algodClient.accountInformation(address).do();
    console.log(`Account information: ${accountInfo}`);
    return accountInfo;
}