import { useState, useEffect } from 'react';
import { FaSignInAlt, FaSignOutAlt, FaUser, FaHome, FaUserPlus, FaBuilding } from 'react-icons/fa';
import { MdPeople } from 'react-icons/md'
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../firebase.config';
import vhq_logo from '../assets/jpg/vhq_logo.jpg';
// import { useAuthStatus } from '../hooks/useAuthStatus';
import { onAuthStateChanged } from 'firebase/auth';

function Header() {
  // const { loggedIn, checkingStatus } = useAuthStatus();
  const [loggedIn, setLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userProfileUrl, setUserProfileUrl] = useState('');
  const navigate = useNavigate();



  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if(user) {
        setLoggedIn(true);
        user.getIdTokenResult().then(idTokenResult => {
          if(idTokenResult.claims.admin) {
            setIsAdmin(true);
          };
        });
        console.log(`user displayName: ${user.displayName}`);
        console.log(`header user ${user.uid}`);
        const params = new URLSearchParams({
          q: user.uid
        });
        setUserProfileUrl(`/profile/${params}`);
        console.log(`url realdy: ${userProfileUrl}`);
      }
    })
  }, [userProfileUrl]);


  console.log(`Header login status: ${loggedIn}`);

  const onLogout = () => {
    setLoggedIn(false);
    setIsAdmin(false);
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
            {isAdmin && (
              <li>
                <Link to='/users'>
                  <MdPeople />Users
                </Link>
              </li>
            )}
            <li>
              <Link to='/orgs'>
                <FaBuilding />Orgnisation
              </Link>
            </li>
            <li>
              <Link to={userProfileUrl}>
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
