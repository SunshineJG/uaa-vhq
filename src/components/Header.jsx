import { useState, useEffect } from 'react'
import { FaSignInAlt, FaSignOutAlt, FaUser, FaHome, FaUserPlus } from 'react-icons/fa'
import { Link, useNavigate } from 'react-router-dom'
import { auth } from '../firebase.config'
import vhq_logo from '../assets/jpg/vhq_logo.jpg'
// import { useAuthStatus } from '../hooks/useAuthStatus'
import { onAuthStateChanged } from 'firebase/auth'

function Header() {
  // const { loggedIn, checkingStatus } = useAuthStatus();
  const [loggedIn, setLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if(user) {
        setLoggedIn(true);
      }
    })
  }, []);


  console.log(`Header login status: ${loggedIn}`);

  const onLogout = () => {
    setLoggedIn(false);
    auth.signOut();
    navigate('/');
  };

  return (
    <header className="header">
      <ul>      
        <li><img src={vhq_logo} alt="vhq" width="30" height="30"/>
        </li>
        <li><Link to='/'>Vision HQ</Link></li>
      </ul>
      <ul>
        {loggedIn ? (
          <>
            <li>
              <Link to='/'>
                <FaHome />Home
              </Link>
            </li>
            <li>
              <Link to='/profile'>
                <FaUser />Profile
              </Link>
            </li>
            <li>
              <button className='btn' onClick={onLogout}><FaSignOutAlt />Logout</button>
            </li>
          </>          
        ) : (<>
        <li>
          <Link to='/login'>
            <FaSignInAlt />Login
          </Link>
        </li>
        <li>
          <Link to='/register'>
            <FaUserPlus />Register
          </Link>
        </li>
        </>)}
      </ul>
    </header>
  )
}

export default Header
