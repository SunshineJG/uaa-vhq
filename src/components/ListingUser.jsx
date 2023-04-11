import { useState } from 'react';
import { FaUnlock, FaLock, FaEye } from 'react-icons/fa';
import vhq_logo from '../assets/jpg/vhq_logo.jpg';

function ListingUser({ userData, id, onDisable, onEnable, onView }) {

  return (
    <div>
      <li className={userData.disabled ? 'usersListing-reverse' : 'usersListing'}>
        {userData.avatar !== '' ? (<img src={userData.avatar} alt={userData.name} className='avatarDisplay'/>) : <img src={vhq_logo} alt={userData.name} className='avatarDisplay'/>}       
        <div>
          <p>{userData.name}</p>
          <p>{userData.email}</p>
          <p>{userData.orgnisation}</p>
        </div>
        {onView && (
          <FaEye onClick={() => onView(id)} />
        )}
        {userData.disabled && onEnable && (
          <FaLock onClick={() => onEnable(id)} />
        )}
        {!userData.disabled && onDisable && (
          <FaUnlock onClick={() => onDisable(id)} />
        )}
      </li>
    </div>
  )
}

export default ListingUser
