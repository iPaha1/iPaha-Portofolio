"use client";

import React from 'react';
import { motion } from "framer-motion";
import Link from "next/link";
import { 
  Mail, 
  MapPin, 
  Globe, 
  ArrowUp,
  Heart,
  Coffee,
  Linkedin,
  Github,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from '../global/logo';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
      transition: { duration: 0.5 }
    }
  };

  const companies = [
    { name: "iPaha Ltd", url: "https://ipahait.com" },
    { name: "iPahaStores Ltd", url: "https://ipahastore.com" },
    { name: "Okpah Ltd", url: "https://okpah.com" }
  ];

  const quickLinks = [
    { name: "About", href: "/about" },
    { name: "Projects", href: "/projects" },
    { name: "Services", href: "/services" },
    { name: "Blog", href: "/blog" },
    { name: "Contact", href: "/contact" }
  ];

  const products = [
    { name: "oKadwuma.com", url: "https://okadwuma.com" },
    { name: "okDdwa.com", url: "https://okddwa.com" }
  ];

  return (
    <footer className="relative bg-gradient-to-br from-gray-50 to-white border-t border-amber-200">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,_rgba(245,158,11,0.1)_0%,_transparent_50%)]"></div>
      </div>

      <div className="relative z-10">
        {/* Main Footer Content */}
        <motion.div 
          className="max-w-7xl mx-auto px-4 py-16"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            
            {/* About Section */}
            <motion.div variants={itemVariants} className="lg:col-span-1">
              <div className="flex items-center gap-3 mb-6">
                <Logo />
              </div>
              
              <p className="text-gray-600 mb-6 leading-relaxed">
                Full-stack developer, building innovative digital solutions across three tech companies.
              </p>

              {/* Contact Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 text-amber-500" />
                  <span>United Kingdom</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Mail className="w-4 h-4 text-amber-500" />
                  <a href="mailto:pahaisaac@gmail.com" className="hover:text-amber-600 transition-colors">
                    pahaisaac@gmail.com
                  </a>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Globe className="w-4 h-4 text-amber-500" />
                  <span>Available for projects worldwide</span>
                </div>
              </div>
            </motion.div>

            {/* Quick Links */}
            <motion.div variants={itemVariants}>
              <h4 className="text-lg font-semibold text-gray-900 mb-6">Quick Links</h4>
              <ul className="space-y-3">
                {quickLinks.map((link) => (
                  <motion.li 
                    key={link.name}
                    whileHover={{ x: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Link 
                      href={link.href}
                      className="text-gray-600 hover:text-amber-600 transition-colors duration-300 flex items-center gap-2 group"
                    >
                      <span className="w-1 h-1 bg-amber-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                      {link.name}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {/* My Companies */}
            <motion.div variants={itemVariants}>
              <h4 className="text-lg font-semibold text-gray-900 mb-6">My Companies</h4>
              <ul className="space-y-3">
                {companies.map((company) => (
                  <motion.li 
                    key={company.name}
                    whileHover={{ x: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <a 
                      href={company.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-amber-600 transition-colors duration-300 flex items-center gap-2 group"
                    >
                      <span className="w-1 h-1 bg-amber-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                      {company.name}
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  </motion.li>
                ))}
              </ul>

              <h5 className="text-md font-medium text-gray-900 mt-8 mb-4">Products</h5>
              <ul className="space-y-2">
                {products.map((product) => (
                  <motion.li 
                    key={product.name}
                    whileHover={{ x: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <a 
                      href={product.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-amber-600 transition-colors duration-300 flex items-center gap-2 group text-sm"
                    >
                      <span className="w-1 h-1 bg-amber-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                      {product.name}
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {/* Tech & Connect */}
            <motion.div variants={itemVariants}>
              <h4 className="text-lg font-semibold text-gray-900 mb-6">Let&apos;s Connect</h4>
              
              {/* Social Links */}
              <div className="flex gap-3 mb-8">
                <motion.a
                  href="https://www.linkedin.com/in/isaac-paha-578911a9/"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white hover:shadow-lg transition-shadow"
                >
                  <Linkedin className="w-5 h-5" />
                </motion.a>
                
                <motion.a
                  href="https://github.com/iPaha1"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 bg-gradient-to-r from-gray-700 to-gray-800 rounded-lg flex items-center justify-center text-white hover:shadow-lg transition-shadow"
                >
                  <Github className="w-5 h-5" />
                </motion.a>
                
                <motion.a
                  href="mailto:pahaisaac@gmail.com"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg flex items-center justify-center text-white hover:shadow-lg transition-shadow"
                >
                  <Mail className="w-5 h-5" />
                </motion.a>
              </div>

              {/* Tech Stack Preview */}
              <div className="mb-6">
                <h5 className="text-sm font-medium text-gray-900 mb-3">Built with</h5>
                <div className="flex flex-wrap gap-2">
                  {["React", "Next.js", "TypeScript", "Tailwind"].map((tech) => (
                    <span 
                      key={tech}
                      className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-md"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Back to Top Button */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={scrollToTop}
                  variant="outline"
                  size="sm"
                  className="border-amber-200 text-amber-700 hover:bg-amber-50 hover:border-amber-300 transition-all duration-300"
                >
                  <ArrowUp className="w-4 h-4 mr-2" />
                  Back to Top
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        {/* Bottom Bar */}
        <motion.div 
          className="border-t border-amber-200 bg-gradient-to-r from-amber-50 to-white"
          variants={itemVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              
              {/* Copyright */}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>&copy; {currentYear} Isaac Paha. All rights reserved.</span>
                <span className="hidden md:inline">|</span>
                <span className="flex items-center gap-1">
                  Made with <Heart className="w-3 h-3 text-red-500 fill-current" /> and <Coffee className="w-3 h-3 text-amber-600" />
                </span>
              </div>

              {/* Legal Links */}
              <div className="flex items-center gap-4 text-sm">
                <Link 
                  href="/privacy-policy" 
                  className="text-gray-600 hover:text-amber-600 transition-colors"
                >
                  Privacy Policy
                </Link>
                <span className="text-gray-400">|</span>
                <Link 
                  href="/terms-and-conditions" 
                  className="text-gray-600 hover:text-amber-600 transition-colors"
                >
                  Terms & Conditions
                </Link>
                <span className="text-gray-400">|</span>
                <Link 
                  href="/sitemap.xml" 
                  className="text-gray-600 hover:text-amber-600 transition-colors"
                >
                  Sitemap
                </Link>
              </div>
            </div>

            {/* Additional Info */}
            <motion.div 
              className="mt-4 pt-4 border-t border-amber-100 text-center"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              viewport={{ once: true }}
            >
              <p className="text-xs text-gray-500">
                Full-Stack Developer | Tech Entrepreneur
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Transforming ideas into digital reality across the UK and Ghana
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-10 right-10 w-20 h-20 bg-amber-400/5 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-10 left-10 w-32 h-32 bg-amber-500/3 rounded-full blur-2xl animate-pulse delay-1000"></div>
    </footer>
  );
};

export default Footer;