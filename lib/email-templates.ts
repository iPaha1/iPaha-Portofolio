// lib/email-templates.ts

interface ContactEmailProps {
  name: string;
  email: string;
  phone: string;
  company: string;
  projectType: string;
  budget: string;
  timeline: string;
  message: string;
}

interface AutoReplyProps {
  name: string;
}

export const ContactEmailTemplate = ({
  name,
  email,
  phone,
  company,
  projectType,
  budget,
  timeline,
  message
}: ContactEmailProps): string => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Project Inquiry</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9fafb;
          }
          .container {
            background-color: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #f59e0b;
          }
          .header h1 {
            color: #1f2937;
            margin: 0;
            font-size: 24px;
          }
          .header p {
            color: #6b7280;
            margin: 5px 0 0 0;
            font-size: 14px;
          }
          .section {
            margin-bottom: 25px;
          }
          .section-title {
            color: #f59e0b;
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 1px solid #e5e7eb;
          }
          .info-row {
            display: flex;
            margin-bottom: 8px;
          }
          .info-label {
            font-weight: 600;
            color: #374151;
            width: 120px;
            flex-shrink: 0;
          }
          .info-value {
            color: #6b7280;
            flex: 1;
          }
          .message-box {
            background-color: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #f59e0b;
            margin-top: 10px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 12px;
          }
          .badge {
            display: inline-block;
            background-color: #f59e0b;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
          }
          .priority-section {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
          }
          .response-actions {
            background-color: #f0f9ff;
            border: 1px solid #0ea5e9;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
          }
          .quick-reply {
            display: inline-block;
            background-color: #0ea5e9;
            color: white;
            padding: 8px 16px;
            border-radius: 6px;
            text-decoration: none;
            margin-right: 10px;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚀 New Project Inquiry</h1>
            <p>You have received a new project inquiry through your website</p>
          </div>

          <!-- Priority Assessment -->
          ${budget && (budget.includes('50k-plus') || budget.includes('30k-50k')) ? `
          <div class="priority-section">
            <strong>🎯 HIGH PRIORITY INQUIRY</strong><br>
            This inquiry has a significant budget range (${budget}). Consider prioritizing this response.
          </div>
          ` : ''}

          <div class="section">
            <div class="section-title">👤 Contact Information</div>
            <div class="info-row">
              <span class="info-label">Name:</span>
              <span class="info-value"><strong>${name}</strong></span>
            </div>
            <div class="info-row">
              <span class="info-label">Email:</span>
              <span class="info-value"><a href="mailto:${email}" style="color: #f59e0b; text-decoration: none;">${email}</a></span>
            </div>
            ${phone ? `
            <div class="info-row">
              <span class="info-label">Phone:</span>
              <span class="info-value"><a href="tel:${phone}" style="color: #f59e0b; text-decoration: none;">${phone}</a></span>
            </div>
            ` : ''}
            ${company ? `
            <div class="info-row">
              <span class="info-label">Company:</span>
              <span class="info-value"><strong>${company}</strong></span>
            </div>
            ` : ''}
          </div>

          <div class="section">
            <div class="section-title">📋 Project Details</div>
            ${projectType ? `
            <div class="info-row">
              <span class="info-label">Project Type:</span>
              <span class="info-value"><span class="badge">${projectType}</span></span>
            </div>
            ` : ''}
            ${budget ? `
            <div class="info-row">
              <span class="info-label">Budget:</span>
              <span class="info-value"><strong>${budget}</strong></span>
            </div>
            ` : ''}
            ${timeline ? `
            <div class="info-row">
              <span class="info-label">Timeline:</span>
              <span class="info-value"><strong>${timeline}</strong></span>
            </div>
            ` : ''}
          </div>

          <div class="section">
            <div class="section-title">💬 Project Description</div>
            <div class="message-box">
              ${message.replace(/\n/g, '<br>')}
            </div>
          </div>

          <!-- Quick Response Actions -->
          <div class="response-actions">
            <strong>📧 Quick Response Actions:</strong><br><br>
            <a href="mailto:${email}?subject=Re: Project Inquiry - ${name}&body=Hi ${name},%0D%0A%0D%0AThank you for your project inquiry. I've reviewed your requirements and I'm excited to discuss this opportunity with you.%0D%0A%0D%0ABased on your needs for ${projectType || 'your project'}, I believe I can deliver an excellent solution.%0D%0A%0D%0AWhen would be a good time for a brief call to discuss your requirements in more detail?%0D%0A%0D%0ABest regards,%0D%0AIsaac Paha" class="quick-reply">
              📧 Quick Reply
            </a>
            <a href="https://calendly.com/isaacpaha" class="quick-reply" target="_blank">
              📅 Schedule Call
            </a>
          </div>

          <div class="footer">
            <p><strong>📍 Inquiry Source:</strong> isaacpaha.com contact form</p>
            <p><strong>📅 Received:</strong> ${new Date().toLocaleString('en-GB', { 
              timeZone: 'Europe/London',
              dateStyle: 'full',
              timeStyle: 'short'
            })}</p>
            <p><strong>💼 From:</strong> Isaac Paha - Computing & IT Graduate | Tech Entrepreneur</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

export const AutoReplyTemplate = ({ name }: AutoReplyProps): string => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Thank you for your inquiry</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9fafb;
          }
          .container {
            background-color: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #f59e0b, #d97706);
            border-radius: 12px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
            font-size: 24px;
          }
          h1 {
            color: #1f2937;
            margin: 0 0 10px 0;
            font-size: 24px;
          }
          .subtitle {
            color: #6b7280;
            margin: 0;
            font-size: 16px;
          }
          .content {
            margin: 30px 0;
          }
          .highlight-box {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .companies {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin: 20px 0;
          }
          .company {
            text-align: center;
            padding: 15px;
            background-color: #f9fafb;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
          }
          .company-flag {
            font-size: 20px;
            margin-bottom: 5px;
          }
          .company-name {
            font-weight: 600;
            color: #1f2937;
            font-size: 14px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
          }
          .contact-info {
            margin: 15px 0;
          }
          .contact-item {
            margin: 5px 0;
          }
          .credentials {
            background-color: #f0f9ff;
            border: 1px solid #0ea5e9;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            text-align: center;
          }
          .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
            gap: 10px;
            margin: 15px 0;
          }
          .stat {
            text-align: center;
            padding: 10px;
            background-color: #f9fafb;
            border-radius: 6px;
          }
          .stat-number {
            font-weight: bold;
            font-size: 18px;
            color: #f59e0b;
          }
          .stat-label {
            font-size: 12px;
            color: #6b7280;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">👨‍💻</div>
            <h1>Thank You, ${name}!</h1>
            <p class="subtitle">Your project inquiry has been received</p>
          </div>

          <div class="content">
            <p>Hello ${name},</p>
            
            <p>Thank you for reaching out about your project! I've received your inquiry and I'm excited to learn more about your vision.</p>
            
            <div class="highlight-box">
              <strong>⏱️ What happens next?</strong>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>I'll review your project details within <strong>24 hours</strong></li>
                <li>I'll prepare a detailed proposal with timeline and costs</li>
                <li>We can schedule a call to discuss your requirements</li>
                <li>I'll answer any technical questions you might have</li>
              </ul>
            </div>

            <div class="credentials">
              <strong>🎓 About Isaac Paha</strong><br>
              Computing & IT Graduate | Full-Stack Developer | Tech Entrepreneur<br><br>
              <div class="stats">
                <div class="stat">
                  <div class="stat-number">100K+</div>
                  <div class="stat-label">Users Served</div>
                </div>
                <div class="stat">
                  <div class="stat-number">3</div>
                  <div class="stat-label">Companies Founded</div>
                </div>
                <div class="stat">
                  <div class="stat-number">50+</div>
                  <div class="stat-label">Happy Clients</div>
                </div>
                <div class="stat">
                  <div class="stat-number">99.9%</div>
                  <div class="stat-label">Uptime</div>
                </div>
              </div>
            </div>

            <p>As a Computing & IT graduate and founder of three successful tech companies, I bring extensive experience in:</p>
            
            <div class="companies">
              <div class="company">
                <div class="company-flag">🇬🇧</div>
                <div class="company-name">iPaha Ltd</div>
                <div style="font-size: 12px; color: #6b7280;">IT Consultancy & Custom Software</div>
              </div>
              <div class="company">
                <div class="company-flag">🇬🇧</div>
                <div class="company-name">iPahaStores Ltd</div>
                <div style="font-size: 12px; color: #6b7280;">SaaS & E-commerce Solutions</div>
              </div>
              <div class="company">
                <div class="company-flag">🇬🇭</div>
                <div class="company-name">Okpah Ltd</div>
                <div style="font-size: 12px; color: #6b7280;">Digital Platforms & Innovation</div>
              </div>
            </div>

            <p><strong>🚀 Recent Achievements:</strong></p>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li><strong>oKadwuma.com:</strong> Job platform serving 10,000+ users in Ghana</li>
              <li><strong>okDdwa.com:</strong> E-commerce marketplace with 1,200+ vendors</li>
              <li><strong>Enterprise Solutions:</strong> Serving 150+ businesses across the UK</li>
            </ul>

            <p>If you have any urgent questions or need to provide additional information, feel free to contact me directly:</p>
            
            <div class="contact-info">
              <div class="contact-item">📧 <strong>Email:</strong> <a href="mailto:pahaisaac@gmail.com" style="color: #f59e0b; text-decoration: none;">pahaisaac@gmail.com</a></div>
              <div class="contact-item">📱 <strong>Phone:</strong> <a href="tel:+447402497091" style="color: #f59e0b; text-decoration: none;">+44 7402 497091</a></div>
              <div class="contact-item">🌐 <strong>Website:</strong> <a href="https://isaacpaha.com" style="color: #f59e0b; text-decoration: none;">isaacpaha.com</a></div>
              <div class="contact-item">💼 <strong>LinkedIn:</strong> <a href="https://www.linkedin.com/in/isaac-paha-578911a9/" style="color: #f59e0b; text-decoration: none;">Connect with me</a></div>
            </div>

            <p>Looking forward to working together and bringing your project to life!</p>
            
            <p>Best regards,<br>
            <strong>Isaac Paha</strong><br>
            <em>Full-Stack Developer & Tech Entrepreneur</em><br>
            <em>Computing & IT Graduate, Open University London</em></p>
          </div>

          <div class="footer">
            <p>This is an automated response to confirm receipt of your inquiry.</p>
            <p>🎓 Isaac Paha | Computing & IT Graduate | Founder of iPaha Ltd, iPahaStores Ltd & Okpah Ltd</p>
            <p>© ${new Date().getFullYear()} Isaac Paha. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

// Email template for urgent/high-priority inquiries
export const UrgentInquiryTemplate = ({
  name,
  email,
  phone,
  company,
  projectType,
  budget,
  timeline,
  message
}: ContactEmailProps): string => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>🚨 URGENT Project Inquiry</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #fef2f2;
          }
          .container {
            background-color: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            border: 2px solid #dc2626;
          }
          .urgent-header {
            background: linear-gradient(135deg, #dc2626, #ef4444);
            color: white;
            text-align: center;
            margin: -30px -30px 30px -30px;
            padding: 20px 30px;
            border-radius: 10px 10px 0 0;
          }
          .urgent-header h1 {
            margin: 0;
            font-size: 24px;
          }
          .section {
            margin-bottom: 25px;
          }
          .info-row {
            display: flex;
            margin-bottom: 8px;
          }
          .info-label {
            font-weight: 600;
            color: #374151;
            width: 120px;
            flex-shrink: 0;
          }
          .info-value {
            color: #6b7280;
            flex: 1;
          }
          .message-box {
            background-color: #fef3c7;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #f59e0b;
            margin-top: 10px;
          }
          .urgent-actions {
            background-color: #fee2e2;
            border: 2px solid #dc2626;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
          }
          .action-button {
            display: inline-block;
            background-color: #dc2626;
            color: white;
            padding: 12px 24px;
            border-radius: 6px;
            text-decoration: none;
            margin: 5px;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="urgent-header">
            <h1>🚨 URGENT Project Inquiry</h1>
            <p>High-priority inquiry requiring immediate attention</p>
          </div>

          <div class="urgent-actions">
            <strong>⚡ IMMEDIATE ACTION REQUIRED</strong><br>
            Timeline: ${timeline} | Budget: ${budget}<br><br>
            <a href="mailto:${email}" class="action-button">📧 Reply Now</a>
            <a href="tel:${phone || ''}" class="action-button">📞 Call Client</a>
          </div>

          <div class="section">
            <h3>👤 Contact Information</h3>
            <div class="info-row">
              <span class="info-label">Name:</span>
              <span class="info-value"><strong>${name}</strong></span>
            </div>
            <div class="info-row">
              <span class="info-label">Email:</span>
              <span class="info-value">${email}</span>
            </div>
            ${phone ? `
            <div class="info-row">
              <span class="info-label">Phone:</span>
              <span class="info-value">${phone}</span>
            </div>
            ` : ''}
            ${company ? `
            <div class="info-row">
              <span class="info-label">Company:</span>
              <span class="info-value">${company}</span>
            </div>
            ` : ''}
          </div>

          <div class="section">
            <h3>📋 Project Details</h3>
            <div class="info-row">
              <span class="info-label">Type:</span>
              <span class="info-value">${projectType}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Budget:</span>
              <span class="info-value"><strong>${budget}</strong></span>
            </div>
            <div class="info-row">
              <span class="info-label">Timeline:</span>
              <span class="info-value"><strong>${timeline}</strong></span>
            </div>
          </div>

          <div class="section">
            <h3>💬 Project Description</h3>
            <div class="message-box">
              ${message.replace(/\n/g, '<br>')}
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
};