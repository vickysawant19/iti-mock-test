import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { NavLink } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";
import authService from "../appwrite/auth";
import { removeUser } from "../store/userSlice";
import logo from "../assets/logo.jpeg";

const Navbar = () => {
  const user = useSelector((state) => state.user);
  const dispatch = useDispatch();

  const handleLogout = async () => {
    try {
      if (user) {
        await authService.logout();
        dispatch(removeUser());
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="bg-blue-600 h-14 w-full p-3 flex fixed z-10 shadow-md">
      <div className="flex items-center justify-between max-w-screen-lg w-full mx-auto">
        <div className="font-bold text-white text-lg flex items-center gap-2">
          <img
            className="w-10 h-10 rounded-full shadow-xl mix-blend-screen"
            src={logo}
            alt="ITI"
            srcset=""
          />
          ITI MOCK TEST
        </div>
        <div className="text-white flex gap-6 items-center font-semibold">
          <NavLink to="/about" className="hover:text-gray-200">
            About
          </NavLink>
          {user ? (
            <>
              <NavLink to="/dash" className="hover:text-gray-200">
                Home
              </NavLink>
              <div className="relative group p-2">
                <FaUserCircle size={24} className="cursor-pointer" />
                <div className="absolute right-0 top-8 w-40 bg-white text-black rounded-md shadow-lg p-2 hidden group-hover:block">
                  <NavLink
                    to="/profile"
                    className="block px-4 py-2 hover:bg-gray-200 rounded-md"
                  >
                    Profile
                  </NavLink>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-200 rounded-md"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <NavLink to="/login" className="hover:text-gray-200">
                Login
              </NavLink>
              <NavLink to="/signup" className="hover:text-gray-200">
                SignUp
              </NavLink>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
