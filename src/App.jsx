
import Navbar from './components/Navbar'
import { Outlet} from 'react-router-dom'
import Footer from './components/Footer'

function App() {

  return (
   <div className='bg-orange-50 w-full min-h-screen'>
     <Navbar/>
     <Outlet/>
     <Footer/>
   </div>
   
  )
}

export default App
