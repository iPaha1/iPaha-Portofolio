import { MessageCircle } from "lucide-react";
import { Button } from "../ui/button";

// Quick Chat Button (alternative for immediate contact)
type ButtonSize = "sm" | "default" | "lg" | "icon" | null | undefined;

interface WhatsAppQuickChatButtonProps {
  phoneNumber?: string;
  className?: string;
  size?: ButtonSize;
  showText?: boolean;
}

const WhatsAppQuickChatButton = ({ 
  phoneNumber = "+447402497091",
  className = "",
  size = "sm",
  showText = true
}: WhatsAppQuickChatButtonProps) => {
  const handleQuickChat = () => {
    const formattedPhone = phoneNumber.replace(/\+/g, '').replace(/\s/g, '');
    const message = encodeURIComponent("Hi Isaac! I have a quick question about your services. Are you available to chat?");
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${message}`;
    
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Button 
      onClick={handleQuickChat}
      variant="outline" 
      size={size}
      className={`${className} border-green-300 text-green-700 hover:bg-green-50 transition-all duration-300`}
      title="Quick chat via WhatsApp"
    >
      <MessageCircle className="w-4 h-4 mr-2" />
      {showText && "Quick Chat"}
    </Button>
  );
};

export default WhatsAppQuickChatButton;