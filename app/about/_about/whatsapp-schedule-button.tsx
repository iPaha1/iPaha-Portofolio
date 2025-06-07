import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';

// WhatsApp Schedule Call Component
type ButtonVariant = "default" | "outline" | "link" | "destructive" | "secondary" | "ghost";
type ButtonSize = "default" | "sm" | "lg" | "icon";

interface WhatsAppScheduleButtonProps {
  phoneNumber?: string;
  message?: string;
  className?: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
}

const WhatsAppScheduleButton: React.FC<WhatsAppScheduleButtonProps> = ({ 
  phoneNumber = "+447402497091", // Your UK phone number
  message = "Hi Isaac! I'd like to schedule a call to discuss a potential project. When would be a good time to chat?",
  className = "",
  size = "default",
  variant = "outline"
}) => {
  const handleWhatsAppClick = () => {
    // Format phone number for WhatsApp (remove + and spaces)
    const formattedPhone = phoneNumber.replace(/\+/g, '').replace(/\s/g, '');
    
    // Encode the message for URL
    const encodedMessage = encodeURIComponent(message);
    
    // Create WhatsApp URL
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
    
    // Open WhatsApp in new window/tab
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Button 
      onClick={handleWhatsAppClick}
      variant={variant} 
      size={size}
      className={`${className} border-amber-300 text-amber-700 hover:bg-amber-50 transition-all duration-300`}
    >
      <MessageCircle className="w-4 h-4 mr-2" />
      Schedule Call
    </Button>
  );
};

export default WhatsAppScheduleButton;