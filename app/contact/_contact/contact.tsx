"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock,
  Send,
  CheckCircle,
  AlertCircle,
  Building,
  Globe,
  MessageSquare,

  Star,
  Linkedin,
  Github,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

// Contact form data interface
interface FormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  projectType: string;
  budget: string;
  timeline: string;
  message: string;
}

// Form submission state
interface FormState {
  isSubmitting: boolean;
  isSubmitted: boolean;
  error: string | null;
}

const Contact = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    company: '',
    projectType: '',
    budget: '',
    timeline: '',
    message: ''
  });

  const [formState, setFormState] = useState<FormState>({
    isSubmitting: false,
    isSubmitted: false,
    error: null
  });

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Validate form
  const validateForm = (): boolean => {
    const { name, email, message } = formData;
    return name.trim() !== '' && email.trim() !== '' && message.trim() !== '';
  };

  // Submit form to API route
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setFormState(prev => ({
        ...prev,
        error: 'Please fill in all required fields.'
      }));
      return;
    }

    setFormState({
      isSubmitting: true,
      isSubmitted: false,
      error: null
    });

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setFormState({
          isSubmitting: false,
          isSubmitted: true,
          error: null
        });
        
        // Reset form after successful submission
        setFormData({
          name: '',
          email: '',
          phone: '',
          company: '',
          projectType: '',
          budget: '',
          timeline: '',
          message: ''
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send message');
      }
    } catch (error) {
      setFormState({
        isSubmitting: false,
        isSubmitted: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      });
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

  // Contact information
  const contactInfo = [
    {
      icon: Mail,
      label: 'Email',
      value: 'pahaisaac@gmail.com',
      link: 'mailto:pahaisaac@gmail.com',
      description: 'Send me a direct email'
    },
    {
      icon: Phone,
      label: 'Phone',
      value: '+44 7402 497091',
      link: 'tel:+447402497091',
      description: 'Call for immediate consultation'
    },
    {
      icon: MapPin,
      label: 'Location',
      value: 'United Kingdom',
      link: null,
      description: 'Available for global projects'
    },
    {
      icon: Clock,
      label: 'Response Time',
      value: 'Within 24 hours',
      link: null,
      description: 'I aim to respond quickly'
    }
  ];

  
  // Services offered
  const services = [
    'Web Application Development',
    'E-commerce Solutions',
    'SaaS Platform Development',
    'Mobile App Development',
    'API Development & Integration',
    'Database Design & Optimization',
    'Cloud Infrastructure',
    'Technical Consulting'
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-gradient-to-br from-gray-50 to-white overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-amber-400/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-500/8 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-center mb-16"
          >
            <motion.div variants={itemVariants} className="flex items-center justify-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-gray-800 to-amber-600 bg-clip-text text-transparent">
                Let&apos;s Work Together
              </h1>
            </motion.div>
            
            <motion.p variants={itemVariants} className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Ready to transform your ideas into digital reality? As a Computing & IT graduate and founder of three 
              successful tech companies, I&apos;m here to help bring your vision to life.
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-4">
              <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50 text-sm py-2 px-4">
                <Building className="w-4 h-4 mr-2" />
                3 Companies Founded
              </Badge>
              <Badge variant="outline" className="text-blue-700 border-blue-300 bg-blue-50 text-sm py-2 px-4">
                <Star className="w-4 h-4 mr-2" />
                100+ Projects Delivered
              </Badge>
              <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50 text-sm py-2 px-4">
                <Globe className="w-4 h-4 mr-2" />
                Global Client Base
              </Badge>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="lg:col-span-2"
            >
              <Card className="border border-gray-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Send className="w-6 h-6 text-amber-500" />
                    Start Your Project
                  </CardTitle>
                  <CardDescription>
                    Tell me about your project and I&apos;ll get back to you within 24 hours with a detailed proposal.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AnimatePresence mode="wait">
                    {formState.isSubmitted ? (
                      <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="text-center py-12"
                      >
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h3 className="text-2xl font-semibold text-gray-900 mb-2">Message Sent Successfully!</h3>
                        <p className="text-gray-600 mb-6">
                          Thank you for reaching out. I&apos;ll review your project details and get back to you within 24 hours.
                        </p>
                        <Button
                          onClick={() => setFormState(prev => ({ ...prev, isSubmitted: false }))}
                          variant="outline"
                          className="border-amber-300 text-amber-700 hover:bg-amber-50"
                        >
                          Send Another Message
                        </Button>
                      </motion.div>
                    ) : (
                      <motion.form
                        key="form"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onSubmit={handleSubmit}
                        className="space-y-6"
                      >
                        {/* Personal Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                              Full Name *
                            </Label>
                            <Input
                              id="name"
                              name="name"
                              type="text"
                              value={formData.name}
                              onChange={handleInputChange}
                              placeholder="John Doe"
                              className="mt-1 border-gray-300 focus:border-amber-500"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                              Email Address *
                            </Label>
                            <Input
                              id="email"
                              name="email"
                              type="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              placeholder="john@example.com"
                              className="mt-1 border-gray-300 focus:border-amber-500"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                              Phone Number
                            </Label>
                            <Input
                              id="phone"
                              name="phone"
                              type="tel"
                              value={formData.phone}
                              onChange={handleInputChange}
                              placeholder="+44 7XXX XXXXXX"
                              className="mt-1 border-gray-300 focus:border-amber-500"
                            />
                          </div>
                          <div>
                            <Label htmlFor="company" className="text-sm font-medium text-gray-700">
                              Company Name
                            </Label>
                            <Input
                              id="company"
                              name="company"
                              type="text"
                              value={formData.company}
                              onChange={handleInputChange}
                              placeholder="Your Company Ltd"
                              className="mt-1 border-gray-300 focus:border-amber-500"
                            />
                          </div>
                        </div>

                        {/* Project Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                              Project Type
                            </Label>
                            <Select 
                              value={formData.projectType} 
                              onValueChange={(value) => handleSelectChange('projectType', value)}
                            >
                              <SelectTrigger className="border-gray-300 focus:border-amber-500">
                                <SelectValue placeholder="Select project type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="web-app">Web Application</SelectItem>
                                <SelectItem value="ecommerce">E-commerce Platform</SelectItem>
                                <SelectItem value="saas">SaaS Solution</SelectItem>
                                <SelectItem value="mobile-app">Mobile Application</SelectItem>
                                <SelectItem value="api">API Development</SelectItem>
                                <SelectItem value="consulting">Technical Consulting</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                              Budget Range
                            </Label>
                            <Select 
                              value={formData.budget} 
                              onValueChange={(value) => handleSelectChange('budget', value)}
                            >
                              <SelectTrigger className="border-gray-300 focus:border-amber-500">
                                <SelectValue placeholder="Select budget range" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="under-5k">Under £5,000</SelectItem>
                                <SelectItem value="5k-15k">£5,000 - £15,000</SelectItem>
                                <SelectItem value="15k-30k">£15,000 - £30,000</SelectItem>
                                <SelectItem value="30k-50k">£30,000 - £50,000</SelectItem>
                                <SelectItem value="50k-plus">£50,000+</SelectItem>
                                <SelectItem value="discuss">Let&apos;s Discuss</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            Project Timeline
                          </Label>
                          <Select 
                            value={formData.timeline} 
                            onValueChange={(value) => handleSelectChange('timeline', value)}
                          >
                            <SelectTrigger className="border-gray-300 focus:border-amber-500">
                              <SelectValue placeholder="When do you need this completed?" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="asap">ASAP</SelectItem>
                              <SelectItem value="1-month">Within 1 month</SelectItem>
                              <SelectItem value="3-months">Within 3 months</SelectItem>
                              <SelectItem value="6-months">Within 6 months</SelectItem>
                              <SelectItem value="flexible">Timeline is flexible</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="message" className="text-sm font-medium text-gray-700">
                            Project Description *
                          </Label>
                          <Textarea
                            id="message"
                            name="message"
                            value={formData.message}
                            onChange={handleInputChange}
                            placeholder="Tell me about your project goals, technical requirements, target audience, and any specific features you need..."
                            rows={6}
                            className="mt-1 border-gray-300 focus:border-amber-500"
                            required
                          />
                        </div>

                        {/* Error Message */}
                        {formState.error && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg"
                          >
                            <AlertCircle className="w-5 h-5 text-red-500" />
                            <span className="text-red-700 text-sm">{formState.error}</span>
                          </motion.div>
                        )}

                        {/* Submit Button */}
                        <Button
                          type="submit"
                          disabled={formState.isSubmitting || !validateForm()}
                          className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {formState.isSubmitting ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              Sending Message...
                            </>
                          ) : (
                            <>
                              <Send className="w-5 h-5 mr-2" />
                              Send Project Details
                            </>
                          )}
                        </Button>

                        <p className="text-xs text-gray-500 text-center">
                          By submitting this form, you agree to receive communication about your project inquiry.
                        </p>
                      </motion.form>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>

            {/* Contact Information Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-6"
            >
              {/* Contact Details */}
              <Card className="border border-gray-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900">Get In Touch</CardTitle>
                  <CardDescription>
                    Multiple ways to reach me for your project needs
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {contactInfo.map((item, index) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-5 h-5 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.label}</h4>
                        {item.link ? (
                          <a
                            href={item.link}
                            className="text-amber-600 hover:text-amber-700 transition-colors"
                          >
                            {item.value}
                          </a>
                        ) : (
                          <p className="text-gray-700">{item.value}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>

              {/* Social Links */}
              <Card className="border border-gray-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900">Connect With Me</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3">
                    <a
                      href="https://www.linkedin.com/in/isaac-paha-578911a9/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button variant="outline" className="w-full border-blue-200 text-blue-700 hover:bg-blue-50">
                        <Linkedin className="w-4 h-4 mr-2" />
                        LinkedIn
                      </Button>
                    </a>
                    <a
                      href="https://github.com/iPaha1"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button variant="outline" className="w-full border-gray-200 text-gray-700 hover:bg-gray-50">
                        <Github className="w-4 h-4 mr-2" />
                        GitHub
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>

              

              {/* Services Offered */}
              <Card className="border border-gray-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900">Services Offered</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {services.map((service, index) => (
                      <motion.div
                        key={service}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 * index }}
                        className="flex items-center gap-2 text-sm text-gray-700"
                      >
                        <ArrowRight className="w-3 h-3 text-amber-500" />
                        {service}
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;