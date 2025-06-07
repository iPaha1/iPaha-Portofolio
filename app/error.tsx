"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  RefreshCw, 
  Home, 
  ArrowLeft,
  Bug,
  Shield,
  Settings,
  Mail,
  Phone,
  MessageCircle,
  Copy,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

const ErrorPage = ({ error }: ErrorPageProps) => {
  const [copied, setCopied] = React.useState(false);
  const [errorDetails, setErrorDetails] = React.useState<string>('');

  useEffect(() => {
    // Log error to console and error reporting service
    console.error('Application Error:', error);
    
    // Create error details for support
    const details = `
Error: ${error.message}
Digest: ${error.digest || 'N/A'}
Timestamp: ${new Date().toISOString()}
User Agent: ${navigator.userAgent}
URL: ${window.location.href}
    `.trim();
    
    setErrorDetails(details);
  }, [error]);

  const copyErrorDetails = async () => {
    try {
      await navigator.clipboard.writeText(errorDetails);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy error details:', err);
    }
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
      transition: { duration: 0.6 }
    }
  };

  const pulseVariants = {
    animate: {
      scale: [1, 1.1, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  // Quick solutions
  const solutions = [
    {
      icon: RefreshCw,
      title: 'Refresh the Page',
      description: 'Sometimes a simple refresh can resolve temporary issues',
      action: () => window.location.reload(),
      color: 'text-blue-600'
    },
    {
      icon: ArrowLeft,
      title: 'Go Back',
      description: 'Return to the previous page you were viewing',
      action: () => window.history.back(),
      color: 'text-green-600'
    },
    {
      icon: Home,
      title: 'Go Home',
      description: 'Start fresh from the homepage',
      action: () => window.location.href = '/',
      color: 'text-amber-600'
    }
  ];

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-red-400/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-red-300/3 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto text-center"
        >
          {/* Error Icon */}
          <motion.div
            variants={pulseVariants}
            animate="animate"
            className="mb-8"
          >
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-12 h-12 text-red-500" />
            </div>
          </motion.div>

          {/* Error Header */}
          <motion.div variants={itemVariants} className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Oops! Something Went Wrong
            </h1>
            <p className="text-xl text-gray-600 mb-6 max-w-2xl mx-auto">
              I&apos;m sorry, but there seems to be a technical issue. Don&apos;t worry - 
              as a full-stack developer, I take these things seriously!
            </p>
            
            <div className="flex flex-wrap justify-center gap-3 mb-6">
              <Badge variant="outline" className="text-red-700 border-red-300 bg-red-50">
                <Bug className="w-3 h-3 mr-1" />
                Error Detected
              </Badge>
              <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
                <Shield className="w-3 h-3 mr-1" />
                Working on Fix
              </Badge>
            </div>
          </motion.div>

          {/* Quick Solutions */}
          <motion.div variants={itemVariants} className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              Let&apos;s Try to Fix This
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {solutions.map((solution, index) => (
                <motion.div
                  key={solution.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  <Card className="border-2 border-gray-200 hover:border-amber-300 hover:shadow-lg transition-all duration-300 cursor-pointer h-full"
                        onClick={solution.action}>
                    <CardHeader className="text-center">
                      <div className={`w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3`}>
                        <solution.icon className={`w-6 h-6 ${solution.color}`} />
                      </div>
                      <CardTitle className="text-lg font-semibold text-gray-900">
                        {solution.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center pt-0">
                      <CardDescription className="text-gray-600">
                        {solution.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Error Details for Developers/Support */}
          <motion.div variants={itemVariants} className="mb-12">
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-amber-500" />
                  Technical Details
                </CardTitle>
                <CardDescription>
                  Information for debugging and support
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="text-sm text-gray-700 mb-2">
                    <strong>Error:</strong> {error.message || 'Unknown error occurred'}
                  </div>
                  {error.digest && (
                    <div className="text-sm text-gray-700 mb-2">
                      <strong>Error ID:</strong> {error.digest}
                    </div>
                  )}
                  <div className="text-sm text-gray-700">
                    <strong>Time:</strong> {new Date().toLocaleString('en-GB')}
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyErrorDetails}
                    className="border-gray-300 hover:bg-gray-50"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Error Details
                      </>
                    )}
                  </Button>
                  
                  <Link href="/contact">
                    <Button variant="outline" size="sm" className="border-amber-300 text-amber-700 hover:bg-amber-50">
                      <Mail className="w-4 h-4 mr-2" />
                      Report Error
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Developer Info */}
          <motion.div variants={itemVariants} className="mb-8">
            <div className="bg-gradient-to-r from-amber-50 to-amber-100/50 p-8 rounded-2xl border border-amber-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                About the Developer
              </h3>
              <p className="text-gray-600 mb-6">
                I&apos;m Isaac Paha, a Computing & IT graduate and full-stack developer who built platforms 
                serving 100K+ users. I take system reliability seriously and will investigate this issue promptly.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-white rounded-lg border border-amber-200">
                  <div className="text-lg font-bold text-amber-600">99.9%</div>
                  <div className="text-sm text-gray-600">Uptime Record</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border border-amber-200">
                  <div className="text-lg font-bold text-amber-600">100K+</div>
                  <div className="text-sm text-gray-600">Users Served</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border border-amber-200">
                  <div className="text-lg font-bold text-amber-600">24hrs</div>
                  <div className="text-sm text-gray-600">Response Time</div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/contact">
                  <Button className="bg-amber-500 hover:bg-amber-600 text-white">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Contact Isaac
                  </Button>
                </Link>
                
                <a href="tel:+447402497091">
                  <Button variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50">
                    <Phone className="w-4 h-4 mr-2" />
                    Call Direct
                  </Button>
                </a>
              </div>
            </div>
          </motion.div>

          {/* Company Links */}
          <motion.div variants={itemVariants}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Meanwhile, Check Out My Companies
            </h3>
            <div className="flex flex-wrap justify-center gap-4">
              <a 
                href="https://ipahait.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:border-amber-300 hover:shadow-md transition-all duration-300"
              >
                <span>🇬🇧</span>
                <span className="font-medium text-gray-900">iPaha Ltd</span>
                <ExternalLink className="w-3 h-3 text-gray-400" />
              </a>
              
              <a 
                href="https://ipahastore.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:border-amber-300 hover:shadow-md transition-all duration-300"
              >
                <span>🇬🇧</span>
                <span className="font-medium text-gray-900">iPahaStores Ltd</span>
                <ExternalLink className="w-3 h-3 text-gray-400" />
              </a>
              
              <a 
                href="https://okpah.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:border-amber-300 hover:shadow-md transition-all duration-300"
              >
                <span>🇬🇭</span>
                <span className="font-medium text-gray-900">Okpah Ltd</span>
                <ExternalLink className="w-3 h-3 text-gray-400" />
              </a>
            </div>
          </motion.div>

          {/* Fun Message */}
          <motion.div variants={itemVariants} className="mt-8">
            <p className="text-sm text-gray-500">
              🚀 Error aside, I&apos;d love to tell you about the platforms I&apos;ve built that serve 100K+ users! 
              Check out my <Link href="/projects" className="text-amber-600 hover:text-amber-700 underline">projects</Link> when this is fixed.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default ErrorPage;