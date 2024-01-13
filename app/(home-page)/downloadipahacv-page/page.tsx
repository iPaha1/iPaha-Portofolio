"use client";

import { Button } from "@/components/ui/button";
import { ArrowDownCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { useConfettiStore } from "@/hooks/use-confetti-store";


const DownloadPage = () => {
    
    const confetti = useConfettiStore();

    const router = useRouter();

    const handleDownloadClick = () => {
        const link = document.createElement('a');
        link.href = "https://drive.google.com/uc?export=download&id=1Dfg7S3OOeaXW9GCkYUvphKANA7ANhAj8"; // Direct download link
        link.download = "IpaHaCV.pdf"; // Setting the download attribute
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("CV downloaded Successfully");

        // Redirect to thank-you page after a short delay
        setTimeout(() => {
            router.push("/thank-you");
        }, 2000); // 2 seconds delay

        // Redirect to thank-you page after a short delay
        setTimeout(() => {
            confetti.onOpen();
        }, 10000); // 2 seconds delay
    }

    return ( 
        <div className="flex flex-col h-full items-center justify-center ">
            <motion.div 
                whileHover={{ scale: 1.1 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 60 }}
            >
            <div className="text-lg items-center">
                <ArrowDownCircle className="animate-bounce size-40" />
            </div>
            </motion.div>

            <motion.div 
                whileHover={{ scale: 1.1 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 10 }}
            >
                <div>
                <Button variant="ghost" className="hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black" onClick={handleDownloadClick}>
                    Download CV
                </Button>
            </div>
            </motion.div>
            
            
        </div>
     );
}
 
export default DownloadPage;
