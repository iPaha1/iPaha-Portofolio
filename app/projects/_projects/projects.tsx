"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ExternalLink, 
  Github, 
  Users,
  Star,
  Code,
  Target,
  Award,
  TrendingUp,
  Filter,
  Search,
  Eye,
  Clock,
  Mail,
  Briefcase,
  Building,
  MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import Link from 'next/link';

// Project data with comprehensive details
const projectsData = [
  {
    id: 1,
    title: "oKadwuma.com",
    subtitle: "Job Search Platform",
    description: "A comprehensive job search platform connecting Ghanaian jobseekers with employers. Features advanced search filters, real-time notifications, and integrated application tracking.",
    longDescription: "oKadwuma revolutionizes job searching in Ghana by providing a seamless platform that bridges the gap between talented jobseekers and forward-thinking employers. The platform includes AI-powered job matching, skill assessments, and career development resources.",
    image: "/images/projects/okadwuma-preview.jpg",
    category: "Web Application",
    type: "Full-Stack",
    status: "Live",
    year: "2024",
    company: "Okpah Ltd",
    companyFlag: "🇬🇭",
    liveUrl: "https://okadwuma.com",
    githubUrl: null, // Private repository
    technologies: ["React.js", "Next.js", "Node.js", "Express.js", "MongoDB", "Stripe", "JWT", "Tailwind CSS"],
    features: [
      "Advanced job search and filtering",
      "Real-time job alerts and notifications",
      "Employer dashboard and analytics",
      "Integrated payment system",
      "Mobile-responsive design",
      "Multi-language support (English/Twi)"
    ],
    metrics: {
      users: "10,000+",
      jobs: "5,000+",
      companies: "500+",
      matches: "25,000+"
    },
    highlights: [
      "Featured in Ghana Tech Weekly",
      "99.9% uptime performance",
      "4.8/5 user satisfaction rating"
    ],
    duration: "8 months",
    teamSize: "3 developers",
    role: "Lead Developer & Technical Architect"
  },
  {
    id: 2,
    title: "okDdwa.com",
    subtitle: "E-commerce Marketplace",
    description: "Multi-tenant e-commerce marketplace empowering local Ghanaian traders to sell online. Features vendor management, payment processing, and logistics integration.",
    longDescription: "okDdwa transforms local commerce in Ghana by providing small and medium traders with a powerful e-commerce platform. The marketplace includes vendor onboarding, inventory management, and integrated mobile money payments.",
    image: "/images/projects/okddwa-preview.jpg",
    category: "E-commerce",
    type: "Full-Stack",
    status: "Live",
    year: "2024",
    company: "Okpah Ltd",
    companyFlag: "🇬🇭",
    liveUrl: "https://okddwa.com",
    githubUrl: null,
    technologies: ["React.js", "Next.js", "TypeScript", "Prisma", "MySQL", "Stripe", "MoMo API", "Cloudinary"],
    features: [
      "Multi-vendor marketplace",
      "Inventory management system",
      "Mobile Money integration",
      "Order tracking and logistics",
      "Vendor analytics dashboard",
      "Customer review system"
    ],
    metrics: {
      vendors: "1,200+",
      products: "15,000+",
      orders: "8,500+",
      revenue: "$50,000+"
    },
    highlights: [
      "First multi-tenant marketplace in Ghana",
      "Integrated with all major MoMo providers",
      "95% vendor retention rate"
    ],
    duration: "10 months",
    teamSize: "4 developers",
    role: "Full-Stack Lead & System Architect"
  },
  {
    id: 3,
    title: "iPaha Business Suite",
    subtitle: "Enterprise Management System",
    description: "Comprehensive business management platform for SMEs. Includes CRM, project management, invoicing, and team collaboration tools.",
    longDescription: "A complete business solution designed for growing companies. The platform integrates all essential business operations into one cohesive system, improving efficiency and reducing operational costs.",
    image: "/images/projects/ipaha-suite-preview.jpg",
    category: "SaaS Platform",
    type: "Full-Stack",
    status: "Live",
    year: "2024",
    company: "iPaha Ltd",
    companyFlag: "🇬🇧",
    liveUrl: "https://suite.ipahait.com",
    githubUrl: null,
    technologies: ["React.js", "Next.js", "TypeScript", "Node.js", "PostgreSQL", "Prisma", "Stripe", "AWS"],
    features: [
      "Customer Relationship Management",
      "Project & Task Management",
      "Automated Invoicing & Billing",
      "Team Collaboration Tools",
      "Advanced Analytics & Reporting",
      "API Integration Hub"
    ],
    metrics: {
      clients: "150+",
      projects: "3,000+",
      invoices: "10,000+",
      uptime: "99.9%"
    },
    highlights: [
      "Enterprise-grade security",
      "SOC 2 Type II compliant",
      "Multi-currency support"
    ],
    duration: "12 months",
    teamSize: "5 developers",
    role: "Technical Lead & Product Owner"
  },
  {
    id: 4,
    title: "StoreFlow Pro",
    subtitle: "E-commerce Management Platform",
    description: "Advanced e-commerce management system for online retailers. Features inventory automation, multi-channel selling, and AI-powered analytics.",
    longDescription: "StoreFlow Pro revolutionizes e-commerce operations by providing retailers with intelligent automation tools, comprehensive analytics, and seamless multi-platform integration.",
    image: "/images/projects/storeflow-preview.jpg",
    category: "SaaS Platform",
    type: "Full-Stack",
    status: "Beta",
    year: "2024",
    company: "iPahaStores Ltd",
    companyFlag: "🇬🇧",
    liveUrl: "https://beta.ipahastore.com",
    githubUrl: null,
    technologies: ["React.js", "Next.js", "Python", "FastAPI", "PostgreSQL", "Redis", "Docker", "Kubernetes"],
    features: [
      "AI-powered inventory management",
      "Multi-channel sales integration",
      "Automated reorder alerts",
      "Predictive analytics dashboard",
      "Customer behavior insights",
      "Automated marketing campaigns"
    ],
    metrics: {
      users: "500+",
      stores: "1,000+",
      orders: "50,000+",
      accuracy: "98.5%"
    },
    highlights: [
      "AI-driven demand forecasting",
      "50% reduction in stockouts",
      "Featured in UK Tech Innovation Awards"
    ],
    duration: "14 months",
    teamSize: "6 developers",
    role: "CTO & Lead Architect"
  },
  {
    id: 5,
    title: "DevCollab Hub",
    subtitle: "Developer Collaboration Platform",
    description: "Modern collaboration platform for development teams. Features code review tools, project tracking, and integrated CI/CD workflows.",
    longDescription: "DevCollab Hub streamlines software development workflows by providing teams with powerful collaboration tools, automated testing pipelines, and comprehensive project management capabilities.",
    image: "/images/projects/devcollab-preview.jpg",
    category: "Developer Tools",
    type: "Full-Stack",
    status: "Live",
    year: "2023",
    company: "iPaha Ltd",
    companyFlag: "🇬🇧",
    liveUrl: "https://devcollab.ipahait.com",
    githubUrl: "https://github.com/iPaha1/devcollab-hub",
    technologies: ["React.js", "Node.js", "TypeScript", "GraphQL", "MongoDB", "Docker", "GitHub API", "Slack API"],
    features: [
      "Real-time code collaboration",
      "Automated code review workflows",
      "Integrated CI/CD pipelines",
      "Project timeline tracking",
      "Team performance analytics",
      "Third-party integrations"
    ],
    metrics: {
      teams: "200+",
      projects: "1,500+",
      reviews: "25,000+",
      integrations: "50+"
    },
    highlights: [
      "Open source contributions",
      "95% developer satisfaction",
      "Featured on Product Hunt"
    ],
    duration: "6 months",
    teamSize: "3 developers",
    role: "Full-Stack Developer & Open Source Maintainer"
  },
  {
    id: 6,
    title: "FinTrack Analytics",
    subtitle: "Personal Finance Management",
    description: "Intelligent personal finance tracker with budgeting tools, expense categorization, and financial goal setting.",
    longDescription: "FinTrack Analytics helps individuals take control of their financial future through smart budgeting, automated expense tracking, and personalized financial insights.",
    image: "/images/projects/fintrack-preview.jpg",
    category: "Fintech",
    type: "Mobile App",
    status: "Live",
    year: "2023",
    company: "Personal Project",
    companyFlag: "🇬🇧",
    liveUrl: "https://fintrack.isaacpaha.com",
    githubUrl: "https://github.com/iPaha1/fintrack-analytics",
    technologies: ["React Native", "Node.js", "Express.js", "MongoDB", "Plaid API", "Chart.js", "Firebase"],
    features: [
      "Automated expense categorization",
      "Budget planning and tracking",
      "Financial goal setting",
      "Investment portfolio tracking",
      "Bill reminder notifications",
      "Financial health scoring"
    ],
    metrics: {
      users: "5,000+",
      transactions: "100,000+",
      savings: "$2M+",
      rating: "4.7/5"
    },
    highlights: [
      "Featured in App Store Finance section",
      "Winner of Fintech Innovation Challenge",
      "Bank-level security encryption"
    ],
    duration: "4 months",
    teamSize: "Solo project",
    role: "Solo Full-Stack Developer"
  }
];

const categories = ["All", "Web Application", "E-commerce", "SaaS Platform", "Developer Tools", "Fintech", "Mobile App"];
const technologies = ["React.js", "Next.js", "TypeScript", "Node.js", "Python", "MongoDB", "PostgreSQL", "AWS"];
const companies = ["All", "iPaha Ltd", "iPahaStores Ltd", "Okpah Ltd", "Personal Project"];

// Project Card Component
// Define the Project type based on the structure of projectsData
type Project = typeof projectsData[number];

interface ProjectCardProps {
  project: Project;
  index: number;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, index }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      whileHover={{ y: -8 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group"
    >
      <Card className="h-full bg-white border border-gray-200 hover:border-amber-300 hover:shadow-2xl transition-all duration-500 overflow-hidden">
        
        {/* Project Image */}
        <div className="relative h-48 overflow-hidden bg-gradient-to-br from-amber-100 to-amber-200">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-6xl font-bold text-amber-500/30">
              {project.title.charAt(0)}
            </div>
          </div>
          
          {/* Status Badge */}
          <div className="absolute top-4 left-4">
            <Badge 
              variant={project.status === 'Live' ? 'default' : project.status === 'Beta' ? 'secondary' : 'outline'}
              className={`${
                project.status === 'Live' 
                  ? 'bg-green-500 hover:bg-green-600' 
                  : project.status === 'Beta' 
                  ? 'bg-blue-500 hover:bg-blue-600' 
                  : 'bg-gray-500 hover:bg-gray-600'
              } text-white`}
            >
              {project.status}
            </Badge>
          </div>

          {/* Company Badge */}
          <div className="absolute top-4 right-4">
            <Badge variant="outline" className="bg-white/90 backdrop-blur-sm">
              {project.companyFlag} {project.company}
            </Badge>
          </div>

          {/* Hover Overlay */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 flex items-center justify-center gap-3"
              >
                {project.liveUrl && (
                  <Button size="sm" asChild className="bg-amber-500 hover:bg-amber-600">
                    <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Live Demo
                    </a>
                  </Button>
                )}
                {project.githubUrl && (
                  <Button size="sm" variant="outline" asChild className="bg-white/90 hover:bg-white">
                    <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                      <Github className="w-4 h-4 mr-2" />
                      Code
                    </a>
                  </Button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-amber-600 transition-colors">
                {project.title}
              </CardTitle>
              <CardDescription className="text-amber-600 font-medium mt-1">
                {project.subtitle}
              </CardDescription>
            </div>
            <Badge variant="outline" className="ml-2">
              {project.year}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <p className="text-gray-600 text-sm mb-4 line-clamp-3">
            {project.description}
          </p>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {Object.entries(project.metrics).slice(0, 4).map(([key, value]) => (
              <div key={key} className="text-center p-2 bg-gray-50 rounded-lg">
                <div className="text-lg font-bold text-amber-600">{value}</div>
                <div className="text-xs text-gray-500 capitalize">{key}</div>
              </div>
            ))}
          </div>

          {/* Technologies */}
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {project.technologies.slice(0, 4).map((tech) => (
                <Badge key={tech} variant="secondary" className="text-xs bg-amber-100 text-amber-700">
                  {tech}
                </Badge>
              ))}
              {project.technologies.length > 4 && (
                <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                  +{project.technologies.length - 4} more
                </Badge>
              )}
            </div>
          </div>

          {/* Project Details */}
          <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {project.duration}
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {project.teamSize}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 border-amber-200 text-amber-700 hover:bg-amber-50"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </Button>
            {project.liveUrl && (
              <Button size="sm" asChild className="bg-amber-500 hover:bg-amber-600">
                <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4" />
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Statistics Component
const StatsSection = () => {
  const stats = [
    { label: "Projects Completed", value: "25+", icon: Target, color: "text-blue-600" },
    { label: "Happy Clients", value: "50+", icon: Users, color: "text-green-600" },
    { label: "Technologies Mastered", value: "20+", icon: Code, color: "text-purple-600" },
    { label: "Years Experience", value: "5+", icon: Award, color: "text-amber-600" }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12"
    >
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className="text-center"
        >
          <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-200 hover:border-amber-300 transition-colors">
            <stat.icon className={`w-8 h-8 mx-auto mb-3 ${stat.color}`} />
            <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
            <div className="text-sm text-gray-600">{stat.label}</div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

// Main Projects Component
const Projects = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedCompany, setSelectedCompany] = useState("All");
  const [selectedTech, setSelectedTech] = useState("");

  // Filter projects based on search and filters
  const filteredProjects = projectsData.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.technologies.some(tech => tech.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === "All" || project.category === selectedCategory;
    const matchesCompany = selectedCompany === "All" || project.company === selectedCompany;
    const matchesTech = !selectedTech || project.technologies.includes(selectedTech);

    return matchesSearch && matchesCategory && matchesCompany && matchesTech;
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-gradient-to-br from-gray-50 to-white overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-amber-400/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-500/8 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-gray-800 to-amber-600 bg-clip-text text-transparent">
                My Projects
              </h1>
            </div>
            
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Explore my portfolio of innovative digital solutions across three tech companies. 
              From job platforms to e-commerce marketplaces, each project represents a commitment 
              to solving real-world problems through technology.
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
                <Building className="w-3 h-3 mr-1" />
                3 Companies Founded
              </Badge>
              <Badge variant="outline" className="text-blue-700 border-blue-300 bg-blue-50">
                <Code className="w-3 h-3 mr-1" />
                Full-Stack Development
              </Badge>
              <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
                <TrendingUp className="w-3 h-3 mr-1" />
                100K+ Users Served
              </Badge>
            </div>
          </motion.div>

          {/* Statistics */}
          <StatsSection />
        </div>
      </section>

      {/* Filters Section */}
      <section className="py-8 px-4 bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col lg:flex-row gap-4 items-center"
          >
            
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search projects, technologies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-300 focus:border-amber-500"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px] border-gray-300 focus:border-amber-500">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                <SelectTrigger className="w-[180px] border-gray-300 focus:border-amber-500">
                  <Building className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map(company => (
                    <SelectItem key={company} value={company}>{company}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedTech} onValueChange={setSelectedTech}>
                <SelectTrigger className="w-[180px] border-gray-300 focus:border-amber-500">
                  <Code className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Technology" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">All Technologies</SelectItem>
                  {technologies.map(tech => (
                    <SelectItem key={tech} value={tech}>{tech}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Clear Filters */}
              {(searchTerm || selectedCategory !== "All" || selectedCompany !== "All" || selectedTech) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("All");
                    setSelectedCompany("All");
                    setSelectedTech("");
                  }}
                  className="border-gray-300 hover:bg-gray-50"
                >
                  Clear All
                </Button>
              )}
            </div>
          </motion.div>

          {/* Results Count */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-4 text-sm text-gray-600"
          >
            Showing {filteredProjects.length} of {projectsData.length} projects
          </motion.div>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            {filteredProjects.length > 0 ? (
              <motion.div
                key="projects-grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                {filteredProjects.map((project, index) => (
                  <ProjectCard key={project.id} project={project} index={index} />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="no-results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center py-16"
              >
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">No projects found</h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your search criteria or clearing the filters.
                </p>
                <Button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("All");
                    setSelectedCompany("All");
                    setSelectedTech("");
                  }}
                  className="bg-amber-500 hover:bg-amber-600"
                >
                  View All Projects
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
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
            <Star className="w-16 h-16 text-amber-500 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Ready to Start Your Next Project?
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Let&apos;s collaborate to bring your digital vision to life. With expertise across 
              full-stack development and a proven track record of successful launches.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact" passHref>
              <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-white">
                <Mail className="w-5 h-5 mr-2" />
                Start a Project
              </Button>
              </Link>

              {/* Uncomment this section if you want to add a scheduling button */}
              {/* <Button size="lg" variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50">
                <Calendar className="w-5 h-5 mr-2" />
                Schedule a Call
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
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Projects;