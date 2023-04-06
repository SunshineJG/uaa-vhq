import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getAuth } from 'firebase/auth'
import { getDoc, doc } from 'firebase/firestore'
import { db } from '../firebase.config'
import Spinner from '../components/Spinner'

function Orgdetails() {
  const auth = getAuth();
  const [loading, setLoading] = useState(true);
  const [orgInfo, setOrgInfo] = useState(null);

  const params = useParams();
  const navigate = useNavigate();
  console.log(`what is in the params: ${params.orgId}`);
  console.log(`what is in the orgInfo: ${orgInfo}`);

  useEffect(() => {
    const fetchOrgInfo = async () => {
      const orgRef = doc(db, 'orgs', params.orgId);
      const orgSnapshot = await getDoc(orgRef);

      if(orgSnapshot.exists()) {
        console.log(`got orgSnapshot from db: ${orgSnapshot}`);
        console.log(`got orgSnapshot data from db: ${orgSnapshot.data().orgName}`);
        setOrgInfo(orgSnapshot.data());

        setLoading(false);
      }
    };

    fetchOrgInfo();

  }, [params.orgId]);


  if(loading) {
    <Spinner />;
  }


  return ( <>
    {orgInfo ? (
    <div className='container'>
      <header className='heading'>{orgInfo.orgLogo && <img src={orgInfo.orgLogo} alt="orgLogo" />}{orgInfo.orgName}</header>
      <div style={{marginBottom: '20px'}}>
        <p style={{fontWeight: 'bold'}}>Creator: </p>
        <p style={{fontStyle: 'italic'}}>{orgInfo.orgCreator}</p>
      </div>
      <div style={{marginBottom: '20px'}}>
        <p style={{fontWeight: 'bold'}}>Admin: </p>
        {orgInfo.orgAdmin.map((orgadmin) => (<p key={orgadmin} style={{fontStyle: 'italic'}}>{orgadmin}</p>))}
      </div>
      <div style={{marginBottom: '20px'}}>
        <p style={{fontWeight: 'bold'}}>Member: </p>
        {orgInfo.members.map((orgmember) => (<p key={orgmember} style={{fontStyle: 'italic'}}>{orgmember}</p>))}
      </div>
      <div style={{marginBottom: '20px'}}>
        <p style={{fontWeight: 'bold'}}>Device: </p>
        {orgInfo.devices.map((orgdevices) => (<p key={orgdevices} style={{fontStyle: 'italic'}}>{orgdevices}</p>))}
      </div>
    </div> ) : (
      <div className="container">
        <header className='heading'>No Organisation yet</header>
      </div>
    )}
    </>
  )
}

export default Orgdetails
