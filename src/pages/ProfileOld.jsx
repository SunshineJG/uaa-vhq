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
  getDoc
} from 'firebase/firestore'
import { getAuth, onAuthStateChanged, getIdTokenResult, updateProfile } from 'firebase/auth'
import { httpsCallable } from 'firebase/functions'
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
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
    organisation: ''
  });
  const [fileChose, setFileChose] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
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
        user.getIdTokenResult().then(idTokenResult => {
          if(idTokenResult.claims.admin) {
            setIsAdmin(true);
          };
        });
        console.log(`user displayName: ${user.displayName}`);

        const fetchUserProfile = async (user) => {
          // get document ref
          const userRef = doc(db, 'users', user.uid);
          setLoading(true);
          // get document data
          const userSnap = await getDoc(userRef);
          if(userSnap.exists) {
            setLoading(false);
            console.log(`user profile: ${userSnap.data()}`);
            setFormData((prevState) => ({
              ...prevState,
              name: userSnap.data().name,
              email: userSnap.data().email,
              // avatar: userSnap.data().avatar,
              organisation: userSnap.data().organisation
            }));
            console.log(`Before update avatar in user db: ${userSnap.data().avatar}`);
            console.log(`Before update name in user db: ${userSnap.data().name}`);
            setAvatarUrl(userSnap.data().avatar);
            console.log(`Before update get avatarUrl from user db: ${avatarUrl}`);
          }        
        }

        fetchUserProfile(user);

        setLoggedIn(true);
        setLoading(false);
      } else {
        <Spinner />;
      }
    });
  }, [auth]);


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
    let boolean = null;

    if(e.target.files) {
      console.log(`Step 1: onChange got image: ${e.target.files[0]}`);
      if(e.target.files[0] !== undefined) {
        console.log(`Step 2: onChange got image: ${e.target.files[0]}`);
        setFileChose(true);
        setFormData((prevState) => ({
          ...prevState,
          avatar: e.target.files[0]
        }));
        console.log(`chosed file in formData now: ${formData.avatar}`);
      } else {
        setFileChose(false);
      }      
    };

    if(!e.target.files) {
      setFormData((prevState) => ({
        ...prevState,
        [e.target.id]: boolean ?? e.target.value
      }));
      console.log(`new name in formData now: ${formData.name}`);
    };
  }

  const formOnSubmit = async (e) => {
    setLoading(true);

    try {
      // update name if changed
      if(auth.currentUser.displayName !== name) {
        await updateProfile(auth.currentUser, {
          displayName: name,
        });
      }

      // update avatar
      // avatars store in firebase storage
      // store one image
      const storeImage = async (image) => {
        return new Promise((resolve, reject) => {
          const storage = getStorage();
          const fileName = `avatar-${auth.currentUser.uid}`;
          const userAvatarRef = ref(storage, 'userAvatars/'+ fileName);
          const uploadTask = uploadBytesResumable(userAvatarRef, image);

          uploadTask.on(
            'state_changed', 
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
              console.log('Upload is ' + progress + '% done');
              switch (snapshot.state) {
                case 'paused':
                  console.log('Upload is paused')
                  break;
                case 'running':
                  console.log('Upload is running')
                  break;
              }
            }, 
            (error) => {
              reject(error);
            }, 
            () => {
              getDownloadURL(uploadTask.snapshot.ref)
                .then((downloadURL) => {
                    resolve(downloadURL);
                })
            }
          );
          })              
      }


      if(fileChose) {
        const imageUrl = await storeImage(avatar)
        .catch(() => {
          setLoading(false);
          toast.error('Image not uploaded', {hideProgressBar: true, autoClose: 3000});
          return;
        });
        console.log(`storage image: ${imageUrl}`);
        setAvatarUrl(imageUrl);
        console.log(`avatarUrl get from storage: ${imageUrl}`);
      }
      

      // update in firestore
      const userRef = doc(db, 'users', auth.currentUser.uid);
      try {
        setLoading(true);
        await updateDoc(userRef, {
          name,
          avatar: avatarUrl,
        });    
      } catch (error) {
        console.log(`error when updating users db: ${error}`);
      }
      
      try {
        const userSnap = await getDoc(userRef);
        if(userSnap.exists) {
          console.log(`getDoc after updateDoc, name after edit in users db: ${userSnap.data().name}`);
          setLoading(false);
          console.log(`avatar after edit in user db: ${userSnap.data().avatar}`);     
        }
      } catch (error) {
        console.log(`updating user db after edit failed: ${error}`);
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
                  {avatarUrl !== '' && console.log(`div avatarUrl: ${avatarUrl}`) }
                  {avatarUrl !== '' && <img src={avatarUrl} alt={name} className='avatarDisplay'/>}
                  <label>Upload an Avatar</label>
                  <input 
                    type='file'
                    id='avatar'
                    accept='.jpg, .png, .jpeg'
                    max='1'
                    onChange={formOnChange}
                    disabled={!updateClick}
                    className={!updateClick ? 'formInputFile' : 'formInputFileActive'}
                  />                                    
                </div>
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
                style={{width: '50%'}}>
                {updateClick ? 'Done' : 'Edit Personal Info'}
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
