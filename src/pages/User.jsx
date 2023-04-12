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
import { httpsCallable } from 'firebase/functions'
// import { useAuthStatus } from '../hooks/useAuthStatus'
import { toast } from 'react-toastify'
import Listinguser from '../components/Listinguser'
import Spinner from '../components/Spinner'

function User() {
  const auth = getAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  // const [userRefresh, setUserRefresh] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchUserInput, setSearchUserInput] = useState('');
  const [userSearchResult, setUserSearchResult] = useState([]);
  const [clearUserSearchResult, setClearUserSearchResult] = useState(false);
  const [usersListing, setUsersListing] = useState([]);
  const [hideUsersListing, setHideUsersListing] = useState(false);


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

        const showUsers = async () => {     
          try {
            setLoading(true);
            const usersRef = collection(db, 'users');
            const usersArray = [];
            const q = query(
              usersRef,
              orderBy('name'),
              // orderBy('name', (a, b) => {
              //   const nameA = a.data().name.toLowerCase();
              //   const nameB = b.data().name.toLowerCase();
              //   if(nameA < nameB) return -1;
              //   if(nameA > nameB) return 1;
              //   return 0;
              // }),
            );
            const usersSnapshot = await getDocs(q);
            console.log(`what is the userSnapshot: ${usersSnapshot}`);
            if(usersSnapshot) {
              usersSnapshot.forEach((doc) => {
                return usersArray.push({
                  id: doc.id,
                  data: doc.data()
                });
              });
              setUsersListing(usersArray);
            };
            setLoading(false);
          } catch (error) {
            console.log(`Listing all users error: ${error}`);
          } 
        }
    
        showUsers();
        setLoading(false);
      }
    });
  }, [auth]);


    // Search user by name
    const searchUserOnChange = (e) => {
      const name = e.target.value.trim();
      setSearchUserInput(name);
      console.log(`get search input: ${searchUserInput}`);
    };


    const searchUserOnSubmit = async (e) => {
      e.preventDefault();
      // search input validation
      if(searchUserInput === '') {
        toast.error('Please enter a user name', {hideProgressBar: true, autoClose: 3000});
      } else {
        setLoading(true);

        console.log(`search input: ${searchUserInput}`);
        // get collection reference
        const userRef = collection(db, 'users');
        console.log(`usersRef got? : ${userRef}`);
        // create a query
        const q = query(
          userRef,
          where('name', '==', searchUserInput),
        );
        const querySnapshot = await getDocs(q);
        // const querySnapshot = await userRef.where('name', '==', searchUserInput).orderBy('timestamp', 'desc').getDocs();
        console.log(`querySnapshot: ${querySnapshot.length}`);
        if(querySnapshot.size !== 0) {
          let users = [];
          querySnapshot.forEach((doc) => {
            return users.push({
              id: doc.id,
              data: doc.data()
            });
          });
          console.log(`the search result: ${users}`);
          setUserSearchResult(users);
          setClearUserSearchResult(true);
        } else {
          toast.error('Sorry, no match', {hideProgressBar: true, autoClose: 3000});
        };
        setLoading(false);
        setSearchUserInput('');
      };
    };

    const clearUserSearchResultOnClick = () => {
      setUserSearchResult([]);
      setClearUserSearchResult(false);
    };


    // Disable a user
    const onDisable = async (userId) => { 
      const disableUser = httpsCallable(functions, 'disableUser');
      if (window.confirm('Sure to lock this user?')) {
        disableUser({userId})
          .then((result) => {
            if(result.data.success){
              toast.success('User is locked', {hideProgressBar: true, autoClose: 3000});
            } else {
              toast.error(`${result.data.message}`, {hideProgressBar: true, autoClose: 3000});
              console.error(result.data.message);
            }          
        })
        .catch((error) => {
          console.log('error disable user', error);
        });

        const userRef = doc(db, 'users', userId);
        if(userRef) {
          await updateDoc(userRef, { disabled: true })
          .then(() => {
            console.log('user disabled set true');
          })
          .catch((error) => {
            console.log('Error updating user disabled status:', error);
          });
        } else {
          console.log('Cannot get user info');
        }
      }; 
    };

    
    // Enable a user
    const onEnable = async (userId) => {
      const enableUser = httpsCallable(functions, 'enableUser');
      if (window.confirm('Do you want to unlock this user?')) {
        enableUser({userId})
          .then((result) => {
            if(result.data.success){
              toast.success('User is locked', {hideProgressBar: true, autoClose: 3000});
            } else {
              toast.error(`${result.data.message}`, {hideProgressBar: true, autoClose: 3000});
              console.error(result.data.message);
            }          
        })
        .catch((error) => {
          console.log('error to enable user', error);
        })
      };
       
      const userRef = doc(db, 'users', userId);
      if(userRef) {
        await updateDoc(userRef, { disabled: false })
          .then(() => {
            console.log('user disabled set false');
          })
          .catch((error) => {
            console.log('Error updating user disabled status:', error);
          });
      } else {
        console.log('cannot get user info');
      };

    };

    const onView = (userId) => navigate(`/profile/${userId}`);

    // const onEdit = (orgId) => navigate(`/orgs/${orgId}`);


    // for making admin
  const adminOnChange = (e) => setAdminEmail(e.target.value);

  const adminOnSubmit = (e) => {
    e.preventDefault();

    const addAdmin = httpsCallable(functions, 'addAdminRole');

    addAdmin({ email: adminEmail }).then(result => {
      if(result.data.message) {
        toast.success(`${result.data.message}`, {hideProgressBar: true, autoClose: 3000});
      } else {
        const message = result.data.errorInfo;
        toast.error(`${message.message}`, {hideProgressBar: true, autoClose: 3000});
      }
    }).catch(error => {
      toast.error(`${error}`, {hideProgressBar: true, autoClose: 3000});
    });

    setAdminEmail('');
  };



  if(loading) { return <Spinner />};

  return <>
    {isAdmin ? (
      <div className='container'>
        <header className='heading' style={{marginTop: '50px'}}>User Management</header>
        <div>
          {!hideUsersListing && (
            <ul>
              {usersListing.map((userItem) => (
                  <Listinguser 
                  userData={userItem.data} 
                  id={userItem.id} 
                  key={userItem.id}
                  onView={() => onView(userItem.id)}
                  onEnable={() => onEnable(userItem.id)}
                  onDisable={() => onDisable(userItem.id)}
                />
              ))}                  
            </ul>
          )}
  
          <div>
            <button onClick={() => { setHideUsersListing((prevState) => !prevState)}} className='btn btn-block'>{!hideUsersListing ? 'Hide Users Listing' : 'Show All Users'}</button>
          </div>
        </div>
        <form onSubmit={searchUserOnSubmit}>
          <div className='form-group'>
            <label htmlFor="searchOrg" style={{fontWeight: 'bold', marginBottom: '20px'}}>Search User by Name</label>
            <input 
              type='text'
              id='searchOrg'
              value={searchUserInput}
              className='form-control'
              onChange={searchUserOnChange}
            />
            <button type='submit' className="btn btn-block">Search</button>
          </div>
        </form>
  
        {userSearchResult && (
          <div>
            <ul>
              {userSearchResult.map((userItem) => (
                <Listinguser
                  userData={userItem.data}
                  id={userItem.id}
                  key={userItem.id}
                  onDisable={() => onDisable(userItem.id)}
                  onEnable={() => onEnable(userItem.id)}
                  onView={() => onView(userItem.id)}
                />
              ))}
            </ul>
          </div>
        )}
  
        {clearUserSearchResult && (
          <div>
            <button onClick={clearUserSearchResultOnClick} className='btn btn-block btn-reverse'>Clear Search Result</button>
          </div>
        )}

        <section className='form'>
          <p style={{paddingTop: '30px', paddingBottom: '10px', textAlign: 'left', fontWeight: 'bold'}}>Enable Admin</p>
          <form onSubmit={adminOnSubmit}>
            <div className='form-group'>
              <input 
                type='email'
                id='admin'
                value={adminEmail}
                className='form-control'
                placeholder='User Email'
                onChange={adminOnChange}
              />
            </div>
            <div className='form-group'>
              <button className='btn btn-block'>Add</button>     
            </div>       
          </form>
        </section>
      </div>
      ) : (
        <div className='container'>
          <header className="heading">Access denied. You are not an admin.</header>
        </div>
      )}
    </>
}

export default User
