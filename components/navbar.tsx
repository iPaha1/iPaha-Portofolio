"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ModeToggle } from './mode-toggle';
import Logo from './logo';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: 'About', href: '/#about' },
    { label: 'Projects', href: '/#projects' },
    { label: 'Skills', href: '/#skills' },
    { label: 'Contact', href: '/#contact' },
    { label: 'Blog', href: '/blog' },
  ];

  const isSelected = (href: string): boolean => {
    if (href.startsWith('/#')) {
      return pathname === '/' && typeof window !== 'undefined' && window.location.hash === href.slice(1);
    }
    return pathname.startsWith(href);
  };

  const renderNavItem = (item: { label: string; href: string }, index: number) => (
    <Link
      key={index}
      href={item.href}
      className={`block py-2 px-3 rounded-lg text-sm ${
        isSelected(item.href)
          ? 'font-bold text-black dark:text-white'
          : 'text-black dark:text-white hover:text-gray-900 dark:hover:text-gray-200'
      }`}
    >
      {item.label}
    </Link>
  );

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/80 dark:bg-black/80 backdrop-blur-sm shadow-md' : 'bg-transparent'}`}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/">
            <Logo />
          </Link>
          <div className="hidden md:flex space-x-4">
            {navItems.map(renderNavItem)}
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden md:block">
              <ModeToggle />
            </div>
            <div className="md:hidden flex items-center space-x-2">
              <ModeToggle />
              <Sheet>
                <SheetTrigger asChild>
                  <Menu className="h-6 w-6 cursor-pointer dark:text-white text-black" />
                </SheetTrigger>
                <SheetContent side="right" className="w-[200px]">
                  <div className="flex flex-col space-y-4 mt-4">
                    {navItems.map(renderNavItem)}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;



// "use client";

// import React, { useState, useEffect } from 'react';
// import Link from 'next/link';
// import { usePathname } from 'next/navigation';
// import { Menu } from 'lucide-react';
// import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
// import { ModeToggle } from './mode-toggle';
// import Logo from './logo';

// const Navbar = () => {
//   const [isScrolled, setIsScrolled] = useState(false);
//   const pathname = usePathname();

//   useEffect(() => {
//     const handleScroll = () => {
//       setIsScrolled(window.scrollY > 10);
//     };

//     window.addEventListener('scroll', handleScroll);
//     return () => window.removeEventListener('scroll', handleScroll);
//   }, []);

//   const navItems = [
//     { label: 'About', href: '/#about' },
//     { label: 'Projects', href: '/#projects' },
//     { label: 'Skills', href: '/#skills' },
//     { label: 'Contact', href: '/#contact' },
//     { label: 'Blog', href: '/blog' },
//   ];

//   const isActive = (href: string) => {
//     if (href.startsWith('/#')) {
//       return pathname === '/' && href === `/#${window.location.hash.slice(1)}`;
//     }
//     return pathname.startsWith(href);
//   };

//   return (
//     <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/80 dark:bg-black/80 backdrop-blur-sm shadow-md' : 'bg-transparent'}`}>
//       <div className="max-w-6xl mx-auto px-4">
//         <div className="flex justify-between items-center h-16">
//           <Link href="/">
//             <Logo />
//           </Link>
//           <div className="hidden md:flex space-x-4">
//             {navItems.map((item) => (
//               <Link
//                 key={item.label}
//                 href={item.href}
//                 className={`font-thin dark:text-white text-black hover:font-bold dark:hover:font-bold hover:text-gray-900 transition-colors ${
//                   isActive(item.href) ? 'font-bold text-black dark:text-white' : ''
//                 }`}
//               >
//                 {item.label}
//               </Link>
//             ))}
//           </div>
//           <div className="flex items-center space-x-4">
//             <div className="hidden md:block">
//               <ModeToggle />
//             </div>
//             <div className="md:hidden flex items-center space-x-2">
//               <ModeToggle />
//               <Sheet>
//                 <SheetTrigger asChild>
//                   <Menu className="h-6 w-6 cursor-pointer dark:text-white text-black" />
//                 </SheetTrigger>
//                 <SheetContent side="right" className="w-[200px]">
//                   <div className="flex flex-col space-y-4 mt-4">
//                     {navItems.map((item) => (
//                       <Link
//                         key={item.label}
//                         href={item.href}
//                         className={`text-black dark:text-white hover:text-gray-900 dark:hover:text-gray-200 transition-colors ${
//                           isActive(item.href) ? 'font-bold bg-red-500 border border-amber-500 dark:border-amber-500' : ''
//                         }`}
//                       >
//                         {item.label}
//                       </Link>
//                     ))}
//                   </div>
//                 </SheetContent>
//               </Sheet>
//             </div>
//           </div>
//         </div>
//       </div>
//     </nav>
//   );
// };

// export default Navbar;



// "use client";

// import React, { useState, useEffect } from 'react';
// import Link from 'next/link';
// import { Menu } from 'lucide-react';
// import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
// import { ModeToggle } from './mode-toggle';
// import Logo from './logo';

// const Navbar = () => {
//   const [isScrolled, setIsScrolled] = useState(false);

//   useEffect(() => {
//     const handleScroll = () => {
//       setIsScrolled(window.scrollY > 10);
//     };

//     window.addEventListener('scroll', handleScroll);
//     return () => window.removeEventListener('scroll', handleScroll);
//   }, []);

//   const navItems = [
//     { label: 'About', href: '#about' },
//     { label: 'Projects', href: '#projects' },
//     { label: 'Skills', href: '#skills' },
//     { label: 'Contact', href: '#contact' },
//     { label: 'Blog', href: '/blog' },
    
//   ];

//   return (
//     <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/80 dark:bg-black/80 backdrop-blur-sm shadow-md' : 'bg-transparent'}`}>
//       <div className="max-w-6xl mx-auto px-4">
//         <div className="flex justify-between items-center h-16">
//           <Link href="/">
//             <Logo />
//           </Link>
//           <div className="hidden md:flex space-x-4">
//             {navItems.map((item) => (
//               <Link
//                 key={item.label}
//                 href={item.href}
//                 className="font-thin dark:text-white text-black hover:font-bold dark:hover:font-bold hover:text-gray-900 transition-colors"
//               >
//                 {item.label}
//               </Link>
//             ))}
//           </div>
//           <div className="flex items-center space-x-4">
//             <div className="hidden md:block">
//               <ModeToggle />
//             </div>
//             <div className="md:hidden flex items-center space-x-2">
//               <ModeToggle />
//               <Sheet>
//                 <SheetTrigger asChild>
//                   <Menu className="h-6 w-6 cursor-pointer dark:text-white text-black" />
//                 </SheetTrigger>
//                 <SheetContent side="right" className="w-[200px]">
//                   <div className="flex flex-col space-y-4 mt-4">
//                     {navItems.map((item) => (
//                       <Link
//                         key={item.label}
//                         href={item.href}
//                         className="text-black dark:text-white hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
//                       >
//                         {item.label}
//                       </Link>
//                     ))}
//                   </div>
//                 </SheetContent>
//               </Sheet>
//             </div>
//           </div>
//         </div>
//       </div>
//     </nav>
//   );
// };

// export default Navbar;



// import React from 'react';
// import Link from 'next/link';
// import { Menu } from 'lucide-react';
// import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
// import { ModeToggle } from './mode-toggle';
// import Logo from './logo';

// const Navbar = () => {
//   const navItems = [
//     { label: 'About', href: '#about' },
//     { label: 'Projects', href: '#projects' },
//     { label: 'Skills', href: '#skills' },
//     { label: 'Contact', href: '#contact' },
//   ];

//   return (
//     <nav className="fixed top-0 left-0 right-0 shadow-md z-50">
//       <div className="max-w-6xl mx-auto px-4">
//         <div className="flex justify-between items-center h-16">
//           <Link href="/">
//             <Logo />
//           </Link>
//           <div className="hidden md:flex space-x-4">
//             {navItems.map((item) => (
//               <Link
//                 key={item.label}
//                 href={item.href}
//                 className="font-thin dark:text-white text-black hover:font-bold dark:hover:font-bold hover:text-gray-900 transition-colors"
//               >
//                 {item.label}
//               </Link>
//             ))}
//           </div>
//           <div className="flex items-center space-x-4">
//             <ModeToggle />
//           </div>
//           <div className="md:hidden">
//             <Sheet>
//               <SheetTrigger asChild>
//                 <Menu className="h-6 w-6 cursor-pointer" />
//               </SheetTrigger>
//               <SheetContent side="right" className="w-[200px]">
//                 <div className="flex flex-col space-y-4 mt-4">
//                   {navItems.map((item) => (
//                     <Link
//                       key={item.label}
//                       href={item.href}
//                       className="text-black hover:text-gray-900 transition-colors"
//                     >
//                       {item.label}
//                     </Link>
//                   ))}
                  
//                 </div>
//               </SheetContent>
//             </Sheet>
//           </div>
//         </div>
//       </div>
//     </nav>
//   );
// };

// export default Navbar;



// import Link from "next/link";
// import Container from "@/components/ui/container";
// import Logo from "./logo";
// import { Search } from "lucide-react";
// import { Category } from "@/types";
// import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
// import NavbarActions from "./navbar-actions";



// const Navbar = () => {



//   return ( 
//     <div className="top-0 right-0 left-0 py-2 mx-auto">
//       <Container>
//         <div className="relative px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
//           <div className="flex items-center">
//             <Link href="/">
//               <Logo />
//             </Link>
//             <div className="hidden lg:flex ml-10">
//               {/* <MainNav  /> */}
//             </div>
//           </div>
          
//           <div className="flex items-center space-x-4">
//             <Sheet>
//               <SheetTrigger asChild>
//                 <Search size={20} className="lg:hidden cursor-pointer" />
//               </SheetTrigger>
//               <SheetContent side="top" className="w-full">
                
//               </SheetContent>
//             </Sheet>
//             <NavbarActions />
//           </div>
//         </div>
//       </Container>
//     </div>
//   );
// };

// export default Navbar;



// import { NavbarItems } from "./navbar-items";

// const Navbar = () => {
//   return ( 
//     <div>
//       <NavbarItems />
//     </div>
//    );
// }
 
// export default Navbar;