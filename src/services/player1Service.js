import { ethers } from "ethers";
import ABI from "../constants/abi.json";

export default class Services {
    constructor(_contractAddress) {
        this.provider = new ethers.providers.JsonRpcProvider(
            process.env.REACT_APP_RINKEBY_ADDRESS
        );
        this.wallet = new ethers.Wallet(
            process.env.REACT_APP_PLAYER1_PRIVATE_KEY, // Address Private Key
            this.provider
        );
        this.contract = new ethers.Contract(_contractAddress, ABI, this.wallet);
    }

    getBalance = async () => {
        const _address = this.wallet.address;
        const balance = await this.contract.balance(_address);
        return balance;
    };

    getContractBalance = async () => {
        return await this.contract.getContractBalance();
    };

    withdrawMoney = async (_amount) => {
        const tx = await this.contract.withdrawMoney(_amount);
        return tx;
    };
}
