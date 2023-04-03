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
  deleteDoc
} from 'firebase/firestore'
import { getAuth, onAuthStateChanged, getIdTokenResult, updateProfile } from 'firebase/auth'
import { httpsCallable } from 'firebase/functions'
// import { useAuthStatus } from '../hooks/useAuthStatus'
import { toast } from 'react-toastify'
import Spinner from '../components/Spinner'


function Profile() {
  const auth = getAuth();
  const [adminEmail, setAdminEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    avatar: '',
    orgs: []
  })
  const [loggedIn, setLoggedIn] = useState(false);
  const [updateClick, setUpdateClick] = useState(false);

  const { name, email, avatar, organisation } = formData;
  // const {loggedIn} = useAuthStatus();
  // const user = auth.currentUser;

  useEffect(() => {
    // update user state when authentication state change
    onAuthStateChanged(auth, (user) => {
      if(user) {
        setUser(user);
        setFormData((prevState) => ({
          ...prevState,
          name: user.displayName,
          email: user.email
        }));
        setLoggedIn(true);
        setLoading(false);
      }
    });
  }, [auth]);

  console.log(`1 Profile user: ${user}`);

  useEffect(() => {
    if(user) { // check user is not null before calling getIdTokenResult
      user.getIdTokenResult().then(idTokenResult => {
        if(idTokenResult.claims.admin) {
          setIsAdmin(true);
        };
        console.log(`2 user details: ${user.displayName}`);
        // setUserData((prevState) => ({
        //   ...prevState,
        //   user.
        // }))
      });
    }
  }, [user]); // call the effect only when user changes
  

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

  }


  const formOnChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.id]: e.target.value
    }))
  }

  const formOnSubmit = async (e) => {
    try {
      if(auth.currentUser.displayName !== name) {
        updateProfile(auth.currentUser, {
          displayName: name,
        });

        // update in firestore
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userRef, {
          name,
        });
      }
    } catch (error) {
      console.log(`update user info error: ${error}`);
      toast.error('Could not update user profile', {hideProgressBar: true, autoClose: 3000});
    }
    
  }

  if(loading) { return <Spinner />};
  
  return <>
    {loggedIn ? (
      <div className='container'>
          <header className="heading">Personal Details {isAdmin && <span style={{color: 'pink', fontSize: '16px'}}>Admin</span>}</header>
          <main>               
            <section className='form'>                   
              <form>
                <div className="form-group">
                  <label htmlFor="name">Username</label>
                  <input 
                    type="text"
                    id='name'
                    value={name}
                    onChange={formOnChange}
                    disabled={!updateClick}
                    className={!updateClick ? 'form-control profileName' : 'form-control profileNameActive'}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input 
                    type="email"
                    id='email'
                    value={email}
                    onChange={formOnChange}
                    disabled
                    className='form-control profileName'
                  />
                </div>
              
              </form>
              <div 
                onClick={() => {
                updateClick && 
                formOnSubmit()
                setUpdateClick((prevState) => !prevState)
                }} 
                className='btn btn-reverse' 
                style={{width: '30%'}}>
                {updateClick ? 'done' : 'update'}
              </div>
            </section>
            { isAdmin && (
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
            )}                 
          </main>
      </div>
      ) : (
      <div className='container'>
        <header className="heading">Please Login</header>
      </div>
    )}
  </>
}

export default Profile
