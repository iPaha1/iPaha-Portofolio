// lib/seo-config.ts - Enhanced centralized SEO configuration
export const seoConfig = {
  defaultTitle: 'Isaac Paha | Full-Stack Developer & Tech Entrepreneur',
  titleTemplate: '%s | Isaac Paha',
  defaultDescription: 'Computing & IT graduate from Open University London (2025) and full-stack developer. Founder of iPaha Ltd, iPahaStores Ltd, and Okpah Ltd. Built platforms serving 100K+ users across UK and Ghana. Specializing in React.js, Next.js, Node.js, and scalable digital solutions.',
  siteUrl: 'https://www.isaacpaha.com',
  siteName: 'Isaac Paha',
  author: 'Isaac Paha',
  
  // Personal information
  personal: {
    fullName: 'Isaac Paha',
    title: 'Computing & IT Graduate | Full-Stack Developer & Tech Entrepreneur',
    education: 'Computing & IT, Open University London (2025)',
    location: 'United Kingdom',
    email: 'pahaisaac@gmail.com',
    phone: '+44 7402 497091',
  },

  // Social profiles
  social: {
    github: 'https://github.com/iPaha1',
    linkedin: 'https://www.linkedin.com/in/isaac-paha-578911a9/',
    email: 'pahaisaac@gmail.com',
    twitter: '@iPaha3',
    website: 'https://www.isaacpaha.com'
  },
  
  // Companies founded
  companies: [
    {
      name: 'iPaha Ltd',
      url: 'https://ipahait.com',
      description: 'IT consultancy providing custom software and digital solutions for businesses across the UK and Europe',
      location: 'United Kingdom',
      founded: '2024',
      industry: 'IT Consultancy',
      services: ['Custom Software Development', 'IT Consulting', 'Digital Transformation', 'Technical Architecture']
    },
    {
      name: 'iPahaStores Ltd',
      url: 'https://ipahastore.com',
      description: 'SaaS company offering e-commerce solutions and digital platforms for online retailers',
      location: 'United Kingdom',
      founded: '2024',
      industry: 'SaaS & E-commerce',
      services: ['SaaS Platform Development', 'E-commerce Solutions', 'Payment Integration', 'Analytics & Reporting']
    },
    {
      name: 'Okpah Ltd',
      url: 'https://okpah.com',
      description: 'Innovation-driven startup building digital platforms that address local challenges in Ghana and West Africa',
      location: 'Ghana',
      founded: '2024',
      industry: 'Digital Innovation',
      services: ['Job Platforms', 'Marketplace Solutions', 'Mobile Money Integration', 'Local Tech Solutions']
    }
  ],
  
  // Products built
  products: [
    {
      name: 'oKadwuma.com',
      url: 'https://okadwuma.com',
      description: 'Job search platform connecting Ghanaian jobseekers and employers',
      category: 'Job Platform',
      users: '10,000+',
      companies: '500+',
      launched: '2024'
    },
    {
      name: 'okDdwa.com',
      url: 'https://okddwa.com',
      description: 'Multi-tenant e-commerce marketplace helping local traders sell online',
      category: 'E-commerce Marketplace',
      vendors: '1,200+',
      products: '15,000+',
      revenue: '$50,000+',
      launched: '2024'
    }
  ],
  
  // Technical expertise
  techStack: {
    frontend: ['React.js', 'Next.js', 'TypeScript', 'Tailwind CSS', 'JavaScript', 'HTML/CSS'],
    backend: ['Node.js', 'Express.js', 'Prisma ORM', 'REST APIs', 'GraphQL', 'Python'],
    database: ['MySQL', 'PostgreSQL', 'MongoDB', 'Redis'],
    tools: ['Git/GitHub', 'Docker', 'AWS', 'Vercel', 'Stripe', 'Clerk Auth'],
    specialties: ['SaaS Architecture', 'Scalable Systems', 'Payment Integration', 'Mobile Money APIs']
  },
  
  // Achievements and metrics
  achievements: {
    totalUsers: '100,000+',
    projectsCompleted: '25+',
    companiesServed: '650+',
    uptime: '99.9%',
    responseTime: '24 hours',
    yearsExperience: '3+'
  },
  
  // SEO keywords for different pages
  keywords: {
    home: [
      'Isaac Paha', 'Computing IT graduate', 'Open University London', 'Full-Stack Developer',
      'Tech Entrepreneur', 'iPaha Ltd', 'iPahaStores Ltd', 'Okpah Ltd',
      'React.js developer', 'Next.js expert', 'Node.js', 'UK developer',
      'oKadwuma', 'okDdwa', 'Ghana tech', 'scalable platforms'
    ],
    about: [
      'Isaac Paha biography', 'Computing IT graduate story', 'Open University London alumni',
      'Tech entrepreneur journey', 'Full-stack developer background', 'UK Ghana developer',
      'startup founder story', 'three companies founded'
    ],
    projects: [
      'Isaac Paha projects', 'oKadwuma job platform', 'okDdwa marketplace',
      'React Next.js portfolio', 'SaaS development', 'E-commerce platforms',
      'Ghana job search', 'multi-tenant marketplace', 'scalable web applications'
    ],
    blog: [
      'Isaac Paha blog', 'tech entrepreneurship', 'startup journey', 'scalable development',
      'Computing IT insights', 'full-stack tutorials', 'SaaS scaling', 'Ghana tech scene',
      'React development tips', 'Node.js best practices'
    ],
    contact: [
      'Isaac Paha contact', 'hire full-stack developer', 'UK tech consultant',
      'custom software development', 'SaaS development services', 'startup CTO',
      'technical consulting', 'scalable platform development'
    ]
  },
  
  // Image assets
  images: {
    profile: '/images/photo1.png',
    ogImage: '/images/isaac-paha-og-image.jpg',
    logo: '/images/logo.png',
    favicon: '/favicon.ico',
    appleTouchIcon: '/apple-touch-icon.png'
  },

  // Business information
  business: {
    type: 'Personal Portfolio & Business Website',
    industry: 'Information Technology',
    services: [
      'Full-Stack Development',
      'SaaS Platform Development',
      'E-commerce Solutions',
      'Technical Consulting',
      'System Architecture',
      'Startup CTO Services'
    ],
    serviceAreas: ['United Kingdom', 'Ghana', 'Global Remote'],
    established: '2024'
  }
}