import React from "react";
import Game from "./components/Game";
import { Web3ReactProvider } from "@web3-react/core";
import { Web3Provider } from "@ethersproject/providers";

// For Web3
function getLibrary(provider) {
    const library = new Web3Provider(provider);
    library.pollingInterval = 12000;
    return library;
}

const App = () => {
    return (
        <Web3ReactProvider getLibrary={getLibrary}>
            <Game />
        </Web3ReactProvider>
    );
};

export default App;

// const test = async () => {
//     // const provider = new ethers.providers.JsonRpcProvider(
//     //     process.env.REACT_APP_RINKEBY_ADDRESS
//     // );
//     const services = new Services(
//         "0xE28C224a1b6426b13814A0bff1c15A1C0e463eb1", // account
//         process.env.REACT_APP_CONTRACT_ADDRESS
//     );
//     console.log("services", services);

//     const contractBalance = await services.getContractBalance();
//     const balance = weiToEth(contractBalance);
//     console.log("balance", balance);
// };
