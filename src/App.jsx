import { useEffect, useState } from 'react'
import Navbar from './components/Navbar'
import Login from './components/Auth/Login'
import { Outlet, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { addUser, removeUser } from './store/userSlice'
import conf from './config/config'
import authService from './appwrite/auth'
import Footer from './components/Footer'

function App() {

  const dispatch = useDispatch()

  useEffect(()=>{
    const checkLoginStatus = async () => {
      const user = await authService.getCurrentUser()
      if (user){
        dispatch(addUser(user))

      }
    }
    checkLoginStatus()

  },[])


  return (
   <div className='bg-orange-50 w-full min-h-screen'>
     <Navbar/>
     <Outlet/>
     <Footer/>
   </div>
   
  )
}

export default App
