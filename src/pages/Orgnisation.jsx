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
import ListingOrg from '../components/ListingOrg'
import Spinner from '../components/Spinner'

function Orgnisation() {
  const auth = getAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [orgsListing, setOrgsListing] = useState([]);
  // const [visible, setVisible] = useState(false);

  const navigate = useNavigate();


  useEffect(() => {
    // update user state when authentication state change
    onAuthStateChanged(auth, (user) => {
      if(user) {
        setUser(user);
        // user.getIdTokenResult().then(idTokenResult => {
        //   if(idTokenResult.claims.admin) {
        //     setIsAdmin(true);
        //   };
        // });
        setLoggedIn(true);
        console.log(`user displayName: ${user.displayName}`);

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
              console.log(`auth email: ${auth.currentUser.email}`);

              orgsSnapshot.forEach((doc) => {
                return orgsArray.push({
                  id: doc.id,
                  data: doc.data(),
                  // view: false
                });
              });
            } else {
              toast.error('No Orgnasation yet', {hideProgressBar: true, autoClose: 3000});
            }
    
            setOrgsListing(orgsArray);
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
        

        // const fetchUserProfile = async (user) => {
        //   // get document ref
        //   const userRef = doc(db, 'users', user.uid);
        //   // get document data
        //   const userSnap = await getDoc(userRef);
        //   if(userSnap.exists) {
        //     console.log(`user profile: ${userSnap.data()}`);
        //     setFormData((prevState) => ({
        //       ...prevState,
        //       name: userSnap.data().name,
        //       email: userSnap.data().email,
        //       // avatar: userSnap.data().avatar,
        //       organisation: userSnap.data().organisation
        //     }));
        //     setAvatarUrl(userSnap.data().avatar);
        //     console.log(`start db avatarUrl: ${avatarUrl}`);
        //   } else {
        //     console.log('No such user!');
        //   }          
        // }

        // fetchUserProfile(user);

        setLoading(false);
      } else {
        <Spinner />;
      }
    });
  }, [auth]);

  const onEdit = (orgId) => navigate(`/orgs/${orgId}`)

  if(loading) { return <Spinner />};

  return <>
    {loggedIn ? (
      <div className="container">
        <header className="heading" style={{marginTop: '50px'}}>Organisation Management</header>
        {orgsListing && (
            <div>
              <ul>
                {orgsListing.map((orgItem) => (
                    <ListingOrg 
                    orgData={orgItem.data} 
                    id={orgItem.id} 
                    key={orgItem.id}
                    onEdit={() => onEdit(orgItem.id)}
                    // onDelete={() => onDelete(orgItem.id)}
                    // view={orgItem.view}
                  />
                 ))}                  
              </ul>
            </div>)                 
        }
      </div>
      ) : (
        <div className='container'>
          <header className="heading">Please Login</header>
        </div>
      )}
    </>
}

export default Orgnisation
