type WhatsAppContext = 'hero' | 'about' | 'contact' | 'project' | 'blog' | 'footer' | 'general';

// Extend the Window interface to include the optional gtag property
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export const whatsappConfig = {
  phoneNumber: "+447432202166", // Your UK phone number
  
  // Different messages for different contexts
  messages: {
    hero: "Hi Isaac! I came across your portfolio and I'm impressed with your work. I'd love to schedule a call to discuss a potential project collaboration.",
    about: "Hello Isaac! After reading about your journey and the three companies you've founded, I'm interested in discussing how we might work together. When would be a good time for a call?",
    contact: "Hi Isaac! I'd like to schedule a consultation call to discuss my project requirements. Are you available for a brief chat this week?",
    project: "Hello! I saw your impressive projects like oKadwuma and okDdwa. I have a similar project idea and would love to discuss it with you. Can we schedule a call?",
    blog: "Hi Isaac! I just read your blog post and found it very insightful. I'd love to schedule a call to discuss how you might help with my project.",
    footer: "Hello Isaac! I'm interested in your development services. Could we schedule a call to discuss my project requirements?",
    general: "Hi Isaac! I'd like to schedule a call to discuss a potential project. When would be a good time to chat?"
  }
};

export const openWhatsApp = (
  context: WhatsAppContext = 'general',
  customMessage: string | null = null
) => {
  // Format phone number for WhatsApp (remove + and spaces)
  const formattedPhone = whatsappConfig.phoneNumber.replace(/\+/g, '').replace(/\s/g, '');
  
  // Get the appropriate message
  const message = customMessage || whatsappConfig.messages[context] || whatsappConfig.messages.general;
  
  // Encode the message for URL
  const encodedMessage = encodeURIComponent(message);
  
  // Create WhatsApp URL
  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
  
  // Open WhatsApp in new window/tab
  window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  
  // Optional: Track the click for analytics
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'whatsapp_click', {
      event_category: 'engagement',
      event_label: context,
      value: 1
    });
  }
};