import React from 'react'
import { NavLink } from 'react-router-dom'

const Navbar = () => {
  return (
    <div className='bg-blue-500 h-10 w-full p-2 flex justify-between fixed z-10'>
        <div className='font-bold text-white'>
            ITI MOCK TEST
        </div>
        <div className=' text-black flex gap-4 font-semibold'>
          <NavLink to={'about'}>About</NavLink>
          <NavLink to={'login'}>Login</NavLink>
          <NavLink to={'signup'} className='hidden'>SignUp</NavLink>
            
        </div>
    </div>
  )
}

export default Navbar