import React, { useEffect, useState } from 'react';
import {
    calculateWinner,
    getErrorMessage,
    injected,
    useEagerConnect,
    useInactiveListener,
} from '../utils/helper';
import Board from './Board';

import Player1Service from '../services/player1Service';
import Services from '../services/services';
import AdminServices from '../services/adminService';
import { ethToWei, weiToEth } from '../utils/helper';
import { useWeb3React } from '@web3-react/core';

const Game = () => {
    const [history, setHistory] = useState([Array(9).fill(null)]);
    const [stepNumber, setStepNumber] = useState(0);
    const [xIsNext, setXisNext] = useState(true);
    const winner = calculateWinner(history[stepNumber]);
    const xO = xIsNext ? 'X' : 'O';

    const [player1Info, setPlayer1Info] = useState({
        inGameBalance: 0,
        accountAddress: '',
        status: 'idle',
    });
    const [loading, setLoading] = useState(false);
    const [reload, setReload] = useState(false);

    const [player2Info, setPlayer2Info] = useState({
        inGameBalance: 0,
        accountAddress: '',
        status: 'idle',
    });
    const [loading2, setLoading2] = useState(false);
    const [trasfering, settTasfering] = useState(false);

    // Web3 and MetaMask
    const [connectedWallet, setConnectedWallet] = useState();

    const context = useWeb3React();
    const {
        account,
        activate,
        active,
        chainId,
        connector,
        deactivate,
        error,
        library: provider,
    } = context;

    // console.log("account", account);

    const [activatingConnector, setActivatingConnector] = React.useState();
    React.useEffect(() => {
        if (activatingConnector && activatingConnector === connector) {
            setActivatingConnector(undefined);
        }
    }, [activatingConnector, connector]);

    // handle logic to eagerly connect to the injected ethereum provider, if it exists and has granted access already
    const triedEager = useEagerConnect();

    // handle logic to connect in reaction to certain events on the injected ethereum provider, if it exists
    useInactiveListener(!triedEager || !!activatingConnector);

    const currentConnector = connectedWallet;
    const activating = currentConnector === activatingConnector;
    const connected = currentConnector === connector;
    const disabled = !!activatingConnector || connected || !!error;

    // Error handling
    React.useEffect(() => {
        if (!!error) {
            const errorMessage = !!error && getErrorMessage(error);
            if (errorMessage) {
                console.log('Metamask errorMessage', errorMessage);
            }
        }
    }, [error]);

    // Player1 Info
    const getPlayer1Info = async () => {
        const player1Service = new Player1Service(
            process.env.REACT_APP_CONTRACT_ADDRESS
        );
        const getBalance = await player1Service.getBalance();
        const inGameBalance = weiToEth(getBalance);

        setPlayer1Info({
            accountAddress: player1Service.wallet.address,
            inGameBalance: Number(inGameBalance),
            status: 'fetched',
        });
    };

    // Player2 Info
    const getPlayer2Info = async () => {
        const player2Service = new Services(
            provider,
            account,
            process.env.REACT_APP_CONTRACT_ADDRESS
        );
        // console.log('player2Service', player2Service);
        const getBalance = await player2Service.getBalance(account);
        const inGameBalance = weiToEth(getBalance);

        setPlayer2Info({
            accountAddress: account,
            inGameBalance: Number(inGameBalance),
            status: 'fetched',
        });
    };

    // To fetch Data
    useEffect(() => {
        if (player1Info.status === 'idle') {
            setLoading(true);
            getPlayer1Info()
                .catch((err) => console.log('err'))
                .finally(() => setLoading(false));
        }
    }, []);

    // Fetching player2 info
    useEffect(() => {
        if (account && provider) {
            setLoading2(true);
            getPlayer2Info()
                .catch((err) => console.log('err'))
                .finally(() => setLoading2(false));
        }
    }, [account, provider]);

    // Refetch
    useEffect(() => {
        if (reload) {
            getPlayer1Info();
            getPlayer2Info().finally(() => setReload(false));
        }
    }, [reload]);

    // Admin Only
    const allocatingEthToWinner = async (_winnerAddress) => {
        settTasfering(true);
        const adminService = new AdminServices(
            process.env.REACT_APP_CONTRACT_ADDRESS
        );
        // console.log('adminService', adminService);
        // const _amount = ethToWei("0.002");
        // console.log("_amount", _amount);

        const transfer = await adminService.setBalance(_winnerAddress);

        const getReceipt = await transfer.wait();
        if (getReceipt.status !== 1) {
            alert('Failed to transfer Eth');
            settTasfering(false);
            return;
        }
        alert(`Yahoo! 0.002 Eth added to ${_winnerAddress}`);
        settTasfering(false);
        setReload(true);
        // const transferEth = await adminService.
    };

    // Checking winner or draw condition
    useEffect(() => {
        if (winner) {
            if (xO === 'O') {
                allocatingEthToWinner(player1Info.accountAddress);
                alert('Player1 Win');
            } else {
                allocatingEthToWinner(player2Info.accountAddress);
                alert('Player2 Win');
            }
            return;
        }
        if (stepNumber === 9) {
            alert('Draw');
        }
        // if (squares[i]) {
        //     alert("Draw");
        // }
        return () => {};
    }, [winner, stepNumber]);

    // WithdrawAmount
    const withdrawMoney = async (_amount) => {
        try {
            if (!account || !provider) {
                alert('No account or provider');
                return;
            }
            if (loading || loading2) {
                alert('Please wait! loading data');
                return;
            }
            if (trasfering) {
                alert('Transfer in process');
                return;
            }
            if(_amount < 0.002){
                alert('Minimum 0.002 eth required to withdraw');
                return;
            }
            settTasfering(true);
            const player2Service = new Services(
                provider,
                account,
                process.env.REACT_APP_CONTRACT_ADDRESS
            );
            const toWithdraw = ethToWei(_amount);
            // console.log('toWithdraw', toWithdraw);
            const tx = await player2Service.withdrawMoney(toWithdraw);
            // console.log('tx', tx);
            const getReceipt = await tx.wait();
            if (getReceipt.status !== 1) {
                alert('Call Failed');
                return;
            } else {
                setReload(true);
            }
            settTasfering(false);
        } catch (error) {
            setReload(false);
            settTasfering(false);
            if (error.reason) {
                alert(error.reason);
            } else if (error.message) {
                alert(error.message);
            } else {
                alert('Check console for message');
                console.log('Error', error);
            }
            // console.log("err in withdraw", error);
        }
    };

    // Moves manage
    const handleClick = (i) => {
        if (!account) {
            alert('Coneect metamask to play');
            return;
        }
        if (loading || loading2) {
            alert('Please wait! loading data');
            return;
        }

        if (trasfering) {
            alert('Transfer in process');
            return;
        }
        const historyPoint = history.slice(0, stepNumber + 1);
        const current = historyPoint[stepNumber];
        const squares = [...current];
        // return if won or occupied
        if (winner || squares[i]) {
            return;
        }
        // select square
        squares[i] = xO;
        setHistory([...historyPoint, squares]);
        setStepNumber(historyPoint.length);
        setXisNext(!xIsNext);
    };

    // Transfer to contract
    const transferToContract = async () => {
        try {
            if (!account && !provider) {
                alert('No account or provider');
                return;
            }
            if (loading || loading2) {
                alert('Please wait! loading data');
                return;
            }

            if (trasfering) {
                alert('Transfer in process');
                return;
            }
            settTasfering(true);
            // const player1Service = new Player1Service(
            //     process.env.REACT_APP_CONTRACT_ADDRESS
            // );
            const singer = await provider.getSigner();
            // console.log('signer', singer);

            const toTransfer = ethToWei(0.02);
            // console.log("toTransfer", toTransfer);
            // return;
            const sendTransaction = await singer.sendTransaction({
                to: process.env.REACT_APP_CONTRACT_ADDRESS,
                value: toTransfer,
            });
            // console.log('sendTransaction', sendTransaction);
            const getReceipt = await sendTransaction.wait();
            if (getReceipt.status !== 1) {
                alert('Call Failed');
                return;
            } else {
                setReload(true);
            }
            settTasfering(false);
        } catch (error) {
            console.log('error in transfer to contract function');
            console.log(error);
            settTasfering(false);
            if (error.reason) {
                alert(error.reason);
            } else if (error.message) {
                alert(error.message);
            } else {
                alert('Check console for message');
                console.log('Error', error);
            }
        }
    };

    // Reset board
    const reset = () => {
        if (loading || loading2) {
            alert('Please wait! loading data');
            return;
        }

        if (trasfering) {
            alert('Transfer in process');
            return;
        }
        setHistory([Array(9).fill(null)]);
        setStepNumber(0);
        setXisNext(true);
    };

    // const jumpTo = (step) => {
    //     setStepNumber(step);
    //     setXisNext(step % 2 === 0);
    // };

    // const renderMoves = () =>
    //     history.map((_step, move) => {
    //         const destination = move ? `Go to move #${move}` : "Go to Start";
    //         return (
    //             <li key={move}>
    //                 <button onClick={() => jumpTo(move)}>{destination}</button>
    //             </li>
    //         );
    //     });

    return (
        <>
            {/* <h1>React Tic Tac Toe - With Hooks</h1> */}
            <div className="info-container">
                <div className="info-player">
                    <h6>Player 1: X</h6>
                    <br></br>
                    {!loading && (
                        <>
                            <h6 className="info-player-account">
                                Account: {player1Info.accountAddress}
                            </h6>
                            <h6>
                                In Game Balance: {player1Info.inGameBalance} Eth
                            </h6>
                        </>
                    )}
                </div>
                <div className="info-player">
                    <h6>Player 2: 0</h6>
                    <br></br>
                    {account && !loading2 ? (
                        <>
                            <h6 className="info-player-account">
                                Account: {player2Info.accountAddress}
                            </h6>
                            <h6>
                                In Game Balance: {player2Info.inGameBalance} Eth
                            </h6>
                            <button
                                className="info-button"
                                onClick={() =>
                                    withdrawMoney(player2Info.inGameBalance)
                                }
                            >
                                Withdraw
                            </button>
                            <br></br>
                            <button
                                className="info-button"
                                onClick={() =>
                                    transferToContract(
                                        player2Info.inGameBalance
                                    )
                                }
                            >
                                Transfer To Contract
                            </button>
                        </>
                    ) : (
                        <button
                            className="info-button"
                            onClick={() => {
                                setConnectedWallet(injected);
                                setActivatingConnector(injected);
                                activate(injected);
                            }}
                        >
                            Connect MetaMask
                        </button>
                    )}
                </div>
            </div>
            <Board squares={history[stepNumber]} onClick={handleClick} />
            <div className="info-wrapper">
                <h3>{winner ? 'Winner: ' + winner : 'Next Player: ' + xO}</h3>
                {winner && <button onClick={reset}>Play again</button>}
                {!winner && stepNumber === 9 && (
                    <button className="info-button" onClick={reset}>
                        Play again
                    </button>
                )}
            </div>
        </>
    );
};

export default Game;
