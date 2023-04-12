import { useLocation, useNavigate } from 'react-router-dom'
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase.config'
import { toast } from 'react-toastify'
import googleIcon from '../assets/svg/googleIcon.svg'

function OAuth() {
  const navigate = useNavigate();
  const location = useLocation();

  const onGoogleClick = async () => {
    try {
      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check for user
      const docRef = doc(db, 'users', user.uid);
      const docSnapShot = await getDoc(docRef);

      // If user doesn't exist, create user in users collection
      if(!docSnapShot.exists()) {
        console.log('creating user...');
        await setDoc(doc(db, 'users', user.uid), {
          name: user.displayName,
          email: user.email,
          organisation: '',
          avatar: '',
          disabled: false,
          timestamp: serverTimestamp()
        });
      };

      navigate(`/profile/${user.uid}`);
    } catch (error) {
      console.log(`google oauth: ${error}`);
      toast.error('Could not authorize with Google!', {hideProgressBar: true, autoClose: 3000});
    };
  };

  return (
    <div className='socialLogin'>
      <p>{location.pathname === '/register' ? 'Sign Up' : 'Login'} with </p>
      <button className='socialIconDiv' onClick={onGoogleClick}>
        <img className='socialIconImg'  src={googleIcon} alt='google' />
      </button>
    </div>
  )
}

export default OAuth
