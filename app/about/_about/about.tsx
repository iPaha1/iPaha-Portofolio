"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { 
  GraduationCap,
  Building,
  Code,
  Globe,
  Users,
  TrendingUp,
  Target,
  Heart,
  Lightbulb,
  Rocket,
  MapPin,
  Calendar,
  BookOpen,
  Briefcase,
  Star,
  ExternalLink,
  Download,
  Coffee,
  Clock,
  CheckCircle,
  ArrowRight,
  Zap,
  Shield,
  Layers,
  MessageCircle
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

// Timeline data
const timelineData = [
  {
    year: "2025",
    title: "Computing & IT Graduate",
    subtitle: "Open University London",
    description: "Completed Computing & IT degree with distinction, specializing in software engineering and system architecture.",
    type: "education",
    icon: GraduationCap,
    color: "bg-blue-500"
  },
  {
    year: "2024",
    title: "Founded Three Tech Companies",
    subtitle: "Entrepreneurial Milestone",
    description: "Successfully launched iPaha Ltd, iPahaStores Ltd, and Okpah Ltd, each serving different market segments with innovative digital solutions.",
    type: "business",
    icon: Building,
    color: "bg-amber-500"
  },
  {
    year: "2024",
    title: "oKadwuma.com Launch",
    subtitle: "Job Platform for Ghana",
    description: "Launched Ghana's premier job search platform, connecting 10,000+ jobseekers with 500+ companies. Featured in Ghana Tech Weekly.",
    type: "product",
    icon: Rocket,
    color: "bg-green-500"
  },
  {
    year: "2024",
    title: "okDdwa.com Marketplace",
    subtitle: "E-commerce Innovation",
    description: "Created multi-tenant e-commerce marketplace serving 1,200+ vendors and generating $50,000+ in transaction volume.",
    type: "product",
    icon: Globe,
    color: "bg-purple-500"
  },
  {
    year: "2023",
    title: "Full-Stack Developer",
    subtitle: "Professional Development",
    description: "Mastered modern development stack including React.js, Next.js, Node.js, and cloud technologies while building client solutions.",
    type: "career",
    icon: Code,
    color: "bg-indigo-500"
  },
  {
    year: "2022",
    title: "Started Tech Journey",
    subtitle: "Foundation Building",
    description: "Began intensive study of software development, starting with web technologies and progressing to full-stack development.",
    type: "career",
    icon: BookOpen,
    color: "bg-gray-500"
  }
];

// Skills data organized by category
const skillsData = {
  frontend: [
    { name: "React.js", level: 95, experience: "3+ years" },
    { name: "Next.js", level: 90, experience: "2+ years" },
    { name: "TypeScript", level: 85, experience: "2+ years" },
    { name: "Tailwind CSS", level: 90, experience: "2+ years" },
    { name: "JavaScript", level: 95, experience: "3+ years" },
    { name: "HTML/CSS", level: 95, experience: "3+ years" }
  ],
  backend: [
    { name: "Node.js", level: 90, experience: "2+ years" },
    { name: "Express.js", level: 85, experience: "2+ years" },
    { name: "Prisma ORM", level: 80, experience: "1+ years" },
    { name: "REST APIs", level: 90, experience: "2+ years" },
    { name: "GraphQL", level: 75, experience: "1+ years" },
    { name: "Python", level: 70, experience: "1+ years" }
  ],
  database: [
    { name: "MySQL", level: 85, experience: "2+ years" },
    { name: "PostgreSQL", level: 80, experience: "1+ years" },
    { name: "MongoDB", level: 75, experience: "1+ years" },
    { name: "Redis", level: 70, experience: "1+ years" }
  ],
  tools: [
    { name: "Git/GitHub", level: 90, experience: "3+ years" },
    { name: "Docker", level: 75, experience: "1+ years" },
    { name: "AWS", level: 70, experience: "1+ years" },
    { name: "Vercel", level: 90, experience: "2+ years" },
    { name: "Stripe", level: 85, experience: "2+ years" },
    { name: "Clerk Auth", level: 80, experience: "1+ years" }
  ]
};

// Values and principles
const values = [
  {
    icon: Target,
    title: "Problem-Focused",
    description: "I believe technology should solve real problems and create genuine value for users and businesses."
  },
  {
    icon: Users,
    title: "User-Centric Design",
    description: "Every solution I build prioritizes user experience and accessibility, ensuring technology serves people effectively."
  },
  {
    icon: Zap,
    title: "Innovation-Driven",
    description: "I constantly explore new technologies and methodologies to deliver cutting-edge solutions that exceed expectations."
  },
  {
    icon: Shield,
    title: "Quality & Security",
    description: "I maintain the highest standards of code quality, security, and performance in every project I undertake."
  },
  {
    icon: Layers,
    title: "Scalable Solutions",
    description: "I architect systems that grow with businesses, ensuring long-term success and adaptability to changing needs."
  },
  {
    icon: Heart,
    title: "Continuous Learning",
    description: "I'm committed to lifelong learning, staying current with industry trends and emerging technologies."
  }
];

// Achievement stats
const achievements = [
  { number: "100K+", label: "Users Served", icon: Users },
  { number: "25+", label: "Projects Completed", icon: Briefcase },
  { number: "3", label: "Companies Founded", icon: Building },
  { number: "50+", label: "Happy Clients", icon: Star },
  { number: "99.9%", label: "Uptime Average", icon: TrendingUp },
  { number: "24hrs", label: "Response Time", icon: Clock }
];

// Companies detailed information
const companies = [
  {
    name: "iPaha Ltd",
    flag: "🇬🇧",
    location: "United Kingdom",
    founded: "2024",
    description: "IT consultancy providing custom software and digital solutions for businesses across the UK and Europe.",
    website: "https://ipahait.com",
    services: ["Custom Software Development", "IT Consulting", "Digital Transformation", "Technical Architecture"],
    highlights: ["150+ satisfied clients", "Enterprise-grade solutions", "99.9% uptime guarantee"],
    color: "border-blue-200 bg-blue-50"
  },
  {
    name: "iPahaStores Ltd",
    flag: "🇬🇧", 
    location: "United Kingdom",
    founded: "2024",
    description: "Specialized SaaS company offering e-commerce solutions and digital platforms for online retailers.",
    website: "https://ipahastore.com",
    services: ["SaaS Platform Development", "E-commerce Solutions", "Payment Integration", "Analytics & Reporting"],
    highlights: ["500+ active stores", "Multi-currency support", "AI-powered insights"],
    color: "border-amber-200 bg-amber-50"
  },
  {
    name: "Okpah Ltd",
    flag: "🇬🇭",
    location: "Ghana",
    founded: "2024", 
    description: "Innovation-driven startup building digital platforms that address local challenges in Ghana and West Africa.",
    website: "https://okpah.com",
    services: ["Job Platforms", "Marketplace Solutions", "Mobile Money Integration", "Local Tech Solutions"],
    highlights: ["10,000+ active users", "Local impact focus", "Mobile-first approach"],
    color: "border-green-200 bg-green-50"
  }
];

// Personal interests and hobbies
const interests = [
  { icon: Code, name: "Open Source", description: "Contributing to community projects" },
  { icon: BookOpen, name: "Tech Reading", description: "Staying updated with industry trends" },
  { icon: Coffee, name: "Coffee Brewing", description: "Perfecting the art of great coffee" },
  { icon: Globe, name: "Travel", description: "Exploring new cultures and perspectives" },
  { icon: Users, name: "Mentoring", description: "Helping aspiring developers" },
  { icon: Lightbulb, name: "Innovation", description: "Exploring emerging technologies" }
];

// Timeline Item Component
type TimelineItemProps = {
  item: {
    year: string;
    title: string;
    subtitle: string;
    description: string;
    type: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
  };
  index: number;
  isLast: boolean;
};

const TimelineItem: React.FC<TimelineItemProps> = ({ item, index, isLast }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      viewport={{ once: true }}
      className={`flex items-center gap-8 ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Content */}
      <div className={`flex-1 ${index % 2 === 0 ? 'text-right' : 'text-left'}`}>
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 hover:border-amber-300 transition-all duration-300"
        >
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className={`${item.color} text-white border-none`}>
              {item.year}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {item.type}
            </Badge>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">{item.title}</h3>
          <p className="text-amber-600 font-medium mb-3">{item.subtitle}</p>
          <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
        </motion.div>
      </div>

      {/* Timeline Icon */}
      <div className="relative flex-shrink-0">
        <motion.div
          animate={{ scale: isHovered ? 1.2 : 1 }}
          className={`w-12 h-12 ${item.color} rounded-full flex items-center justify-center shadow-lg border-4 border-white z-10 relative`}
        >
          <item.icon className="w-6 h-6 text-white" />
        </motion.div>
        
        {/* Timeline Line */}
        {!isLast && (
          <div className="absolute top-12 left-1/2 transform -translate-x-1/2 w-1 h-20 bg-gradient-to-b from-gray-300 to-gray-200"></div>
        )}
      </div>

      {/* Empty space for alternating layout */}
      <div className="flex-1"></div>
    </motion.div>
  );
};

// Skill Bar Component
type Skill = {
  name: string;
  level: number;
  experience: string;
};

type SkillBarProps = {
  skill: Skill;
  index: number;
};

const SkillBar: React.FC<SkillBarProps> = ({ skill, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      className="mb-4"
    >
      <div className="flex justify-between items-center mb-2">
        <span className="font-medium text-gray-900">{skill.name}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">{skill.experience}</span>
          <span className="text-sm font-bold text-amber-600">{skill.level}%</span>
        </div>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${skill.level}%` }}
          transition={{ duration: 1, delay: index * 0.1 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-amber-500 to-amber-600 h-3 rounded-full"
        />
      </div>
    </motion.div>
  );
};

// Company Card Component
type Company = {
  name: string;
  flag: string;
  location: string;
  founded: string;
  description: string;
  website: string;
  services: string[];
  highlights: string[];
  color: string;
};

type CompanyCardProps = {
  company: Company;
  index: number;
};

const CompanyCard: React.FC<CompanyCardProps> = ({ company, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.2 }}
      viewport={{ once: true }}
      whileHover={{ y: -5 }}
    >
      <Card className={`h-full ${company.color} border-2 hover:shadow-xl transition-all duration-300`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{company.flag}</span>
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">{company.name}</CardTitle>
                <CardDescription className="text-sm text-gray-600">
                  {company.location} • Founded {company.founded}
                </CardDescription>
              </div>
            </div>
            <a
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-600 hover:text-amber-700 transition-colors"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 mb-4 leading-relaxed">{company.description}</p>
          
          <div className="mb-4">
            <h4 className="font-semibold text-gray-900 mb-2">Services</h4>
            <div className="flex flex-wrap gap-1">
              {company.services.map((service) => (
                <Badge key={service} variant="secondary" className="text-xs bg-white/60">
                  {service}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Highlights</h4>
            <ul className="space-y-1">
              {company.highlights.map((highlight, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  {highlight}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Main About Component
const About = () => {
  const [activeTab, setActiveTab] = useState("story");

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
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
          >
            {/* Left Content */}
            <motion.div variants={itemVariants}>
              <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50 mb-6">
                <MapPin className="w-3 h-3 mr-1" />
                Based in United Kingdom
              </Badge>
              
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-gray-800 to-amber-600 bg-clip-text text-transparent mb-6">
                About Isaac Paha
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Full Stack turned tech entrepreneur. I founded three successful companies 
                and built digital solutions serving over 100,000 users across the UK and Ghana.
              </p>

              <div className="flex flex-wrap gap-4 mb-8">
                <Button className="bg-amber-500 hover:bg-amber-600 text-white">
                  <Download className="w-4 h-4 mr-2" />
                  Download CV
                </Button>
                {/* <Button variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50">
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Call
                </Button> */}
                <Button 
                    variant="outline" 
                    className="border-amber-300 text-amber-700 hover:bg-amber-50"
                    onClick={() => {
                        const message = "Hello Isaac! After reading about your journey and the three companies you've founded, I'm interested in discussing how we might work together. When would be a good time for a call?";
                        const phone = "447402497091"; // Your number without +
                        const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
                        window.open(whatsappUrl, '_blank');
                    }}
                    >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Schedule Call
                    </Button>

              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4">
                {achievements.slice(0, 3).map((stat) => (
                  <motion.div
                    key={stat.label}
                    variants={itemVariants}
                    className="text-center p-4 bg-white rounded-lg shadow-md border border-gray-200"
                  >
                    <stat.icon className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                    <div className="text-lg font-bold text-gray-900">{stat.number}</div>
                    <div className="text-xs text-gray-600">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right Content - Photo */}
            <motion.div
              variants={itemVariants}
              className="relative"
            >
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-600 rounded-2xl blur-2xl opacity-20 animate-pulse"></div>
                <div className="relative bg-white p-6 rounded-2xl shadow-2xl border border-gray-200">
                  <Image
                    src="/images/photo1.png"
                    alt="Isaac Paha - Full-Stack Developer & Tech Entrepreneur"
                    width={400}
                    height={500}
                    className="rounded-xl grayscale hover:grayscale-0 transition-all duration-500"
                  />
                  
                  {/* Floating badges */}
                  <div className="absolute -top-4 -left-4 bg-amber-500 text-white px-4 py-2 rounded-lg shadow-lg">
                    <div className="text-sm font-bold">Computing & IT</div>
                    <div className="text-xs">Graduate 2025</div>
                  </div>
                  
                  <div className="absolute -bottom-4 -right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg">
                    <div className="text-sm font-bold">3 Companies</div>
                    <div className="text-xs">Founded</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Main Content Tabs */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-4 mb-12 bg-gray-100 p-1 rounded-lg">
              <TabsTrigger value="story" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white">
                My Story
              </TabsTrigger>
              <TabsTrigger value="skills" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white">
                Skills
              </TabsTrigger>
              <TabsTrigger value="companies" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white">
                Companies
              </TabsTrigger>
              <TabsTrigger value="values" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white">
                Values
              </TabsTrigger>
            </TabsList>

            {/* My Story Tab */}
            <TabsContent value="story" className="space-y-16">
              {/* Personal Story */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">My Journey</h2>
                  <div className="space-y-4 text-gray-700 leading-relaxed">
                    <p>
                      My journey into technology began with a simple curiosity about how digital solutions 
                      could solve real-world problems. As a Computing & IT student at Open University London, 
                      I discovered my passion for building software that makes a meaningful impact.
                    </p>
                    <p>
                      What started as learning to code evolved into founding three successful tech companies: 
                      iPaha Ltd and iPahaStores Ltd in the UK, and Okpah Ltd in Ghana. Each company addresses 
                      different market needs, from IT consultancy to e-commerce solutions and local job platforms.
                    </p>
                    <p>
                      Today, our platforms serve over 100,000 users across multiple countries, helping businesses 
                      grow and connecting people with opportunities. I believe technology should be accessible, 
                      purposeful, and designed with the user at the center of every decision.
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="grid grid-cols-2 gap-4"
                >
                  {achievements.map((stat) => (
                    <div key={stat.label} className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 text-center">
                      <stat.icon className="w-8 h-8 text-amber-500 mx-auto mb-3" />
                      <div className="text-2xl font-bold text-gray-900 mb-1">{stat.number}</div>
                      <div className="text-sm text-gray-600">{stat.label}</div>
                    </div>
                  ))}
                </motion.div>
              </div>

              {/* Timeline */}
              <div className="relative">
                <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Career Timeline</h2>
                <div className="max-w-4xl mx-auto space-y-8">
                  {timelineData.map((item, index) => (
                    <TimelineItem
                      key={item.year}
                      item={item}
                      index={index}
                      isLast={index === timelineData.length - 1}
                    />
                  ))}
                </div>
              </div>

              {/* Personal Interests */}
              <div>
                <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Beyond Coding</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                  {interests.map((interest, index) => (
                    <motion.div
                      key={interest.name}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      viewport={{ once: true }}
                      whileHover={{ y: -5 }}
                      className="text-center p-4 bg-white rounded-lg shadow-md border border-gray-200 hover:border-amber-300 transition-all duration-300"
                    >
                      <interest.icon className="w-8 h-8 text-amber-500 mx-auto mb-3" />
                      <h3 className="font-semibold text-gray-900 mb-1">{interest.name}</h3>
                      <p className="text-xs text-gray-600">{interest.description}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Skills Tab */}
            <TabsContent value="skills" className="space-y-12">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Technical Expertise</h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  Full-stack development skills honed through real-world projects and continuous learning. 
                  I believe in using the right technology for each solution.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {Object.entries(skillsData).map(([category, skills]) => (
                  <motion.div
                    key={category}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                  >
                    <Card className="h-full border border-gray-200 shadow-lg">
                      <CardHeader>
                        <CardTitle className="text-xl font-bold text-gray-900 capitalize flex items-center gap-2">
                          <Code className="w-5 h-5 text-amber-500" />
                          {category === 'frontend' ? 'Frontend Development' : 
                           category === 'backend' ? 'Backend Development' :
                           category === 'database' ? 'Database Management' : 'Tools & Services'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {skills.map((skill, index) => (
                          <SkillBar key={skill.name} skill={skill} index={index} />
                        ))}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            {/* Companies Tab */}
            <TabsContent value="companies" className="space-y-12">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">My Companies</h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  Three successful technology companies serving different markets and solving unique challenges 
                  across the UK and Ghana.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {companies.map((company, index) => (
                  <CompanyCard key={company.name} company={company} index={index} />
                ))}
              </div>

              {/* Company Impact */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="bg-gradient-to-r from-amber-50 to-amber-100/50 p-8 rounded-2xl border border-amber-200"
              >
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Collective Impact</h3>
                  <p className="text-gray-700 max-w-2xl mx-auto">
                    Together, these three companies represent my commitment to building technology that creates 
                    real value and positive impact across different communities and markets.
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-amber-600 mb-1">100K+</div>
                    <div className="text-sm text-gray-600">Total Users Served</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-amber-600 mb-1">£500K+</div>
                    <div className="text-sm text-gray-600">Revenue Generated</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-amber-600 mb-1">2</div>
                    <div className="text-sm text-gray-600">Countries Served</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-amber-600 mb-1">99.9%</div>
                    <div className="text-sm text-gray-600">Average Uptime</div>
                  </div>
                </div>
              </motion.div>
            </TabsContent>

            {/* Values Tab */}
            <TabsContent value="values" className="space-y-12">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">My Values & Principles</h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  These core values guide every project I undertake and every business decision I make. 
                  They reflect my commitment to building technology that truly serves people.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {values.map((value, index) => (
                  <motion.div
                    key={value.title}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    whileHover={{ y: -5 }}
                  >
                    <Card className="h-full border border-gray-200 shadow-lg hover:border-amber-300 hover:shadow-xl transition-all duration-300">
                      <CardHeader>
                        <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
                          <value.icon className="w-6 h-6 text-amber-600" />
                        </div>
                        <CardTitle className="text-xl font-bold text-gray-900">{value.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 leading-relaxed">{value.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Mission Statement */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="bg-gradient-to-r from-gray-50 to-white p-8 rounded-2xl border border-gray-200 text-center"
              >
                <Lightbulb className="w-16 h-16 text-amber-500 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4">My Mission</h3>
                <p className="text-xl text-gray-700 max-w-4xl mx-auto leading-relaxed">
                  &#34;To bridge the gap between complex technology and real-world solutions by building 
                  software that empowers businesses, connects communities, and creates opportunities 
                  for growth across the UK, Ghana, and beyond.&#34;
                </p>
                <div className="mt-6">
                  <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
                    Computing & IT Graduate | Tech Entrepreneur | Problem Solver
                  </Badge>
                </div>
              </motion.div>

              {/* Future Goals */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true }}
                >
                  <Card className="border border-blue-200 bg-blue-50">
                    <CardHeader>
                      <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Target className="w-5 h-5 text-blue-500" />
                        Short-term Goals (2025)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                          <span className="text-gray-700">Complete Computing & IT degree with distinction</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <ArrowRight className="w-4 h-4 text-blue-500 mt-0.5" />
                          <span className="text-gray-700">Scale oKadwuma to 50,000+ users</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <ArrowRight className="w-4 h-4 text-blue-500 mt-0.5" />
                          <span className="text-gray-700">Launch mobile apps for key platforms</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <ArrowRight className="w-4 h-4 text-blue-500 mt-0.5" />
                          <span className="text-gray-700">Expand iPaha Ltd client base to 200+</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  viewport={{ once: true }}
                >
                  <Card className="border border-purple-200 bg-purple-50">
                    <CardHeader>
                      <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Rocket className="w-5 h-5 text-purple-500" />
                        Long-term Vision (2026+)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        <li className="flex items-start gap-2">
                          <ArrowRight className="w-4 h-4 text-purple-500 mt-0.5" />
                          <span className="text-gray-700">Establish tech hub connecting UK and Africa</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <ArrowRight className="w-4 h-4 text-purple-500 mt-0.5" />
                          <span className="text-gray-700">Launch educational platform for developers</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <ArrowRight className="w-4 h-4 text-purple-500 mt-0.5" />
                          <span className="text-gray-700">Mentor 1000+ aspiring tech entrepreneurs</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <ArrowRight className="w-4 h-4 text-purple-500 mt-0.5" />
                          <span className="text-gray-700">Impact 1 million lives through technology</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 px-4 bg-gradient-to-r from-amber-50 to-amber-100/50">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                Let&apos;s Build Something Amazing Together
              </h2>
            </div>
            
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Whether you need a custom software solution, want to scale your business with technology, 
              or have an innovative idea to bring to life, I&apos;d love to hear from you.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-white">
                <Briefcase className="w-5 h-5 mr-2" />
                Start a Project
              </Button>
              <Button size="lg" variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50">
                <Calendar className="w-5 h-5 mr-2" />
                Schedule a Consultation
              </Button>
            </div>

            <div className="flex justify-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                24-hour response time
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-amber-500" />
                Global project delivery
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-500" />
                Quality guaranteed
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default About;