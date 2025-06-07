import { MessageCircle } from "lucide-react";
import { Button } from "../ui/button";

// Enhanced version with multiple message options
type ButtonVariant = "default" | "outline" | "link" | "destructive" | "secondary" | "ghost";
type ButtonSize = "default" | "sm" | "lg" | "icon";

interface WhatsAppScheduleButtonAdvancedProps {
  phoneNumber?: string;
  className?: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
  context?: "hero" | "about" | "contact" | "project" | "general" | "blog" | "footer";
}

const WhatsAppScheduleButtonAdvanced = ({ 
  phoneNumber = "+447402497091",
  className = "",
  size = "default",
  variant = "outline",
  context = "general"
}: WhatsAppScheduleButtonAdvancedProps) => {
  
  // Different messages based on context
  const getContextMessage = (context: "hero" | "about" | "contact" | "project" | "general" | "blog" | "footer") => {
    const messages = {
      hero: "Hi Isaac! I came across your portfolio and I'm impressed with your work. I'd love to schedule a call to discuss a potential project collaboration.",
      about: "Hello Isaac! After reading about your journey and the three companies you've founded, I'm interested in discussing how we might work together. When would be a good time for a call?",
      contact: "Hi Isaac! I'd like to schedule a consultation call to discuss my project requirements. Are you available for a brief chat this week?",
      project: "Hello! I saw your impressive projects like oKadwuma and okDdwa. I have a similar project idea and would love to discuss it with you. Can we schedule a call?",
      general: "Hi Isaac! I'd like to schedule a call to discuss a potential project. When would be a good time to chat?",
      blog: "Hi Isaac! I just read your blog post and found it very insightful. I'd love to schedule a call to discuss how you might help with my project.",
      footer: "Hello Isaac! I'm interested in your development services. Could we schedule a call to discuss my project requirements?"
    };
    
    return messages[context] || messages.general;
  };

  const handleWhatsAppClick = () => {
    // Format phone number for WhatsApp (remove + and spaces)
    const formattedPhone = phoneNumber.replace(/\+/g, '').replace(/\s/g, '');
    
    // Get contextual message
    const message = getContextMessage(context);
    
    // Encode the message for URL
    const encodedMessage = encodeURIComponent(message);
    
    // Create WhatsApp URL
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
    
    // Open WhatsApp in new window/tab
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    
    // Optional: Track the click for analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'whatsapp_schedule_click', {
        event_category: 'engagement',
        event_label: context,
        value: 1
      });
    }
  };

  return (
    <Button 
      onClick={handleWhatsAppClick}
      variant={variant} 
      size={size}
      className={`${className} border-amber-300 text-amber-700 hover:bg-amber-50 transition-all duration-300 group`}
      title="Schedule a call via WhatsApp"
    >
      <MessageCircle className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
      Schedule Call
    </Button>
  );
};

export default WhatsAppScheduleButtonAdvanced;