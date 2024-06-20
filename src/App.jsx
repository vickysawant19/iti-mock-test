import { useEffect, useState } from 'react'
import Navbar from './components/Navbar'
import Login from './components/Auth/Login'
import { Outlet, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { addUser, removeUser } from './store/userSlice'
import conf from './config/config'

function App() {
 
  

  const user = useSelector(state => state.user)
  console.log(user);
  
  const dispatch = useDispatch()

  useEffect(()=>{
     dispatch(removeUser())
  },[])
  

  const navigate = useNavigate()


  useEffect(()=>{
    if(!user) {
      navigate('/login')
    }
  },[user])

  return (
   <div className='bg-orange-50 w-full min-h-screen'>
     <Navbar/>
     <Outlet/>
   </div>
   
  )
}

export default App
