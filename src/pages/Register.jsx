import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { createUserWithEmailAndPassword, updateProfile, onAuthStateChanged } from 'firebase/auth'
import { setDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db, auth } from '../firebase.config'
import { toast } from 'react-toastify'
import { FaUser } from 'react-icons/fa'
import { useAuthStatus } from '../hooks/useAuthStatus'

function Register() {
  const { loggedIn } = useAuthStatus();
  // const [loggedIn, setLoggedIn] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password2: '',
  });

  const { name, email, password, password2 } = formData;

  const navigate = useNavigate();

  // choose this or useAuthStatus 
  // useEffect(() => {
  //   onAuthStateChanged(auth, (user) => {
  //     if(user) {
  //       setLoggedIn(true);
  //     }
  //   })
  // }, []);


  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    if(password !== password2) {
      toast.error('Passwords do not match', {hideProgressBar: true, autoClose: 3000})
    } else {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          console.log(`Register of userCredential: ${userCredential}`);
          const user = userCredential.user;

          updateProfile(auth.currentUser, {
            displayName: name,
          });
          
          const userData = {
            ...formData,
            organisation: '',
            avatar: '',
            disabled: false,
            timestamp: serverTimestamp()
          };

          delete userData.password2;

          await setDoc(doc(db, 'users', user.uid), userData);

          navigate(`/profile/${user.uid}`);
        } catch (error) {
          console.log(error);
          toast.error('Something went wrong with registeration.', {hideProgressBar: true, autoClose: 3000});
        }
    
    };

  };


  return <>
    {loggedIn ? (
      <>
        <section className='heading'>
          <h1>
            You are registered user already!
          </h1>
        </section>
      </>
    ) : ( <>
            <section className='heading'>
              <h1>
                <FaUser /> Register 
              </h1>
              <p>Please create an account</p>
            </section>

            <section className='form'>
              <form onSubmit={onSubmit}>
                <div className="form-group">
                  <input 
                    type="text"
                    id='name'
                    name='name'
                    value={name}
                    onChange={onChange}
                    className='form-control'
                    placeholder='Enter your name'
                    required
                  />
                </div>
                <div className='form-group'>
                  <input 
                    type='email'
                    id='email'
                    name='email'
                    value={email}
                    onChange={onChange}
                    className='form-control'
                    placeholder='Enter your email'
                    required
                  />
                </div>
                <div className='form-group'>
                  <input 
                    type='password'
                    id='password'
                    name='password'
                    value={password}
                    onChange={onChange}
                    className='form-control'
                    placeholder='Enter your password'
                    required
                  />
                </div>
                <div className='form-group'>
                  <input 
                    type='password'
                    id='password2'
                    name='password2'
                    value={password2}
                    onChange={onChange}
                    className='form-control'
                    placeholder='Confirm your password'
                    required
                  />
                </div>
                <div className='form-group'>
                  <button className='btn btn-block'>Submit</button>
                </div>
              </form>
            </section>
      </> )
    }
  </>
}

export default Register
