import './jamboDetail.scss';
import { useEffect, useState } from "react";
import { jamboDetails, Item } from "../declarations/backend/backend.did";
import { backend } from "../declarations/backend";
import { useParams } from "react-router-dom";
import { getImageSource } from './common';
import { AuthClient } from '@dfinity/auth-client';

function jamboDetail() {
    const { id } = useParams();
    const jamboId = BigInt(id as string);

    const [jamboDetails, setjamboDetails] = useState<jamboDetails | undefined>();
    const [newCoins, setNewCoins] = useState(0);
    const [lastError, setLastError] = useState<string | undefined>(undefined);
    const [saving, setSaving] = useState(false);
    const [authenticated, setAuthenticated] = useState(false);

    const fetchFromBackend = async () => {
        setjamboDetails(await backend.getjamboDetails(jamboId));
        const authClient = await AuthClient.create();
        setAuthenticated(await authClient.isAuthenticated());
    };

    useEffect(() => {
        fetchFromBackend();
        setInterval(fetchFromBackend, 1000);
    }, [jamboId]);

    const makeNewOffer = async () => {
        try {
            setSaving(true);
            await backend.makePledge(jamboId, BigInt(newCoins));
            setLastError(undefined);
            setNewCoins(newCoins + 1);
            fetchFromBackend();
        } catch (error: any) {
            const errorText: string = error.toString();
            if (errorText.indexOf("Coins too low") >= 0) {
                setLastError("Coins too low");
            } else if (errorText.indexOf("jambo closed") >= 0) {
                setLastError("jambo closed");
            } else {
                setLastError(errorText);
            }
            return;
        } finally {
            setSaving(false);
        }
    };

    const historyElements = jamboDetails?.PledgeHistory.map(Pledge =>
        <tr key={+Pledge.Coins.toString()}>
            <td>
                {Pledge.Coins.toString()} ICP
            </td>
            <td>
                {Pledge.time.toString()} seconds
            </td>
            <td>
                {Pledge.originator.toString()}
            </td>
        </tr>
    );

    const getLastPledge = () => {
        if (jamboDetails == null) {
            return null;
        }
        let history = jamboDetails.PledgeHistory;
        if (history.length == 0) {
            return null;
        }
        return history[history.length - 1];
    }

    if (newCoins == 0) {
        const currentPledge = getLastPledge();
        const proposedCoins = currentPledge == null ? 1 : +currentPledge.Coins.toString() + 1;
        setNewCoins(proposedCoins);
    }

    const handleNewCoinsInput = (input: string) => {
        try {
            const value = parseInt(input);
            if (value >= 0) {
                setNewCoins(value);
            }
        } catch (error) {
            console.error(error);
        }
    }

    const displayItem = (item: Item) => {
        return (
            <>
                <h1>{item.title}</h1>
                <div className="jambo-overview">
                    <div className="overview-description">{item.description}</div>
                    {!!item.image?.length && (
                        <div className="overview-image"><img src={getImageSource(item.image)} alt="jambo image" /></div>
                    )}
                </div>
            </>
        );
    }

    const showHistory = () => {
        return (<div className="section">
            <h2>History</h2>
            <table className='Pledge-table'>
                <thead>
                    <tr>
                        <th>Coins</th>
                        <th>Time To Deadline</th>
                        <th>Originator</th>
                    </tr>
                </thead>
                <tbody>
                    {historyElements}
                </tbody>
            </table>
        </div>
        );
    }

    const showPledgeForm = () => {
        if (!authenticated) {
            return (<h2 className="error-message">Need to sign in to Pledge</h2>);
        }
        return (
            <div className="section">
                <h2>New Pledge</h2>
                <h3>Remaining time: {jamboDetails?.remainingTime.toString()}</h3>
                <div className="Pledge-form">
                    <input type="number" value={newCoins} onChange={(e) => handleNewCoinsInput(e.target.value)} />
                    <button onClick={makeNewOffer} disabled={saving} style={{ opacity: saving ? 0.5 : 1 }}>
                        Pledge {newCoins} ICP
                    </button>
                </div>
                {lastError != null &&
                    <p className="error-message">{lastError}</p>
                }
            </div>
        );
    }

    const showjambo = () => {
        if (jamboDetails == null) {
            throw Error("undefined jambo");
        }
        const currentPledge = getLastPledge();
        return (
            <>
                {displayItem(jamboDetails.item)}
                {
                    currentPledge != null &&
                    <div className="section">
                        <h2>{isClosed ? "Final Deal" : "Current Pledge"}</h2>
                        <p className="main-Coins">{currentPledge.Coins.toString()} ICP</p>
                        <p>by {currentPledge.originator.toString()}</p>
                        <p>{currentPledge.time.toString()} seconds after start</p>
                    </div>
                }
                {!isClosed &&
                    showPledgeForm()
                }
                {showHistory()}
            </>
        );
    }

    const isClosed = jamboDetails != null && +jamboDetails.remainingTime.toString() == 0;

    return (
        <>
            {jamboDetails == null ?
                <div className="section">Loading</div>
                :
                showjambo()
            }
        </>
    );
}

export default jamboDetail;
