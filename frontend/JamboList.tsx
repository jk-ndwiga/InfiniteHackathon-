import './JamboList.scss';
import { useEffect, useState } from "react";
import { JamboOverview } from "../declarations/backend/backend.did";
import { backend } from "../declarations/backend";
import { Link, useNavigate } from "react-router-dom";
import { getImageSource } from './common';

function JamboList() {
    const [list, setList] = useState<JamboOverview[] | undefined>();
    const navigate = useNavigate();
    const navigationLink = (jamboId: number) => "/viewJambo/" + jamboId;

    const overviewList = list?.map(overview => {
        const id = +overview.id.toString();
        return (
            <li key={id} className="gallery-item" onClick={(_) => navigate(navigationLink(id))}>
                <div className="jambo-title">{overview.item.title}</div>
                <div className="jambo-description">{overview.item.description}</div>
                {!!overview.item.image?.length && <img src={getImageSource(overview.item.image)} alt="Jambo image" />}
                <div className="gallery-item-link">
                    <Link to={navigationLink(id)}>Jambo details</Link>
                </div>
            </li>
        );
    });

    const fetchJambo = async () => {
        let result = await backend.getOverviewList();
        setList(result);
    }

    useEffect(() => {
        fetchJambo();
    }, []);

    return (
        <>
            {list == null &&
                <div className="section">Loading</div>
            }
            {list?.length == 0 &&
                <div className="section">No jambos created so far</div>
            }
            {list != null && list.length > 0 &&
                <ul className="gallery">
                    {overviewList}
                </ul>
            }
        </>
    );
}

export default JamboList;
