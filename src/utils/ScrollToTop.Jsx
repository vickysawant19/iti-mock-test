import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const location = useLocation();
  console.log("scroll to top")

  useEffect(() => {
    // Scroll to the top with smooth behavior on route change
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, [location]); // Runs whenever the location changes

  return null; // This component doesn't render anything
};

export default ScrollToTop;
