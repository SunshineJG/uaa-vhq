import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaEdit, FaEye, FaTrash } from 'react-icons/fa';
import vhq_logo from '../assets/jpg/vhq_logo.jpg';

function ListingOrg({orgData, id, onView, onDelete }) {
  const orgAdmin = [];
  orgData.admins.forEach((user) => {
    orgAdmin.push({
      name: user.name,
      email: user.email
    });
  });
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
        </div>
        <div>
          <p style={{fontWeight: 'bold'}}>Admin:</p>  
          {orgData.orgAdmin.map((admin) => (<p key={admin.email}>{admin.name}<span style={{fontStyle: 'italic'}}>{admin.email}</span></p>))}
        </div>
        {/* {view && <> */}
          <div>
            {onView && (
              <button onClick={() => onView(id)} className="btn btn-reverse" style={{marginBottom: '10px'}}>Details</button>
              // <FaEye onClick={() => onEdit(id)}/>
            )}
            {onDelete && (
              <button onClick={() => onDelete(id)} className="btn btn-reverse">Delete</button>
              // <FaEye onClick={() => onEdit(id)}/>
            )}
          </div>
          
        {/* </>
        } */}
        
      </li>
    </div>
  )
}

export default ListingOrg
