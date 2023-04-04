import { FaUnlock } from 'react-icons/fa'
import vhq_logo from '../assets/jpg/vhq_logo.jpg'

function ListingUser({ userData, id, onDisable }) {
  return (
    <div>
      <li className='usersListing'>
        {userData.avatar !== '' ? (<img src={userData.avatar} alt={userData.name} className='avatarDisplay'/>) : <img src={vhq_logo} alt={userData.name} className='avatarDisplay'/>}       
        <div>
          <p>{userData.name}</p>
          <p>{userData.email}</p>
          <p>{userData.orgnisation}</p>
        </div>
        {onDisable && (
          <FaUnlock onClick={() => onDisable(userData.name)} />
        )}
      </li>
    </div>
  )
}

export default ListingUser
