"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Menu, 
  User, 
  Code, 
  Mail, 
  FileText,
  ChevronDown,
  ExternalLink,
  Building,
  Rocket
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Logo from '../global/logo';





const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { 
      label: 'Projects', 
      href: '/projects', 
      icon: Code,
      description: 'Explore my latest projects'
    },
    { 
      label: 'About', 
      href: '/about', 
      icon: User,
      description: 'Learn about my journey'
    },

    { 
      label: 'Blog', 
      href: '/blog', 
      icon: FileText,
      description: 'Tech insights and tutorials'
    },
    { 
      label: 'Contact', 
      href: '/contact', 
      icon: Mail,
      description: 'Get in touch with me'
    }
  ];

  const companies = [
    { name: 'iPaha Ltd', url: 'https://ipahait.com', flag: '🇬🇧' },
    { name: 'iPahaStores Ltd', url: 'https://ipahastore.com', flag: '🇬🇧' },
    { name: 'Okpah Ltd', url: 'https://okpah.com', flag: '🇬🇭' }
  ];

  const isActive = (href: string): boolean => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  const navVariants = {
    hidden: { y: -100 },
    visible: { 
      y: 0,
      transition: { 
        type: 'spring',
        stiffness: 100,
        damping: 20
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.3 }
    }
  };

  return (
    <>
      <motion.nav
        variants={navVariants}
        initial="hidden"
        animate="visible"
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled 
            ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-amber-200/50' 
            : 'bg-white/80 backdrop-blur-sm'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-20">
            
            {/* Logo */}
            <Link href="/">
              <Logo />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              {navItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.href}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link href={item.href}>
                      <motion.div
                        whileHover={{ y: -2 }}
                        className={`relative group px-4 py-2 rounded-lg transition-all duration-300 ${
                          isActive(item.href)
                            ? 'text-amber-600 bg-amber-50'
                            : 'text-gray-700 hover:text-amber-600 hover:bg-amber-50/50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          <span className="font-medium">{item.label}</span>
                        </div>
                        
                        {/* Active indicator */}
                        {isActive(item.href) && (
                          <motion.div
                            layoutId="activeTab"
                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-full"
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                          />
                        )}
                        
                        {/* Hover tooltip */}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                          {item.description}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                        </div>
                      </motion.div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-3">
              
              {/* Companies Dropdown */}
              <div className="hidden md:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-amber-200 text-amber-700 hover:bg-amber-50 hover:border-amber-300"
                    >
                      <Building className="w-4 h-4 mr-2" />
                      My Companies
                      <ChevronDown className="w-3 h-3 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    {companies.map((company) => (
                      <DropdownMenuItem key={company.name} asChild>
                        <a
                          href={company.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 cursor-pointer"
                        >
                          <span className="text-lg">{company.flag}</span>
                          <div className="flex-1">
                            <span className="font-medium">{company.name}</span>
                          </div>
                          <ExternalLink className="w-3 h-3 text-gray-400" />
                        </a>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/projects" className="flex items-center gap-2">
                        <Rocket className="w-4 h-4" />
                        View All Projects
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* CTA Button */}
              <div className="hidden md:block">
                <Link href="/contact">
                  <Button 
                    className="bg-amber-500 hover:bg-amber-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                    size="sm"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Hire Me
                  </Button>
                </Link>
              </div>


              {/* Mobile Menu */}
              <div className="lg:hidden">
                <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                    >
                      <Menu className="h-5 w-5 text-gray-700" />
                    </motion.button>
                  </SheetTrigger>
                  <SheetContent 
                    side="right" 
                    className="w-[300px] bg-white border-l border-amber-200"
                  >
                    <div className="flex flex-col h-full">
                      
                      {/* Mobile Header */}
                      <div className="flex items-center justify-between pb-6 border-b border-amber-200">
                        <Logo />
                        
                      </div>

                      {/* Mobile Navigation */}
                      <div className="flex-1 py-6">
                        <div className="space-y-2">
                          {navItems.map((item, index) => {
                            const Icon = item.icon;
                            return (
                              <motion.div
                                key={item.href}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                              >
                                <Link
                                  href={item.href}
                                  onClick={() => setIsMobileMenuOpen(false)}
                                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                                    isActive(item.href)
                                      ? 'text-amber-600 bg-amber-50 border-l-4 border-amber-500'
                                      : 'text-gray-700 hover:text-amber-600 hover:bg-amber-50/50'
                                  }`}
                                >
                                  <Icon className="w-5 h-5" />
                                  <div>
                                    <span className="font-medium">{item.label}</span>
                                    <p className="text-xs text-gray-500">{item.description}</p>
                                  </div>
                                </Link>
                              </motion.div>
                            );
                          })}
                        </div>

                        {/* Mobile Companies */}
                        <div className="mt-8 pt-6 border-t border-amber-200">
                          <h3 className="text-sm font-semibold text-gray-900 mb-3 px-4">My Companies</h3>
                          <div className="space-y-2">
                            {companies.map((company, index) => (
                              <motion.a
                                key={company.name}
                                href={company.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: (navItems.length + index) * 0.1 }}
                                className="flex items-center gap-3 px-4 py-2 text-gray-600 hover:text-amber-600 hover:bg-amber-50/50 rounded-lg transition-colors"
                              >
                                <span className="text-lg">{company.flag}</span>
                                <span className="text-sm">{company.name}</span>
                                <ExternalLink className="w-3 h-3 ml-auto" />
                              </motion.a>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Mobile CTA */}
                      <div className="pt-6 border-t border-amber-200  mb-4">
                        <Link href="/contact" onClick={() => setIsMobileMenuOpen(false)}>
                          <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white">
                            <Mail className="w-4 h-4 mr-2" />
                            Let&apos;s Work Together
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Spacer to prevent content overlap */}
      <div className="h-20"></div>
    </>
  );
};

export default Navbar;