import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, functions } from '../firebase.config';
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
  setDoc
} from 'firebase/firestore';
import { getAuth, onAuthStateChanged, getIdTokenResult, updateProfile } from 'firebase/auth';
// import { useAuthStatus } from '../hooks/useAuthStatus';
import { toast } from 'react-toastify';
import ListingOrg from '../components/ListingOrgWithSubcollection';
import Spinner from '../components/Spinner';

function Orgnisation() {
  const auth = getAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [orgRefresh, setOrgRefresh] = useState(false);
  const [orgId, setOrgId] = useState('');
  const [orgAdmins, setOrgAdmins] = useState('');
  const [orgsListing, setOrgsListing] = useState(null);
  const [orgNameData, setOrgNameData] = useState({ 
    orgName: '',
    orgLogo: '',
  });
  const [orgAdminData, setOrgAdminData] = useState([]);
  const [searchOrgInput, setSearchOrgInput] = useState('');
  const [orgSearchResult, setOrgSearchResult] = useState(null);
  const [clearOrgSearchResult, setClearOrgSearchResult] = useState(false);

  const { orgName } = orgNameData;
  const navigate = useNavigate();


  
  useEffect(() => {
    // check if logged in
    onAuthStateChanged(auth, (user) => {
      if(user) {
        setUser(user);
        setLoggedIn(true);
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
    setOrgNameData((prevState) => ({
      ...prevState,
      orgName: e.target.value
    }));
    console.log(`get org name input: ${orgNameData.orgName}`);
  };

  const orgFormAdminOnChange = (e) => {
    if(e.target.value !== '') {
      setOrgAdmins(e.target.value);

      const adminArray = orgAdmins.split(',').map((item) => item.trim());
      adminArray.push(auth.currentUser.email);

      setOrgAdminData(adminArray);
      console.log(`got admin input: ${orgAdminData[0]}`);
    };
  };

  
  const orgFormOnSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    let adminInfo = [{
      id: auth.currentUser.uid,
      name: auth.currentUser.displayName,
      email: auth.currentUser.email,
      disabled: false,
    }];

    // if there is any admin input
    if(orgAdminData !== null) {
      const userRef = collection(db, 'users');
      setLoading(true);
      const getAdminInfo = async () => {
        for (const item of orgAdminData) {
          const q = query(
            userRef,
            where('email', '==', item),
          );
          const querySnapShot = await getDocs(q);
          if(querySnapShot.size !== 0) {
            console.log(`got admin user record: ${querySnapShot}`);
            querySnapShot.forEach((doc) => {
              const data = doc.data();
              // console.log(`admin name: ${data.name}`);
              // console.log(`admin email: ${data.email}`);
              // console.log(`admin disabled: ${data.disabled}`);
              // console.log(`admin id: ${doc.id}`);
              adminInfo.push({
                id: doc.id,
                name: data.name,
                email: data.email,
                disabled: data.disabled,
              });
            });
            console.log(`adminInfo array is filled: ${adminInfo[1].id}`); 
          } else {
            toast.error(`Admin must be registered user`, {hideProgressBar: true, autoClose: 3000});
          };
        };

      };
      
      await getAdminInfo();
    };

    // create doc in admins subcollection
    const createSub = async () => {
      const docRef = await addDoc(collection(db, 'orgs'), orgNameData);
      console.log(`org added with id: ${docRef}`);

      const subCollectionRef = collection(docRef, 'admins');
      // an org is a doc, admins is the sub collection name, item.id is the id of doc in the subcollection
      for(const item of adminInfo) {
        try {
          console.log(`item id exist: ${item.id}`);
          const customId = doc(subCollectionRef, item.id);
          await setDoc(customId, {
            name: item.name,
            email: item.email,
            disabled: item.disabled
          });            
        } catch (error) {
          console.log(`error creating subcollection: ${error}`);
        };
      };
    };

    createSub();

    setOrgRefresh((prevState) => !prevState);
    setLoading(false);
    setOrgNameData({
      orgName: '',
      orgLogo: '',
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
                    <ListingOrg 
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
                  required
                />
                <button type='submit' className="btn btn-block">Search</button>
              </div>
          </form>
  
          {orgSearchResult && (
            <div>
              <ul>
                {orgSearchResult.map((orgItem) => (
                  <ListingOrg
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

      </div>
      ) : (
        <div className='container'>
          <header className="heading">Please Login</header>
        </div>
      )}
    </>
}

export default Orgnisation
