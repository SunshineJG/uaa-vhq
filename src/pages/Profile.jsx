import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, db, functions } from '../firebase.config'
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
import { getIdTokenResult } from 'firebase/auth'
import { httpsCallable } from 'firebase/functions'
import { toast } from 'react-toastify'



function Profile() {
  const [adminEmail, setAdminEmail] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    // update user state when authentication state change
    const unsubscribe = auth.onAuthStateChanged(user => setUser(user));
    if(unsubscribe) { setLoggedIn(true) };
  }, [])

  console.log(`From Profile user: ${user}`);

  useEffect(() => {
    if(user) { // check user is not null before calling getIdTokenResult
      user.getIdTokenResult().then(idTokenResult => {
        if(idTokenResult.claims.admin) {
          setIsAdmin(true);
        }
      });
    }
  }, [user]); // call the effect only when user changes
  

  const onChange = (e) => setAdminEmail(e.target.value);

  const onSubmit = (e) => {
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

  return <>
    {loggedIn ? (
      <div className='container'>
          <header className="heading">My Profile</header>
          <main>
            { isAdmin ? (
              <section className='form'>
              <form onSubmit={onSubmit}>
                <div className='form-group'>
                  <label htmlFor='admin'>Add an User to be Admin</label>
                  <input 
                    type='email'
                    id='admin'
                    value={adminEmail}
                    className='form-control'
                    placeholder='User Email'
                    onChange={onChange}
                  />
                </div>
                <div className='form-group'>
                  <button className='btn btn-block'>Add</button>     
                </div>       
              </form>
            </section>
            ) : (
              <div></div>
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
