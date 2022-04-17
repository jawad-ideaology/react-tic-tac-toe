import { ethers } from "ethers";
import ABI from "../constants/abi.json";

export default class Services {
    constructor(_provider, _signerAddress, _contractAddress) {
        if (_signerAddress) {
            const signer = _provider.getSigner(_signerAddress);
            this.contract = new ethers.Contract(
                _contractAddress,
                ABI,
                _provider
            ).connect(signer);
        } else {
            this.contract = new ethers.Contract(
                _contractAddress,
                ABI,
                _provider
            );
        }
    }

    getBalance = async (_account) => {
        const balance = await this.contract.balance(_account);
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
