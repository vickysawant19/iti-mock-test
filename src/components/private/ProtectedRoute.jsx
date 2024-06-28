import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import authService from '../../appwrite/auth';
import { addUser } from '../../store/userSlice';
import { ClipLoader } from 'react-spinners';

const ProtectedRoute = () => {
  const user = useSelector(state => state.user);

  return user ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedRoute;
