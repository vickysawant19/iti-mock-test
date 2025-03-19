import { useRef } from "react";

const useScrollToItem = (items = [], keyField = "moduleId") => {
  const itemRefs = useRef({});
  const hasScrolledRef = useRef(false);

  // Function to scroll to a specific key
  const scrollToItem = (key, isClick = false) => {
    const element = itemRefs.current[key];
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      isClick &&
        setTimeout(() => {
          element.click();
        }, 500);
    } else {
      // Only attempt to scroll to the last item **if it exists in refs**
      const lastItem = hasScrolledRef.current
        ? items[items.length - 1]
        : items[0];
      if (lastItem && itemRefs.current[lastItem[keyField]]) {
        itemRefs.current[lastItem[keyField]].scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        isClick &&
          setTimeout(() => {
            itemRefs.current[lastItem[keyField]].click();
          }, 500);
      }
    }
    hasScrolledRef.current = true;
  };

  return { itemRefs, scrollToItem };
};

export default useScrollToItem;
