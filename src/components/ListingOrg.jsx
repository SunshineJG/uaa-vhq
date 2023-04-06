import { useNavigate, useSearchParams } from 'react-router-dom'
import { FaEdit, FaEye, FaTrash } from 'react-icons/fa'
import vhq_logo from '../assets/jpg/vhq_logo.jpg'

function ListingOrg({orgData, id, onEdit, onDelete, view }) {

  const navigate = useNavigate();
  // const params = useSearchParams({
  //   q: id
  // });
  // console.log(`listing page params: ${params}`);

  return (
    <div>
      <li className='usersListing'>
        {orgData.orgLogo !== '' ? (<img src={orgData.orgLogo} alt={orgData.orgName} className='avatarDisplay'/>) : <img src={vhq_logo} alt={orgData.orgName} className='avatarDisplay'/>}       
        <div>
          <p style={{fontWeight: 'bold', fontSize: '1.25rem'}}>{orgData.orgName}</p>
          <p><span style={{fontWeight: 'bold'}}>Creator: </span>{orgData.orgCreator}</p>         
        </div>
        <div>
          <p style={{fontWeight: 'bold'}}>Admin:</p>  
          {orgData.orgAdmin.map((admin) => (<p key={admin}>{admin}</p>))}
        </div>
        {/* {view && <> */}
          {onEdit && (
            <FaEye onClick={() => onEdit(id)}/>
          )}
        {/* </>
        } */}
        
      </li>
    </div>
  )
}

export default ListingOrg
