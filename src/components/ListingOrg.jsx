import { useNavigate, useSearchParams } from 'react-router-dom'
import { FaEdit, FaEye, FaTrash } from 'react-icons/fa'
import vhq_logo from '../assets/jpg/vhq_logo.jpg'

function ListingOrg({orgData, id, onEdit, onDelete }) {

  const navigate = useNavigate();
  const params = useSearchParams({
    q: id
  });

  return (
    <div>
      <li className='usersListing'>
        {orgData.orgLogo !== '' ? (<img src={orgData.orgLogo} alt={orgData.orgName} className='avatarDisplay'/>) : <img src={vhq_logo} alt={orgData.orgName} className='avatarDisplay'/>}       
        <div>
          <p>{orgData.orgName}</p>
          <p>Creator: {orgData.orgCreator}</p>         
        </div>
        <div>
          <p>Admin:</p>  
          {orgData.orgAdmin.map((admin) => (<p key={admin}>{admin}</p>))}
        </div>
        {onEdit && (
          <FaEdit onClick={() => {navigate(`/orgs/${params}`)} }/>
        )}
      </li>
    </div>
  )
}

export default ListingOrg
