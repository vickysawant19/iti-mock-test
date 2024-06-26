import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';
import authService from '../../appwrite/auth';
import { addUser } from '../../store/userSlice';
import { ClipLoader } from 'react-spinners';

const ProtectedRoute = () => {
  const user = useSelector(state => state.user);
  const [isLoading, setIsLoading] = useState(true);


  const dispatch = useDispatch()

  useEffect(() => {
   
    const checkUser = async () => {
      const user = await authService.getCurrentUser()
      dispatch(addUser(user))
      setIsLoading(false);
    };
    checkUser();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ClipLoader size={50} color={"#123abc"} loading={isLoading} />
      </div>
    );
  }

  return user ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedRoute;
