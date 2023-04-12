import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Home from './pages/Home'
import Register from './pages/Register'
import Login from './pages/Login'
import Profile from './pages/Profile'
import ForgotPassword from './pages/ForgotPassword'
import Orgnisation from './pages/Orgnisation'
import Orginfo from './pages/Orginfo'
import User from './pages/User'
import Userinfo from './pages/Userinfo'
import Header from './components/Header'


function App() {
  return <>
    <Router>
      <div className="container">
        <Header />
      
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/register' element={<Register />} />
          <Route path='/login' element={<Login />} />
          <Route path='/profile/:userId' element={<Profile />} />
          <Route path='/forgot-password' element={<ForgotPassword />} />
          <Route path='/orgs' element={<Orgnisation />} />
          <Route path='/orgs/:orgId' element={<Orginfo />} />
          <Route path='/users' element={<User />} />
          <Route path='/users/:userId' element={<Userinfo />} />
        </Routes>
      </div>
    </Router>

    <ToastContainer />
  </>
}

export default App;
