import { useRef } from "react";

const useScrollToItem = (items = [], keyField = "moduleId") => {
  const itemRefs = useRef({});

  // Function to scroll to a specific key
  const scrollToItem = (key, isClick= false) => {

    console.log("scroll trigger")
    const isMobile = window.innerWidth < 768;
    
    const element = itemRefs.current[key];
    if(isMobile) {
      console.log("ismobile", isMobile)
      return
    }
    console.log("scroll")
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
      isClick && 
      setTimeout(() => {
        element.click();
      }, 500);
    } else {
      // Only attempt to scroll to the last item **if it exists in refs**
      const lastItem = items[items.length - 1];
      if (lastItem && itemRefs.current[lastItem[keyField]]) {
        itemRefs.current[lastItem[keyField]].scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
       isClick && setTimeout(() => {
          lastElement.click();
        }, 1000);
      }


    }
  };

  return { itemRefs, scrollToItem };
};

export default useScrollToItem;
