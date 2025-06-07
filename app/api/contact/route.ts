// app/api/contact/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { 
  ContactEmailTemplate, 
  AutoReplyTemplate, 
  UrgentInquiryTemplate 
} from '@/lib/email-templates';

// Initialize Resend with your API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Interface for form data
interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  projectType?: string;
  budget?: string;
  timeline?: string;
  message: string;
}

// Function to determine if inquiry is urgent
const isUrgentInquiry = (data: ContactFormData): boolean => {
  const urgentBudgets = ['30k-50k', '50k-plus'];
  const urgentTimelines = ['asap', '1-month'];
  const urgentProjectTypes = ['saas', 'enterprise'];
  
  return (
    (data.budget && urgentBudgets.includes(data.budget)) ||
    (data.timeline && urgentTimelines.includes(data.timeline)) ||
    (data.projectType && urgentProjectTypes.includes(data.projectType)) ||
    data.message.toLowerCase().includes('urgent') ||
    data.message.toLowerCase().includes('asap') ||
    data.message.toLowerCase().includes('enterprise')
  );
};

// Function to validate email format
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Function to sanitize input to prevent XSS
const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '')
    .trim()
    .substring(0, 5000); // Limit length
};

export async function POST(request: NextRequest) {
  try {
    // Debug: Check if API key is available
    console.log('🔑 Checking Resend API key:', {
      hasApiKey: !!process.env.RESEND_API_KEY,
      keyLength: process.env.RESEND_API_KEY?.length || 0,
      keyPreview: process.env.RESEND_API_KEY?.substring(0, 10) + '...' || 'MISSING'
    });

    if (!process.env.RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY is not set in environment variables');
      return NextResponse.json(
        { 
          message: 'Email service not configured. Please contact me directly at pahaisaac@gmail.com',
          code: 'MISSING_API_KEY'
        },
        { status: 500 }
      );
    }

    // Parse the request body
    const body = await request.json();
    console.log('📥 Received form data:', {
      name: body.name,
      email: body.email,
      hasPhone: !!body.phone,
      hasCompany: !!body.company,
      projectType: body.projectType,
      budget: body.budget,
      timeline: body.timeline,
      messageLength: body.message?.length || 0
    });
    
    // Destructure and sanitize form data
    const formData: ContactFormData = {
      name: sanitizeInput(body.name || ''),
      email: sanitizeInput(body.email || ''),
      phone: body.phone ? sanitizeInput(body.phone) : '',
      company: body.company ? sanitizeInput(body.company) : '',
      projectType: body.projectType || '',
      budget: body.budget || '',
      timeline: body.timeline || '',
      message: sanitizeInput(body.message || '')
    };

    // Validate required fields
    if (!formData.name || !formData.email || !formData.message) {
      return NextResponse.json(
        { 
          message: 'Name, email, and message are required.',
          code: 'MISSING_REQUIRED_FIELDS'
        },
        { status: 400 }
      );
    }

    // Validate email format
    if (!isValidEmail(formData.email)) {
      return NextResponse.json(
        { 
          message: 'Please provide a valid email address.',
          code: 'INVALID_EMAIL_FORMAT'
        },
        { status: 400 }
      );
    }

    // Check if this is an urgent inquiry
    const isUrgent = isUrgentInquiry(formData);
    console.log('⚡ Urgency check:', { isUrgent, budget: formData.budget, timeline: formData.timeline });

    // Choose appropriate email template based on urgency
    const emailTemplate = isUrgent 
      ? UrgentInquiryTemplate({
          ...formData,
          phone: formData.phone ?? '',
          company: formData.company ?? '',
          projectType: formData.projectType ?? '',
          budget: formData.budget ?? '',
          timeline: formData.timeline ?? ''
        })
      : ContactEmailTemplate({
          ...formData,
          phone: formData.phone ?? '',
          company: formData.company ?? '',
          projectType: formData.projectType ?? '',
          budget: formData.budget ?? '',
          timeline: formData.timeline ?? ''
        });

    // Prepare subject line with priority indicator
    const subjectPrefix = isUrgent ? '🚨 URGENT: ' : '🚀 ';
    const subject = `${subjectPrefix}New Project Inquiry from ${formData.name}`;

    console.log('📧 Preparing to send emails...');

    // Send notification email to Isaac
    console.log('📧 Sending notification email...');
    const notificationEmail = await resend.emails.send({
      // Try using onboarding@resend.dev if domain isn't verified yet
      from: 'Contact Form <onboarding@resend.dev>', // Fallback for testing
      to: ['pahaisaac@gmail.com'],
      subject,
      html: emailTemplate,
      replyTo: formData.email,
    });

    console.log('📧 Notification email response:', {
      success: !!notificationEmail.data,
      id: notificationEmail.data?.id,
      error: notificationEmail.error
    });

    // Send auto-reply to the client
    console.log('📧 Sending auto-reply email...');
    const autoReplySubject = `Thank you for your project inquiry, ${formData.name}!`;
    const autoReplyEmail = await resend.emails.send({
      // Try using onboarding@resend.dev if domain isn't verified yet
      from: 'Isaac Paha <onboarding@resend.dev>', // Fallback for testing
      to: [formData.email],
      subject: autoReplySubject,
      html: AutoReplyTemplate({ name: formData.name }),
      replyTo: 'pahaisaac@gmail.com',
    });

    console.log('📧 Auto-reply email response:', {
      success: !!autoReplyEmail.data,
      id: autoReplyEmail.data?.id,
      error: autoReplyEmail.error
    });

    // Check if emails were actually sent
    if (!notificationEmail.data?.id || !autoReplyEmail.data?.id) {
      console.error('❌ Email sending failed:', {
        notificationError: notificationEmail.error,
        autoReplyError: autoReplyEmail.error
      });
      
      return NextResponse.json(
        { 
          message: 'Failed to send emails. Please contact me directly at pahaisaac@gmail.com or +44 7402 497091',
          code: 'EMAIL_SEND_FAILED',
          debug: {
            notificationError: notificationEmail.error,
            autoReplyError: autoReplyEmail.error
          }
        },
        { status: 500 }
      );
    }

    // Log successful sends for monitoring
    console.log('✅ All emails sent successfully:', {
      notificationId: notificationEmail.data?.id,
      autoReplyId: autoReplyEmail.data?.id,
      to: 'pahaisaac@gmail.com',
      from: formData.name,
      urgent: isUrgent,
      timestamp: new Date().toISOString()
    });

    // Return success response with appropriate message
    const responseMessage = isUrgent 
      ? 'Thank you for your urgent inquiry! I\'ll prioritize your request and get back to you within a few hours.'
      : 'Thank you for your inquiry! I\'ll get back to you within 24 hours.';

    return NextResponse.json(
      { 
        message: responseMessage,
        notificationId: notificationEmail.data?.id,
        autoReplyId: autoReplyEmail.data?.id,
        priority: isUrgent ? 'urgent' : 'normal',
        estimatedResponse: isUrgent ? '2-4 hours' : '24 hours',
        debug: {
          apiKeyPresent: !!process.env.RESEND_API_KEY,
          emailsSent: true
        }
      },
      { status: 200 }
    );

  } catch (error) {
    // Enhanced error logging for debugging
    console.error('❌ Error in contact API:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    
    // Handle specific Resend API errors
    if (error instanceof Error) {
      // Check for common Resend errors
      if (error.message.includes('Invalid API key') || error.message.includes('Unauthorized')) {
        console.error('🔑 Invalid Resend API key. Please check your environment variables.');
        return NextResponse.json(
          { 
            message: 'Email service configuration error. Please contact me directly at pahaisaac@gmail.com',
            code: 'EMAIL_SERVICE_ERROR',
            debug: {
              apiKeyPresent: !!process.env.RESEND_API_KEY,
              error: 'Invalid API key'
            }
          },
          { status: 500 }
        );
      }
      
      if (error.message.includes('Domain not verified') || error.message.includes('domain')) {
        console.error('🌐 Domain not verified in Resend. Trying with onboarding domain.');
        return NextResponse.json(
          { 
            message: 'Email service configuration error. Please contact me directly at pahaisaac@gmail.com',
            code: 'DOMAIN_NOT_VERIFIED',
            debug: {
              error: 'Domain not verified'
            }
          },
          { status: 500 }
        );
      }
      
      if (error.message.includes('Rate limit')) {
        console.error('⏱️ Rate limit exceeded for Resend API.');
        return NextResponse.json(
          { 
            message: 'Too many requests. Please try again in a few minutes.',
            code: 'RATE_LIMIT_EXCEEDED'
          },
          { status: 429 }
        );
      }
      
      // Generic error response
      return NextResponse.json(
        { 
          message: `Failed to send message: ${error.message}. Please contact me directly at pahaisaac@gmail.com or +44 7402 497091`,
          code: 'EMAIL_SEND_FAILED',
          debug: {
            errorMessage: error.message
          }
        },
        { status: 500 }
      );
    }

    // Fallback for unknown errors
    return NextResponse.json(
      { 
        message: 'An unexpected error occurred. Please contact me directly at pahaisaac@gmail.com or +44 7402 497091',
        code: 'UNKNOWN_ERROR'
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS requests for CORS (preflight requests)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// Handle GET requests with helpful information for debugging
export async function GET() {
  return NextResponse.json(
    {
      message: 'Isaac Paha Contact API - Debug Information',
      status: 'Active',
      environment: {
        hasResendApiKey: !!process.env.RESEND_API_KEY,
        apiKeyLength: process.env.RESEND_API_KEY?.length || 0,
        nodeEnv: process.env.NODE_ENV
      },
      author: 'Isaac Paha - Computing & IT Graduate & Tech Entrepreneur',
      companies: [
        'iPaha Ltd (UK) - ipahait.com',
        'iPahaStores Ltd (UK) - ipahastore.com', 
        'Okpah Ltd (Ghana) - okpah.com'
      ],
      contact: {
        email: 'pahaisaac@gmail.com',
        phone: '+44 7402 497091',
        website: 'https://isaacpaha.com'
      },
      timestamp: new Date().toISOString()
    },
    { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache'
      }
    }
  );
}



// // app/api/contact/route.ts
// import { NextRequest, NextResponse } from 'next/server';
// import { Resend } from 'resend';
// import { 
//   ContactEmailTemplate, 
//   AutoReplyTemplate, 
//   UrgentInquiryTemplate 
// } from '@/lib/email-templates';

// // Initialize Resend with your API key
// const resend = new Resend(process.env.RESEND_API_KEY);

// // Interface for form data
// interface ContactFormData {
//   name: string;
//   email: string;
//   phone?: string;
//   company?: string;
//   projectType?: string;
//   budget?: string;
//   timeline?: string;
//   message: string;
// }

// // Function to determine if inquiry is urgent
// const isUrgentInquiry = (data: ContactFormData): boolean => {
//   const urgentBudgets = ['30k-50k', '50k-plus'];
//   const urgentTimelines = ['asap', '1-month'];
//   const urgentProjectTypes = ['saas', 'enterprise'];
  
//   return (
//     (data.budget && urgentBudgets.includes(data.budget)) ||
//     (data.timeline && urgentTimelines.includes(data.timeline)) ||
//     (data.projectType && urgentProjectTypes.includes(data.projectType)) ||
//     data.message.toLowerCase().includes('urgent') ||
//     data.message.toLowerCase().includes('asap') ||
//     data.message.toLowerCase().includes('enterprise')
//   );
// };

// // Function to validate email format
// const isValidEmail = (email: string): boolean => {
//   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//   return emailRegex.test(email);
// };

// // Function to sanitize input to prevent XSS
// const sanitizeInput = (input: string): string => {
//   return input
//     .replace(/[<>]/g, '')
//     .trim()
//     .substring(0, 5000); // Limit length
// };

// export async function POST(request: NextRequest) {
//   try {
//     // Parse the request body
//     const body = await request.json();
    
//     // Destructure and sanitize form data
//     const formData: ContactFormData = {
//       name: sanitizeInput(body.name || ''),
//       email: sanitizeInput(body.email || ''),
//       phone: body.phone ? sanitizeInput(body.phone) : '', // Always a string
//       company: body.company ? sanitizeInput(body.company) : '', // Always a string
//       projectType: body.projectType || '',
//       budget: body.budget || '',
//       timeline: body.timeline || '',
//       message: sanitizeInput(body.message || '')
//     };

//     // Validate required fields
//     if (!formData.name || !formData.email || !formData.message) {
//       return NextResponse.json(
//         { 
//           message: 'Name, email, and message are required.',
//           code: 'MISSING_REQUIRED_FIELDS'
//         },
//         { status: 400 }
//       );
//     }

//     // Validate email format
//     if (!isValidEmail(formData.email)) {
//       return NextResponse.json(
//         { 
//           message: 'Please provide a valid email address.',
//           code: 'INVALID_EMAIL_FORMAT'
//         },
//         { status: 400 }
//       );
//     }

//     // Check if this is an urgent inquiry
//     const isUrgent = isUrgentInquiry(formData);

//     // Choose appropriate email template based on urgency
//     const emailTemplate = isUrgent 
//       ? UrgentInquiryTemplate({ 
//           ...formData, 
//           phone: formData.phone ?? '', 
//           company: formData.company ?? '', 
//           projectType: formData.projectType ?? '', 
//           budget: formData.budget ?? '', 
//           timeline: formData.timeline ?? '' 
//         })
//       : ContactEmailTemplate({ 
//           ...formData, 
//           phone: formData.phone ?? '', 
//           company: formData.company ?? '', 
//           projectType: formData.projectType ?? '', 
//           budget: formData.budget ?? '', 
//           timeline: formData.timeline ?? '' 
//         });

//     // Prepare subject line with priority indicator
//     const subjectPrefix = isUrgent ? '🚨 URGENT: ' : '🚀 ';
//     const subject = `${subjectPrefix}New Project Inquiry from ${formData.name}`;

//     // Send notification email to Isaac
//     const notificationEmail = await resend.emails.send({
//       from: 'Isaac Paha Contact <noreply@isaacpaha.com>', // Use your verified domain
//       to: ['pahaisaac@gmail.com'],
//       subject,
//       html: emailTemplate,
//       replyTo: formData.email,
//       // Add tags for organization in Resend dashboard
//       tags: [
//         { name: 'source', value: 'contact-form' },
//         { name: 'priority', value: isUrgent ? 'urgent' : 'normal' },
//         { name: 'budget', value: formData.budget || 'not-specified' },
//         { name: 'project-type', value: formData.projectType || 'not-specified' }
//       ]
//     });

//     // Send auto-reply to the client
//     const autoReplySubject = `Thank you for your project inquiry, ${formData.name}!`;
//     const autoReplyEmail = await resend.emails.send({
//       from: 'Isaac Paha <isaac@isaacpaha.com>', // Use your verified domain
//       to: [formData.email],
//       subject: autoReplySubject,
//       html: AutoReplyTemplate({ name: formData.name }),
//       replyTo: 'pahaisaac@gmail.com',
//       // Add tags for auto-reply tracking
//       tags: [
//         { name: 'type', value: 'auto-reply' },
//         { name: 'source', value: 'contact-form' }
//       ]
//     });

//     // Log successful sends for monitoring
//     console.log('📧 Notification email sent:', {
//       id: notificationEmail.data?.id,
//       to: 'pahaisaac@gmail.com',
//       from: formData.name,
//       urgent: isUrgent,
//       timestamp: new Date().toISOString()
//     });

//     console.log('📧 Auto-reply email sent:', {
//       id: autoReplyEmail.data?.id,
//       to: formData.email,
//       timestamp: new Date().toISOString()
//     });

//     // Return success response with appropriate message
//     const responseMessage = isUrgent 
//       ? 'Thank you for your urgent inquiry! I\'ll prioritize your request and get back to you within a few hours.'
//       : 'Thank you for your inquiry! I\'ll get back to you within 24 hours.';

//     return NextResponse.json(
//       { 
//         message: responseMessage,
//         notificationId: notificationEmail.data?.id,
//         autoReplyId: autoReplyEmail.data?.id,
//         priority: isUrgent ? 'urgent' : 'normal',
//         estimatedResponse: isUrgent ? '2-4 hours' : '24 hours'
//       },
//       { status: 200 }
//     );

//   } catch (error) {
//     // Enhanced error logging for debugging
//     console.error('❌ Error sending emails:', {
//       error: error instanceof Error ? error.message : 'Unknown error',
//       stack: error instanceof Error ? error.stack : undefined,
//       timestamp: new Date().toISOString()
//     });
    
//     // Handle specific Resend API errors
//     if (error instanceof Error) {
//       // Check for common Resend errors
//       if (error.message.includes('Invalid API key')) {
//         console.error('🔑 Invalid Resend API key. Please check your environment variables.');
//         return NextResponse.json(
//           { 
//             message: 'Email service configuration error. Please try again later.',
//             code: 'EMAIL_SERVICE_ERROR'
//           },
//           { status: 500 }
//         );
//       }
      
//       if (error.message.includes('Domain not verified')) {
//         console.error('🌐 Domain not verified in Resend. Please verify your domain.');
//         return NextResponse.json(
//           { 
//             message: 'Email service configuration error. Please try again later.',
//             code: 'DOMAIN_NOT_VERIFIED'
//           },
//           { status: 500 }
//         );
//       }
      
//       if (error.message.includes('Rate limit')) {
//         console.error('⏱️ Rate limit exceeded for Resend API.');
//         return NextResponse.json(
//           { 
//             message: 'Too many requests. Please try again in a few minutes.',
//             code: 'RATE_LIMIT_EXCEEDED'
//           },
//           { status: 429 }
//         );
//       }
      
//       // Generic error response
//       return NextResponse.json(
//         { 
//           message: `Failed to send message: ${error.message}`,
//           code: 'EMAIL_SEND_FAILED'
//         },
//         { status: 500 }
//       );
//     }

//     // Fallback for unknown errors
//     return NextResponse.json(
//       { 
//         message: 'An unexpected error occurred. Please try again later or contact me directly at pahaisaac@gmail.com.',
//         code: 'UNKNOWN_ERROR'
//       },
//       { status: 500 }
//     );
//   }
// }

// // Handle OPTIONS requests for CORS (preflight requests)
// export async function OPTIONS() {
//   return new NextResponse(null, {
//     status: 200,
//     headers: {
//       'Access-Control-Allow-Origin': '*',
//       'Access-Control-Allow-Methods': 'POST, OPTIONS',
//       'Access-Control-Allow-Headers': 'Content-Type, Authorization',
//       'Access-Control-Max-Age': '86400', // Cache preflight response for 24 hours
//     },
//   });
// }

// // Handle GET requests with helpful information
// export async function GET() {
//   return NextResponse.json(
//     {
//       message: 'Isaac Paha Contact API',
//       description: 'This endpoint handles contact form submissions for Isaac Paha\'s website.',
//       methods: ['POST'],
//       author: 'Isaac Paha - Computing & IT Graduate & Tech Entrepreneur',
//       companies: [
//         'iPaha Ltd (UK) - ipahait.com',
//         'iPahaStores Ltd (UK) - ipahastore.com', 
//         'Okpah Ltd (Ghana) - okpah.com'
//       ],
//       contact: {
//         email: 'pahaisaac@gmail.com',
//         phone: '+44 7402 497091',
//         website: 'https://isaacpaha.com'
//       },
//       timestamp: new Date().toISOString()
//     },
//     { 
//       status: 200,
//       headers: {
//         'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
//       }
//     }
//   );
// }