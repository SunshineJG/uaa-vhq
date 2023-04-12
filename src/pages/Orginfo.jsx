import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getAuth } from 'firebase/auth'
import { getDoc, doc } from 'firebase/firestore'
import { db } from '../firebase.config'
import Spinner from '../components/Spinner'

function Orginfo() {
  const auth = getAuth();
  const [loading, setLoading] = useState(true);
  const [orgExist, setOrgExist] = useState(false);
  const [updateClick, setUpdateClick] = useState(false);
  const [orgFormData, setOrgFormData] = useState({
    id: '',
    orgName: '',
    orgLogo: '',
    orgAdmin: [],
    orgMember: [],
    device: []
  });

  const params = useParams();
  console.log(`what is in the params: ${params.orgId}`);

  useEffect(() => {
    const fetchOrgInfo = async () => {
      const orgRef = doc(db, 'orgs', params.orgId);
      const orgSnapshot = await getDoc(orgRef);

      if(orgSnapshot.exists()) {
        setOrgExist(true);
        console.log(`got orgSnapshot from db: ${orgSnapshot}`);
        console.log(`got orgSnapshot data from db: ${orgSnapshot.data().orgName}`);
        setOrgFormData({
          id: orgSnapshot.id,
          orgName: orgSnapshot.data().orgName,
          orgLogo: orgSnapshot.data().orgLogo,
          orgAdmin: orgSnapshot.data().orgAdmin,
          orgMember: orgSnapshot.data().orgMember,
          device: orgSnapshot.data().device
        });

        setLoading(false);
      }
    };

    fetchOrgInfo();

  }, [orgFormData, params.orgId]);


  const orgFormOnSubmit = (e) => {
    e.preventDefault();


  };


  if(loading) {
    <Spinner />;
  }


  return ( <>
    {orgExist ? (
    <div className='container'>
      <header className='heading'>{orgFormData.orgLogo && <img src={orgFormData.orgLogo} alt="orgLogo" />}{orgFormData.orgName}</header>
      <div style={{marginBottom: '20px'}}>
        <p style={{fontWeight: 'bold'}}>Admin: </p>
        {orgFormData.orgAdmin.map((orgadmin) => (<p key={orgadmin} style={{fontStyle: 'italic'}}>{orgadmin}</p>))}
      </div>
      {orgFormData.orgMember && (
        <div style={{marginBottom: '20px'}}>
        <p style={{fontWeight: 'bold'}}>Member: </p>
        {orgFormData.orgMember.map((orgmember) => (<p key={orgmember} style={{fontStyle: 'italic'}}>{orgmember}</p>))}
        </div>
      )}
      {orgFormData.device && (
        <div style={{marginBottom: '20px'}}>
          <p style={{fontWeight: 'bold'}}>Device: </p>
          {orgFormData.device.map((orgdevices) => (<p key={orgdevices} style={{fontStyle: 'italic'}}>{orgdevices}</p>))}
        </div>
      )}
      <form>
        <div
          onClick={() => {
            updateClick &&
            orgFormOnSubmit &&
            setUpdateClick((prevState) => !prevState)
          }}
          className={!updateClick ? 'btn btn-reverse' : 'btn'}
          style={{width: '50%'}}
        >{!updateClick ? 'Update Org Info' : 'Submit'}
        </div>
      </form>
      

    </div> ) : (
      <div className="container">
        <header className='heading'>No Organisation yet</header>
      </div>
    )}
    </>
  )
}

export default Orginfo
