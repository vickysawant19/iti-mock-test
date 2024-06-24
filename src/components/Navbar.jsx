import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { NavLink } from 'react-router-dom'
import authService from '../appwrite/auth'
import { removeUser } from '../store/userSlice'

const Navbar = () => {
  const user = useSelector(state => state.user)
  const dispatch = useDispatch()

  const handleLogout = async () =>{
    try {
      if(user){
        await authService.logout()
        dispatch(removeUser())
      }
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <div className='bg-blue-500 h-10 w-full p-2 flex justify-between fixed z-10'>
        <div className='font-bold text-white'>
            ITI MOCK TEST
        </div>
        <div className=' text-black flex gap-4 font-semibold'>
          <NavLink to={'about'}>About</NavLink>
          
         {user ?  <> <NavLink to={'dash'}>Home</NavLink> <button onClick={handleLogout}>Logout</button></> : <><NavLink to={'login'}>Login</NavLink> <NavLink to={'signup'}>SignUp</NavLink></>}
          
            
        </div>
    </div>
  )
}

export default Navbar