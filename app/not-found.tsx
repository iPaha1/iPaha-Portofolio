"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Home, 
  Search, 
  ArrowLeft, 
  MapPin, 
  Compass,
  RefreshCw,
  Mail,
  Phone,
  MessageCircle,
  ExternalLink,
  Building,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const NotFound = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6 }
    }
  };

  const floatingVariants = {
    animate: {
      y: [-10, 10, -10],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  // Popular pages
  const popularPages = [
    { name: 'About Me', href: '/about', icon: User, description: 'Learn about my journey' },
    { name: 'Projects', href: '/projects', icon: Building, description: 'View my work portfolio' },
    { name: 'Blog', href: '/blog', icon: MessageCircle, description: 'Read my insights' },
    { name: 'Contact', href: '/contact', icon: Mail, description: 'Get in touch' }
  ];

  // Companies
  const companies = [
    { name: 'iPaha Ltd', url: 'https://ipahait.com', flag: '🇬🇧' },
    { name: 'iPahaStores Ltd', url: 'https://ipahastore.com', flag: '🇬🇧' },
    { name: 'Okpah Ltd', url: 'https://okpah.com', flag: '🇬🇭' }
  ];

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-amber-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-500/8 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-amber-300/5 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto text-center"
        >
          {/* 404 Animation */}
          <motion.div
            variants={floatingVariants}
            animate="animate"
            className="mb-8"
          >
            <div className="text-8xl md:text-9xl font-bold bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent mb-4">
              404
            </div>
            <motion.div
              variants={itemVariants}
              className="flex items-center justify-center gap-3 mb-6"
            >
              <MapPin className="w-8 h-8 text-amber-500" />
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                Page Not Found
              </h1>
              <Compass className="w-8 h-8 text-amber-500" />
            </motion.div>
          </motion.div>

          {/* Error Message */}
          <motion.div variants={itemVariants} className="mb-12">
            <p className="text-xl text-gray-600 mb-6 max-w-2xl mx-auto leading-relaxed">
              Oops! It looks like you&apos;ve ventured into uncharted territory. The page you&apos;re looking for 
              doesn&apos;t exist or might have been moved.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
                <Building className="w-3 h-3 mr-1" />
                Computing & IT Graduate
              </Badge>
              <Badge variant="outline" className="text-blue-700 border-blue-300 bg-blue-50">
                <User className="w-3 h-3 mr-1" />
                Tech Entrepreneur
              </Badge>
              <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
                <MessageCircle className="w-3 h-3 mr-1" />
                100K+ Users Served
              </Badge>
            </div>
          </motion.div>

          {/* Search Bar */}
          <motion.div variants={itemVariants} className="mb-12">
            <div className="max-w-md mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search for pages, projects, or content..."
                  className="pl-12 py-3 text-lg border-2 border-gray-300 focus:border-amber-500 rounded-lg"
                />
                <Button 
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-amber-500 hover:bg-amber-600"
                  size="sm"
                >
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={itemVariants} className="mb-12">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/">
                <Button className="bg-amber-500 hover:bg-amber-600 text-white px-8 py-3" size="lg">
                  <Home className="w-5 h-5 mr-2" />
                  Go Home
                </Button>
              </Link>
              
              <Button 
                variant="outline" 
                className="border-gray-300 hover:bg-gray-50 px-8 py-3" 
                size="lg"
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Go Back
              </Button>
              
              <Button 
                variant="outline" 
                className="border-amber-300 text-amber-700 hover:bg-amber-50 px-8 py-3" 
                size="lg"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Refresh
              </Button>
            </div>
          </motion.div>

          {/* Popular Pages */}
          <motion.div variants={itemVariants} className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              Popular Pages
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {popularPages.map((page, index) => (
                <motion.div
                  key={page.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  <Link href={page.href}>
                    <div className="bg-white p-6 rounded-lg border-2 border-gray-200 hover:border-amber-300 hover:shadow-lg transition-all duration-300 cursor-pointer">
                      <page.icon className="w-8 h-8 text-amber-500 mx-auto mb-4" />
                      <h3 className="font-semibold text-gray-900 mb-2">{page.name}</h3>
                      <p className="text-sm text-gray-600">{page.description}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* My Companies */}
          <motion.div variants={itemVariants} className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Visit My Companies
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {companies.map((company, index) => (
                <motion.div
                  key={company.name}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <a
                    href={company.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-lg border-2 border-amber-200 hover:border-amber-400 hover:shadow-xl transition-all duration-300"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{company.flag}</span>
                      <h3 className="font-bold text-gray-900">{company.name}</h3>
                      <ExternalLink className="w-4 h-4 text-amber-600 ml-auto" />
                    </div>
                    <p className="text-sm text-gray-600">
                      {company.name === 'iPaha Ltd' && 'IT consultancy providing custom software solutions'}
                      {company.name === 'iPahaStores Ltd' && 'SaaS and e-commerce solutions'}
                      {company.name === 'Okpah Ltd' && 'Innovation-driven startup in Ghana'}
                    </p>
                  </a>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Contact Information */}
          <motion.div variants={itemVariants}>
            <div className="bg-gradient-to-r from-amber-50 to-amber-100/50 p-8 rounded-2xl border border-amber-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Still Can&apos;t Find What You&apos;re Looking For?
              </h2>
              <p className="text-gray-600 mb-6">
                I&apos;m here to help! Feel free to reach out directly.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/contact">
                  <Button className="bg-amber-500 hover:bg-amber-600 text-white">
                    <Mail className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                </Link>
                
                <a href="tel:+447402497091">
                  <Button variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50">
                    <Phone className="w-4 h-4 mr-2" />
                    Call Me
                  </Button>
                </a>
              </div>
              
              <div className="flex justify-center items-center gap-6 mt-6 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Mail className="w-4 h-4 text-amber-500" />
                  <span>pahaisaac@gmail.com</span>
                </div>
                <div className="flex items-center gap-1">
                  <Phone className="w-4 h-4 text-amber-500" />
                  <span>+44 7402 497091</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Fun Fact */}
          <motion.div
            variants={itemVariants}
            className="mt-12 text-center"
          >
            <p className="text-sm text-gray-500">
              💡 Fun fact: While you&apos;re here, did you know I&apos;ve built platforms serving over 100,000 users 
              across three companies? Check out my <Link href="/projects" className="text-amber-600 hover:text-amber-700 underline">projects</Link>!
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;