import { ethers } from "ethers";
import { useState, useEffect } from "react";
import { useWeb3React } from "@web3-react/core";
import {
    InjectedConnector,
    NoEthereumProviderError,
    UserRejectedRequestError as UserRejectedRequestErrorInjected,
} from "@web3-react/injected-connector";

import { UnsupportedChainIdError } from "@web3-react/core";

export const weiToEth = (_amount) => {
    const eth = ethers.utils.formatEther(_amount);
    return eth;
};

export const ethToWei = (_amount) => {
    const wei = ethers.utils.parseEther(_amount.toString());
    return wei;
};

export function calculateWinner(squares) {
    const lines = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
    ];
    for (let i = 0; i < lines.length; i++) {
        const [a, b, c] = lines[i];
        if (
            squares[a] &&
            squares[a] === squares[b] &&
            squares[a] === squares[c]
        ) {
            return squares[a];
        }
    }
    return null;
}

// Web3

// Chain Supported
export const injected = new InjectedConnector({
    supportedChainIds: [4],
});

export function useEagerConnect() {
    const { activate, active } = useWeb3React();

    const [tried, setTried] = useState(false);

    useEffect(() => {
        injected.isAuthorized().then((isAuthorized) => {
            if (isAuthorized) {
                activate(injected, undefined, true).catch(() => {
                    setTried(true);
                });
            } else {
                setTried(true);
            }
        });
    }, [activate]); // intentionally only running on mount (make sure it's only mounted once :))

    // if the connection worked, wait until we get confirmation of that to flip the flag
    useEffect(() => {
        if (!tried && active) {
            setTried(true);
        }
    }, [tried, active]);

    return tried;
}

export function useInactiveListener(suppress = false) {
    const { active, error, activate } = useWeb3React();

    useEffect(() => {
        const { ethereum } = window;
        if (ethereum && ethereum.on && !active && !error && !suppress) {
            const handleChainChanged = (chainId) => {
                activate(injected);
            };

            const handleAccountsChanged = (accounts) => {
                if (accounts.length > 0) {
                    activate(injected);
                }
            };

            const handleNetworkChanged = (networkId) => {
                activate(injected);
            };

            ethereum.on("chainChanged", handleChainChanged);
            ethereum.on("accountsChanged", handleAccountsChanged);
            ethereum.on("networkChanged", handleNetworkChanged);

            return () => {
                if (ethereum.removeListener) {
                    ethereum.removeListener("chainChanged", handleChainChanged);
                    ethereum.removeListener(
                        "accountsChanged",
                        handleAccountsChanged
                    );
                    ethereum.removeListener(
                        "networkChanged",
                        handleNetworkChanged
                    );
                }
            };
        }

        return () => {};
    }, [active, error, suppress, activate]);
}

// Error of Meta mask
export const getErrorMessage = (error) => {
    if (error instanceof NoEthereumProviderError) {
        return "No Ethereum browser extension detected, install MetaMask on desktop or visit from a dApp browser on mobile.";
    } else if (error instanceof UnsupportedChainIdError) {
        return "You're connected to an unsupported network.";
    } else if (error instanceof UserRejectedRequestErrorInjected) {
        return "Please authorize this website to access your Ethereum account.";
    } else {
        console.error(error);
        if (error.message) {
            return error.message;
        } else {
            return "An unknown error occurred. Check the console for more details.";
        }
    }
};
