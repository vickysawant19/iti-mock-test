import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Navigate, Outlet, useNavigate } from 'react-router-dom'

const ProtectedRoute = ({ children }) => {
   const user = useSelector(state => state.user)
   const navigate = useNavigate()
    useEffect(()=>{
        if(!user){
            navigate('/login')
        }
    },[user])

  return <Outlet/>
}

export default ProtectedRoute
