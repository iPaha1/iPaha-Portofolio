"use client"

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

export function ModeToggle() {
  const [isMounted, setIsMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  
  // Function to toggle the theme between 'light' and 'dark'
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };






  // useEffect(() => {
  //   setIsMounted(true);
  // } ,[]);





  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  

  return (
    <div className="hover:scale-110">
    <Button variant="totalghost" size="icon" onClick={toggleTheme}>
      {theme === 'dark' ? (
        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />
      ) : (
        <Moon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
    </div>
  );
}
