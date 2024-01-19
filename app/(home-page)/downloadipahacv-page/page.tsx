"use client";

import { Button } from "@/components/ui/button";
import { ArrowDownCircle, CircleDashed } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { useConfettiStore } from "@/hooks/use-confetti-store";
import { useState } from "react";
import DownloadCVTypeWriting from "@/components/typewriting/downlaodcv-typewriting";


const DownloadPage = () => {

    const [isButtonClicked, setIsButtonClicked] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    
    const confetti = useConfettiStore();

    const router = useRouter();

    const handleDownloadClick = () => {
        setIsButtonClicked(true);
        setIsLoading(true);
        // Redirect to download page after a short delay
            setTimeout(() => {
                const link = document.createElement('a');
                // link.href = "https://drive.google.com/uc?export=download&id=1rukz4VuqMOI_UP1yrs3_1ffb1nbIbiqi";
                link.href = "https://drive.google.com/file/d/1RVaTZYeH2imZjqTO3SnsLWjyk4-9kRMv/view?usp=sharing";
                document.body.appendChild(link); // Direct download link
                link.download = "IpaHaCV.pdf"; // Setting the download attribute
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast.success("CV Downloaded Successfully");;
            }, 3000); // 2 seconds delay
        

        // Redirect to thank-you page after a short delay
        setTimeout(() => {
            router.push("/thank-you");
        }, 4000); // 2 seconds delay

        // Redirect to thank-you page after a short delay
        setTimeout(() => {
            confetti.onOpen();
        }, 10000); // 10 seconds delay
    }

    return ( 
        <div className="flex flex-col h-full items-center justify-center ">

            {/* <div className="mb-30">
                <DownloadCVTypeWriting />
            </div> */}
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
            <Button 
                variant="ghost" className="hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black" onClick={handleDownloadClick}
                type="submit" disabled={isLoading}>
                    {isButtonClicked ? (
                        <>
                        <CircleDashed className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24" />
                        Downloading CV ...
                        </>
                    ) : (
                        "Download CV"
                    )}
            </Button>
                
            </div>
            </motion.div>
            
            
        </div>
     );
}
 
export default DownloadPage;
