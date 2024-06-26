import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { Route, Router, RouterProvider, createBrowserRouter, createRoutesFromElements } from 'react-router-dom'
import Login from './components/Auth/Login.jsx'
import Signup from './components/Auth/Signup.jsx'
import About from './components/About.jsx'
import { Provider } from 'react-redux'
import { store } from './store/store.js'
import ProtectedRoute from './components/private/ProtectedRoute.jsx'
import Home from './components/private/Home.jsx'
import CreateQuestion from './components/private/CreateQuestion.jsx'
import ManageQuestions from './components/private/ManageQuestions.jsx'
import EditQuestion from './components/private/EditQuestion.jsx'

import CreateMockTest from './components/private/CreateMockTest.jsx'
import MockTestGreet from './components/private/MockTestGreet.jsx'



const router = createBrowserRouter(createRoutesFromElements(
  <Route>
    <Route path='' element={<App/>}>
      <Route index path='/login' element={<Login/>}/>
      <Route path='/signup' element={<Signup/>}/>
      <Route path='/about' element={<About/>}/>
      <Route element={<ProtectedRoute/>}>
        <Route index path='dash' element={<Home/>}/>
        <Route path='create-question' element={<CreateQuestion/>}/>
        <Route path='manage-questions' element={<ManageQuestions/>}/>
        <Route path='edit/:quesId' element={<EditQuestion/>}/>
        <Route path='mock-exam' element={<CreateMockTest/>}/>
        <Route path='mock-exam/:paperId' element={<MockTestGreet/>}/>
        <Route path='start-exam/:paperId' element={<MockTestGreet/>}/>
      </Route>
    </Route>
  </Route>
  
))

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>

    <RouterProvider router={router}/>
    </Provider>
  </React.StrictMode>,
)
