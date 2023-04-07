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
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
// import { useAuthStatus } from '../hooks/useAuthStatus'
import { toast } from 'react-toastify'
import ListingUser from '../components/ListingUser'
import ListingOrg from '../components/ListingOrg'
import Spinner from '../components/Spinner'


function Profile() {
  const auth = getAuth();
  const [adminEmail, setAdminEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [newImage, setNewImage] = useState(false);
  const [searchUserInput, setSearchUserInput] = useState('');
  const [userSearchResult, setUserSearchResult] = useState([]);
  const [clearUserSearchResult, setClearUserSearchResult] = useState(false);
  const [usersListing, setUsersListing] = useState([]);
  const [clearUsersListing, setClearUsersListing] = useState(false);

  const [searchOrgInput, setSearchOrgInput] = useState('');
  const [orgSearchResult, setOrgSearchResult] = useState([]);
  const [clearOrgSearchResult, setClearOrgSearchResult] = useState(false);
  const [orgsListing, setOrgsListing] = useState([]);
  const [clearOrgsListing, setClearOrgsListing] = useState(false);

  const [user, setUser] = useState(null);
  const [userCopy, setUserCopy] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    avatar: '',
    organisation: '',
    disabled: false
  });
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [updateClick, setUpdateClick] = useState(false);
  const [orgFormData, setOrgFormData] = useState({
    orgName: '',
    orgCreator: '',
    orgAdmin: [],
    orgLogo: '',
    members: [],
    devices: []
  });
  const [orgAdmins, setOrgAdmins] = useState('');

  const { name, email, avatar } = formData;
  const { orgName } = orgFormData;
  // const {loggedIn} = useAuthStatus();
  // const user = auth.currentUser;

  const navigate = useNavigate();

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


  // Profile update
  const profileFormOnChange = (e) => {
    let boolean = null;

    if(e.target.value === 'true') {
      boolean = true
    };

    if(e.target.value === 'false') {
      boolean = false
    };

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
        [e.target.id]: boolean ?? e.target.value,
      }));
    };

  };

  const profileFormOnSubmit = async () => {
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


    // List all users
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
        };

        setUsersListing(usersArray);
        setClearUsersListing(true);
        console.log(usersListing);
        setLoading(false);
      } catch (error) {
        console.log(`Listing all users error: ${error}`);
      } 
    }
  



    // Search user by name
    const searchUserOnChange = (e) => {
      setSearchUserInput(e.target.value);
      console.log(`get search input: ${searchUserInput}`);
    }


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
          setLoading(false);
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
          setLoading(false);
        };

        setSearchUserInput('');
      };
    };

    const clearUserSearchResultonClick = () => {
      setUserSearchResult([]);
      setClearUserSearchResult(false);
    };

    const clearUsersListingonClick = () => {
      setUsersListing([]);
      setClearUsersListing(false);
    };


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

    const onEdit = (orgId) => navigate(`/orgs/${orgId}`);

    const onDelete = (orgId) => { 
      if (window.confirm('Sure to delete this organisation?')) {
        toast.success(`${orgId} locked`, {hideProgressBar: true, autoClose: 3000});
      }; 
    };


    // Create an organisation
    const orgFormNameOnChange = (e) => {
      setOrgFormData((prevState) => ({
        ...prevState,
        orgCreator: auth.currentUser.email,
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

    const orgFormOnSubmit = async (e) => {
      e.preventDefault();

      console.log(`saved in orgFormData orgAdmin array: ${orgFormData.orgAdmin}`);
      setLoading(true);
      const docRef = await addDoc(collection(db, 'orgs'), orgFormData);

      console.log(`org added with id: ${docRef.id}`);
      setLoading(false);
      setOrgFormData({
        orgName: '',
        orgCreator: '',
        orgAdmin: [],
        orgLogo: '',
        members: [],
        devices: []
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

    
    const showOrgs = async () => {
      try {
        setLoading(true);
        const orgsRef = collection(db, 'orgs');
        const orgsArray = [];
        const q = query(
          orgsRef,
          orderBy('orgName'),
          // orderBy('name', (a, b) => {
          //   const nameA = a.data().name.toLowerCase();
          //   const nameB = b.data().name.toLowerCase();
          //   if(nameA < nameB) return -1;
          //   if(nameA > nameB) return 1;
          //   return 0;
          // }),
        );
        const orgsSnapshot = await getDocs(q);
        console.log(`what is the orgSnapshot: ${orgsSnapshot.size}`);
        if(orgsSnapshot.size !== 0) {
          orgsSnapshot.forEach((doc) => {
            return orgsArray.push({
              id: doc.id,
              data: doc.data()
            });
          });
          setOrgsListing(orgsArray);
          setClearOrgsListing(true);
        } else {
          toast.error('No Orgnasation yet, add one please!', {hideProgressBar: true, autoClose: 3000});
        }

        setLoading(false);
      } catch (error) {
        console.log(`Listing all orgs error: ${error}`);
      }       
    };


    const clearOrgSearchResultonClick = () => {
      setOrgSearchResult([]);
      setClearOrgSearchResult(false);
    };

    const clearOrgsListingonClick = () => {
      setOrgsListing([]);
      setClearOrgsListing(false);
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
                    onChange={profileFormOnChange}
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
                    onChange={profileFormOnChange}
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
                profileFormOnSubmit()
                setUpdateClick((prevState) => !prevState)
                }} 
                className='btn btn-reverse' 
                style={{width: '50%'}}>
                {updateClick ? 'Done' : 'Edit Personal Info'}
              </div>
            </section>

            { isAdmin && <>
              <section className='form'>
                <header className="heading" style={{marginTop: '50px'}}>User Management</header> 
                <form onSubmit={searchUserOnSubmit}>
                  <div className='form-group'>
                  <label htmlFor="searchUser" style={{fontWeight: 'bold', marginBottom: '20px'}}>Search Users by Name</label>
                    <input 
                      type='text'
                      id='searchUser'
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
                        <ListingUser
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
                    <button onClick={clearUserSearchResultonClick} className='btn btn-block btn-reverse'>Clear Search Result</button>
                  </div>
                )}

                <div style={{paddingTop: '20px', paddingBottom: '20px'}}>
                  <button className='btn btn-block' onClick={showUsers}>List all users</button>
                </div>
                
                {usersListing && (
                  <div>
                    <ul>
                      {usersListing.map((userItem) => (
                        <ListingUser 
                          userData={userItem.data}
                          id={userItem.id} 
                          key={userItem.id} 
                          onDisable={() => onDisable(userItem.id)}
                          onEnable={() => onEnable(userItem.id)}
                          onView={() => onView(userItem.id)}
                        />
                      ))}
                    </ul>
                  </div>)                 
                }

                {clearUsersListing && (
                  <div>
                    <button onClick={clearUsersListingonClick} className='btn btn-block btn-reverse'>Hide Users Listing</button>
                  </div>
                )}
              </section>

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


              <section className='form'>                  
                <header className="heading" style={{marginTop: '50px'}}>Organisation Management</header>

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
                        <ListingOrg
                          orgData={orgItem.data}
                          id={orgItem.id}
                          key={orgItem.id}
                          onEdit={() => onEdit(orgItem.id)}
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


                <div style={{paddingTop: '20px', paddingBottom: '20px'}}>
                  <button className='btn btn-block' onClick={showOrgs}>List all ogranisations</button>
                </div>

                {orgsListing && (
                  <div>
                    <ul>
                      {orgsListing.map((orgItem) => (
                        <ListingOrg 
                          orgData={orgItem.data} 
                          id={orgItem.id} 
                          key={orgItem.id} 
                          onEdit={() => onEdit(orgItem.id)}
                          onDelete={() => onDelete(orgItem.id)}
                        />
                      ))}
                    </ul>
                  </div>)                 
                }

                {clearOrgsListing && (
                  <div>
                    <button onClick={clearOrgsListingonClick} className='btn btn-block btn-reverse'>Hide Organisatons List</button>
                  </div>
                )}

              </section>
            </>}             
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