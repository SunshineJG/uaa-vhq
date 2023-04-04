import { useState, useEffect } from 'react'
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
import ListingUser from '../components/ListingUser'
import Spinner from '../components/Spinner'


function Profile() {
  const auth = getAuth();
  const [adminEmail, setAdminEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [newImage, setNewImage] = useState(false);
  const [usersExist, setUsersExist] = useState(false);
  const [searchUser, setSearchUser] = useState('');
  const [usersListing, setUsersListing] = useState([]);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    avatar: '',
    organisation: ''
  });
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
          // get document data
          const userSnap = await getDoc(userRef);
          if(userSnap.exists) {
            console.log(`user profile: ${userSnap.data()}`);
            setFormData((prevState) => ({
              ...prevState,
              name: userSnap.data().name,
              email: userSnap.data().email,
              // avatar: userSnap.data().avatar,
              organisation: userSnap.data().organisation
            }));
            setAvatarUrl(userSnap.data().avatar);
            console.log(`start db avatarUrl: ${avatarUrl}`);
          } else {
            console.log('No such user!');
          }          
        }

        fetchUserProfile(user);

        setLoggedIn(true);
        setLoading(false);
      } else {
        <Spinner />;
      }
    });
  }, [auth, avatarUrl]);



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


  // for profile update
  const formOnChange = (e) => {
    if(e.target.files) {
      console.log(`what is in the file upload field: ${e.target.files} and value: ${e.target.value}`);
      if(e.target.files !== undefined && e.target.value !== '') {
        console.log(`Step 1: onChange got image: ${e.target.files}`);
        setNewImage(true);
        setFormData((prevState) => ({
          ...prevState,
          avatar: e.target.files[0]
        }));
      } else {
        setNewImage(false);
      }      
    } else {
      setFormData((prevState) => ({
        ...prevState,
        [e.target.id]: e.target.value
      }));
    };

  };

  const formOnSubmit = async () => {
    try {
      // update name if changed
      if(auth.currentUser.displayName !== name) {
        await updateProfile(auth.currentUser, {
          displayName: name,
        });
      };

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
        });           
      };

      if(newImage) {
        const imageUrl = await storeImage(avatar)
        .catch(() => {
          setLoading(false);
          toast.error('Image not uploaded', {hideProgressBar: true, autoClose: 3000});
          return;
        });

        // update avatar in firebase db
        const userRef = doc(db, 'users', auth.currentUser.uid);
        try {
          await updateDoc(userRef, {
            avatar: imageUrl,
          });
        } catch (error) {
          console.log(error);
        };

        console.log(`avatarUrl in store: ${imageUrl}`);
        setAvatarUrl(imageUrl);
      }; 
      

      // update name in firestore
      const userRef = doc(db, 'users', auth.currentUser.uid);
      try {
        await updateDoc(userRef, {
          name,
        });
      } catch (error) {
        console.log(error);
      }

    } catch (error) {
      console.log(`update user info error: ${error}`);
      toast.error('Could not update user profile', {hideProgressBar: true, autoClose: 3000});
    }  
  };


    //List all users in users
    const showUsers = async () => {     
      try {
        setLoading(true);
        const usersRef = collection(db, 'users');
        const usersArray = [];
        const usersSnapshot = await getDocs(usersRef);
        console.log(`what is the userSnapshot: ${usersSnapshot}`);
        if(usersSnapshot) {
          usersSnapshot.forEach((doc) => {
            return usersArray.push({
              id: doc.id,
              data: doc.data()
            });
          });

          setUsersExist(true);
        }

        setUsersListing(usersArray);
        console.log(usersListing);
        setLoading(false);
      } catch (error) {
        console.log(`Listing all users error: ${error}`);
      }  
    }
  



    //user search
    const searchUserOnChange = async (e) => { 
      setSearchUser(e.target.value);

      try {

        console.log(`search input: ${e.target.value}`);
        // get collection reference
        const usersRef = collection(db, 'users');
        console.log(`usersRef got? : ${usersRef}`);
        // create a query
        const q = query(
          usersRef,
          where('name', '==', e.target.value),
          orderBy('timestamp', 'desc')
        );

        let users = [];
        // execute query
        const querySnap = await getDocs(q);
        if(querySnap) {
          querySnap.forEach((doc) => {
            return users.push({
              id: doc.id,
              data: doc.data()
            });
          });
        };
        
        setUsersListing(users);
        setLoading(false);   
      } catch (error) {
        console.log(`getting user list error: ${error}`);
      };
      
    };

    // const searchUserOnSubmit = () => {

    // };


  const onDisable = (userId) => { 
    if (window.confirm('Are you sure you want to delete?')) {
      toast.success(`${userId} locked`, {hideProgressBar: true, autoClose: 3000})
    }; 
  };




  if(loading) { return <Spinner />};
  
  return <>
    {loggedIn ? (
      <div className='container'>
          <header className="heading">Personal Details {isAdmin && <span style={{color: 'pink', fontSize: '16px'}}>Admin</span>}</header>
          <main>               
            <section className='form'>                   
              <form>
                <div className="form-group">
                  {avatarUrl !== '' && <img src={avatarUrl} alt={name} className='avatarDisplay'/>}
                  <label>Upload an Avatar</label>
                  <input 
                    type='file'
                    id='avatar'
                    accept='.jpg, .png, .jpeg'
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
                <p style={{paddingTop: '30px', paddingBottom: '10px', textAlign: 'left', fontWeight: 'bold'}}>User Management</p> 
                <form>
                  <div className='form-group'>
                  <label htmlFor="searchUser">Search Users by Name</label>
                    <input 
                      type='text'
                      id='searchUser'
                      // value={searchUser}
                      className='form-control'
                      onChange={searchUserOnChange}
                    />
                  </div>
                </form>

                <button className='btn btn-block' onClick={showUsers}>List all users</button>

                {usersExist && (
                  <div>
                    <ul>
                      {usersListing.map((userItem) => (
                        <ListingUser 
                          userData={userItem.data} 
                          id={userItem.id} 
                          key={userItem.id} 
                          onDisable={() => onDisable(userItem.id)}
                        />
                      ))}
                    </ul>
                  </div>)                 
                }       
              </section>
            )} 

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