import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { addUser } from './store/userSlice';
import authService from './appwrite/auth';
import { ClipLoader } from 'react-spinners';

function App() {
  const user = useSelector(state => state.user);
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = React.useState(true);

  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const res = await authService.getCurrentUser();
        if (res) {
          dispatch(addUser(res));
        }
      } catch (error) {
        console.log(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    checkUserStatus();
  }, [dispatch]);

  if (isLoading) {
    return (<>
      <Navbar/>
      <div className="flex items-center justify-center min-h-screen">
        <ClipLoader size={50} color={"#123abc"} loading={isLoading} />
      </div>
    </>
    );
  }

  return (
    <div className='bg-orange-50 w-full min-h-screen'>
      <Navbar />
      <Outlet />
      <Footer />
    </div>
  );
}

export default App;
