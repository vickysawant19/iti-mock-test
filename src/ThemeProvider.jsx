import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeProviderContext = createContext({ theme: "light", setTheme: () => {} });

export function ThemeProvider({ children, defaultTheme = "light", storageKey = "ui-theme" }) {
  const [theme, setTheme] = useState(() => {
    // Get saved theme from localStorage if available
    const storedTheme = localStorage.getItem(storageKey);
    
    // Check for system preferences if no stored theme
    if (!storedTheme) {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      return prefersDark ? "dark" : defaultTheme;
    }
    
    return storedTheme;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove both class possibilities
    root.classList.remove("light", "dark");
    
    // Add the current theme class
    root.classList.add(theme);
    
    // Store the theme preference
    localStorage.setItem(storageKey, theme);
  }, [theme, storageKey]);

  const value = {
    theme,
    setTheme: (newTheme) => setTheme(newTheme),
  };

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  
  return context;
}