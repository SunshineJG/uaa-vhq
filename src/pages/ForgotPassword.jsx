import { useState } from 'react'
import { Link } from 'react-router-dom'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '../firebase.config'
import { toast } from 'react-toastify';

function ForgotPassword() {
  const [email, setEmail] = useState('');

  const onChange = (e) => setEmail(e.target.value);

  const onSubmit = async (e) => {
    e.preventDefault();

    try {
      await sendPasswordResetEmail(auth, email);
      console.log(auth.currentUser);
      toast.success('Email was sent', {hideProgressBar: true, autoClose: 3000})
    } catch (error) {
      toast.error('Could not send reset email', {hideProgressBar: true, autoClose: 3000})
    }
  };

  return <>
    <section className='heading'>
      <p>Please enter email to reset your password</p>
    </section>

    <main className='form'>
      <div className="form-group">
        <form onSubmit={onSubmit}>
          <input 
            type='email'
            id='email'
            name='emai'
            value={email}
            onChange={onChange}
            className='form-control'
            placeholder='Email'
            required
          />
          <div className="form-control">
            <button className="btn btn-block">Send Reset Link</button>
          </div>

          <Link className='btn btn-reverse btn-block' to='/login'>Login</Link>
        </form>
      </div>
    
    </main>
    
  </>
    

}

export default ForgotPassword
