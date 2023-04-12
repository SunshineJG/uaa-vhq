import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db, functions } from '../firebase.config'
import { 
  updateDoc,
  doc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  deleteDoc,
  documentId,
  addDoc,
  getDoc
} from 'firebase/firestore'
import { getAuth, onAuthStateChanged, getIdTokenResult, updateProfile } from 'firebase/auth'
// import { useAuthStatus } from '../hooks/useAuthStatus'
import { toast } from 'react-toastify'
import Listingorg from '../components/Listingorg'
import Spinner from '../components/Spinner'

function Orgnisation() {
  const auth = getAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [orgRefresh, setOrgRefresh] = useState(false);
  const [orgAdmins, setOrgAdmins] = useState('');
  const [orgsListing, setOrgsListing] = useState(null);
  const [orgFormData, setOrgFormData] = useState({
    orgName: '',
    orgLogo: '',
    orgAdmin: [],
  });
  const [searchOrgInput, setSearchOrgInput] = useState('');
  const [orgSearchResult, setOrgSearchResult] = useState([]);
  const [clearOrgSearchResult, setClearOrgSearchResult] = useState(false);


  const { orgName } = orgFormData;
  const navigate = useNavigate();


  useEffect(() => {
    // check if logged in
    onAuthStateChanged(auth, (user) => {
      if(user) {
        setUser(user);
        setLoggedIn(true);
        user.getIdTokenResult().then(idTokenResult => {
          if(idTokenResult.claims.admin) {
            setIsAdmin(true);
          };
        });
        console.log(`Current user displayName: ${user.displayName}`);

        const showOrgs = async () => {
          try {
            setLoading(true);
            const orgsRef = collection(db, 'orgs');
            const orgsArray = [];
            const q = query(
              orgsRef,
              orderBy('orgName'),
            );
            const orgsSnapshot = await getDocs(q);
            console.log(`what is the orgSnapshot: ${orgsSnapshot.size}`);
            if(orgsSnapshot.size !== 0) {
              orgsSnapshot.forEach((doc) => {
                return orgsArray.push({
                  id: doc.id,
                  data: doc.data(),
                });
              });
              setOrgsListing(orgsArray);
            } else {
              setOrgsListing(null);
            };
            setLoading(false);
          } catch (error) {
            console.log(`Listing all orgs error: ${error}`);
          }       
        };
    
        showOrgs();

        // orgsListing.forEach((org) => {
        //   setVisible(false);
        //   let orgData = org.data();
        //   orgData.orgAdmin.forEach((adminEmail) => {
        //     console.log(`email in Admin array : ${adminEmail}`);
            
        //     if(adminEmail === auth.currentUser.email) {
        //       console.log('equal~~~~~~~~~~~~~~');
        //       setVisible(true);
        //       console.log(`is admin? inside orgAdmin forEach if ${visible}`);
        //     };
        //   });

        //   org.view = visible;
        // });
        

        setLoading(false);
      } else {
        <Spinner />;
      }
    });
  }, [auth, orgRefresh]);


  // Create an organisation
  const orgFormNameOnChange = (e) => {
    setOrgFormData((prevState) => ({
      ...prevState,
      orgName: e.target.value
    }));
    console.log(`get org name input: ${orgFormData.orgName}`);
  };

  const orgFormAdminOnChange = (e) => {
    setOrgAdmins(e.target.value);
    console.log(`get org admin input: ${orgAdmins}`);

    const adminArray = orgAdmins.split(',').map((item) => item.trim());
    adminArray.push(auth.currentUser.email);

    setOrgFormData((prevState) => ({
      ...prevState,
      orgAdmin: adminArray
    }));
  };

  // const orgFormMemberOnChange = (e) => {
  //   setOrgMembers(e.target.value);
  //   console.log(`get org member input: ${orgAdmins}`);

  //   const memberArray = orgMembers.split(',').map((item) => item.trim());
  //   memberArray.push(auth.currentUser.email);

  //   setOrgFormData((prevState) => ({
  //     ...prevState,
  //     orgMember: memberArray
  //   }));
  // };
  
  const orgFormOnSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    console.log(`saved in orgFormData orgAdmin array: ${orgFormData.orgAdmin}`);
    setLoading(true);
    const docRef = await addDoc(collection(db, 'orgs'), orgFormData);

    console.log(`org added with id: ${docRef.id}`);
    
    setOrgRefresh((prevState) => !prevState);
    setLoading(false);
    setOrgFormData({
      orgName: '',
      orgLogo: '',
      orgAdmin: [],
    });
    toast.success('New Organisation Added!', {hideProgressBar: true, autoClose: 3000});
  };


  // search org by name
  const searchOrgOnChange = (e) => {
    setSearchOrgInput(e.target.value);
  };

  const searchOrgOnSubmit = async (e) => {
    e.preventDefault();

    // search input validation
    if(searchOrgInput === '') {
      toast.error('Please enter an Organisation name', {hideProgressBar: true, autoClose: 3000});
    } else {
      setLoading(true);

      console.log(`search input: ${searchOrgInput}`);
      // get collection reference
      const orgRef = collection(db, 'orgs');
      console.log(`orgRef got? : ${orgRef}`);
      // create a query
      const q = query(
        orgRef,
        where('orgName', '==', searchOrgInput),
      );
      const querySnapshot = await getDocs(q);
      // const querySnapshot = await userRef.where('name', '==', searchUserInput).orderBy('timestamp', 'desc').getDocs();
      console.log(`querySnapshot: ${querySnapshot.length}`);
      if(querySnapshot.size !== 0) {
        let orgs = [];
        setLoading(false);
        querySnapshot.forEach((doc) => {
          return orgs.push({
            id: doc.id,
            data: doc.data()
          });
        });
        setLoading(false);
        console.log(`the org search result: ${orgs}`);
        setOrgSearchResult(orgs);
        setClearOrgSearchResult(true);
      } else {
        toast.error('Sorry, no match', {hideProgressBar: true, autoClose: 3000});
        setLoading(false);
      };

      setSearchOrgInput('');
    };
  };

  const clearOrgSearchResultonClick = () => {
    setOrgSearchResult([]);
    setClearOrgSearchResult(false);
  };


  const onView = (orgId) => navigate(`/orgs/${orgId}`);

  const onDelete = async (orgId) => { 
    if (window.confirm('Sure to delete this organisation?')) {
      setLoading(true);
      const orgRef = doc(db, 'orgs', orgId);
      await deleteDoc(orgRef);
      toast.success(`Oragnisation removed from the system.`, {hideProgressBar: true, autoClose: 3000});

      // check if there is no organisation
      // const orgsRef = collection(db, 'orgs');
      // const orgsArray = [];
      // const q = query(
      //   orgsRef,
      //   orderBy('orgName'),
      // );
      // const orgsSnapshot = await getDocs(q);
      // console.log(`what is the orgSnapshot: ${orgsSnapshot.size}`);
      // if(orgsSnapshot.size !== 0) {
      //   orgsSnapshot.forEach((doc) => {
      //     return orgsArray.push({
      //       id: doc.id,
      //       data: doc.data(),
      //     });
      //   });
      // };

      // setOrgsListing(null);
      setOrgRefresh((prevState) => !prevState);
      setLoading(false);
    };

  };

  if(loading) { return <Spinner />};

  return <>
    {loggedIn ? (
      <div className='container'>
        <header className='heading' style={{marginTop: '50px'}}>Organisation Management</header>
        {orgsListing ? ( 
          <>
            <div>
              <ul>
                {orgsListing.map((orgItem) => (
                    <Listingorg 
                    orgData={orgItem.data} 
                    id={orgItem.id} 
                    key={orgItem.id}
                    onView={() => onView(orgItem.id)}
                    onDelete={() => onDelete(orgItem.id)}
                  />
                 ))}                  
              </ul>
            </div>
            <form onSubmit={searchOrgOnSubmit}>
              <div className='form-group'>
                <label htmlFor="searchOrg" style={{fontWeight: 'bold', marginBottom: '20px'}}>Search Org by Name</label>
                <input 
                  type='text'
                  id='searchOrg'
                  value={searchOrgInput}
                  className='form-control'
                  onChange={searchOrgOnChange}
                />
                <button type='submit' className="btn btn-block">Search</button>
              </div>
          </form>
  
          {orgSearchResult && (
            <div>
              <ul>
                {orgSearchResult.map((orgItem) => (
                  <Listingorg
                    orgData={orgItem.data}
                    id={orgItem.id}
                    key={orgItem.id}
                    onView={() => onView(orgItem.id)}
                    onDelete={() => onDelete(orgItem.id)}
                  />
                ))}
              </ul>
            </div>
          )}
  
          {clearOrgSearchResult && (
            <div>
              <button onClick={clearOrgSearchResultonClick} className='btn btn-block btn-reverse'>Clear Search Result</button>
            </div>
          )}
          </>            
          ) : ( 
            <>
              <div className='heading'>No Orgnasation yet</div>  
            </> 
          )               
        }

        {isAdmin && (<>
          <p style={{paddingTop: '30px', paddingBottom: '10px', textAlign: 'left', fontWeight: 'bold'}}>Add an Organisation</p>
          <form onSubmit={orgFormOnSubmit}>
            <div className='form-group'>
              <input 
                type='text'
                id='orgName'
                value={orgName}
                className='form-control'
                placeholder='Organisation Name'
                onChange={orgFormNameOnChange}
                required
              />
            </div>

            <div className="form-group">
              <input 
                  type='text'
                  id='orgAdmin'
                  name='orgAdmin'
                  onChange={orgFormAdminOnChange}
                  className='form-control'
                  placeholder='Organisation Admin Email'
                />
              <p style={{fontStyle: 'italic', fontSize: '12px', textAlign: 'start'}}>Please note: use comma for multiple inputs. Admin must be a registered user. You will be the admin automatically.</p>
            </div>
            <div className='form-group'>
              <button className='btn btn-block'>Add</button>     
            </div>       
          </form>
        </>)}


      </div>
      ) : (
        <div className='container'>
          <header className="heading">Please Login</header>
        </div>
      )}
    </>
}

export default Orgnisation