import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signInWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { auth, db } from '../firebase.config'
import { toast } from 'react-toastify'
import { FaSignInAlt } from 'react-icons/fa'
import { useAuthStatus } from '../hooks/useAuthStatus'

function Login() {
  const { loggedIn } = useAuthStatus();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const { email, password } = formData;

  const navigate = useNavigate();

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log(`Login userCredential: ${userCredential}`);
      
      if(userCredential.user) {
        navigate(`/profile/${userCredential.user.uid}`);
      }
    } catch (error) {
      toast.error(`${error.code}`, {hideProgressBar: true, autoClose: 3000});
    }
  };


  return <>
    {loggedIn ? (
      <>
        <section className='heading'>
          <h1>
            You have logged in already!
          </h1>
        </section>
      </>
    ) : ( <>
          <section className='heading'>
            <h1>
              <FaSignInAlt /> Login
            </h1>
            <p>Please login in to get your service</p>
          </section>

          <section className='form'>
            <form onSubmit={onSubmit}>
              <div className="form-group">
                <input 
                  type="email"
                  id='email'
                  name='email'
                  value={email}
                  onChange={onChange}
                  className='form-control'
                  placeholder='Enter your email'
                  required
                />
              </div>
              <div className="form-group">
                <input 
                  type="password"
                  id='password'
                  name='password'
                  value={password}
                  onChange={onChange}
                  className='form-control'
                  placeholder='Enter your password'
                  required
                />
              </div>
              <div className="form-group">
                <button className='btn btn-block'>Login</button>
              </div>
            </form>

            <div className="form-group">
                <Link to='/forgot-password' className='btn btn-block'>Forgot Password</Link>
            </div>
          </section>
        </>)
    }

  </>

}




export default Login
