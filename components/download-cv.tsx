"use client";

import { act } from "@react-three/fiber";
import { Button } from "./ui/button";
import { CircleDashed } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";
import { toast as sonnerToast } from "sonner";


const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: '2-digit',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    };
    return new Intl.DateTimeFormat('en-US', options).format(date);
  };

  const currentDate = new Date();
  const formattedDate = `\n${formatDate(currentDate)}`;


const DownloadCV = () => {
    const [isLoading, setIsLoading] = useState(false);


    const handleDownload = () => {
        setIsLoading(true);
        
        const cvUrl = '/files/cv.pdf';
        const fileName = 'Isaac_Paha_CV.pdf'; 

        try {
            const link = document.createElement('a');
            link.href = cvUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            sonnerToast(`CV download started! `, {
                description: formattedDate,
                action: {
                    label: "Dismiss",
                    onClick: () => {
                        console.log("Toast dismissed");
                    },
                },
            });


        } catch (error) {
            console.error("Download failed:", error);
            sonnerToast(`Failed to start download. Please try again.`, {
                description: formattedDate,
                action: {
                    label: "Dismiss",
                    onClick: () => {
                        console.log("Toast dismissed");
                    },
                },
            });
            // toast.error("Failed to start download. Please try again.");
        } finally {
            // Reset loading state after a short delay
            setTimeout(() => {
                setIsLoading(false);
            }, 1000);
        }
    };

    return ( 
        <Button
            onClick={handleDownload}
            disabled={isLoading}
            className="font-bold py-2 px-4 transition-transform transform hover:scale-110
                       bg-black text-white dark:bg-white dark:text-black 
                       hover:bg-gray-800 dark:hover:bg-gray-200"
        >
            {isLoading ? (
                <>
                    <CircleDashed className="animate-spin h-5 w-5 mr-3" />
                    Downloading...
                </>
            ) : (
                "Download CV"
            )}
        </Button>
    );
}

export default DownloadCV;


// "use client";

// import { Button } from "./ui/button";
// import { CircleDashed } from "lucide-react";
// import { useRouter } from "next/navigation";
// import { useState } from "react";
// import { toast } from "react-toastify";

// const DownloadCV = () => {
//     const [isLoading, setIsLoading] = useState(false);
//     const router = useRouter();

//     const handleDownload = () => {
//         setIsLoading(true);
        
//         // Assuming your CV is named 'Isaac_Paha_CV.pdf' and is in the public folder
//         const cvUrl = '/cv.pdf';

//         // Create a link element
//         const link = document.createElement('a');
//         link.href = cvUrl;
//         link.download = 'cv.pdf'; // This will be the name of the downloaded file
//         document.body.appendChild(link);
        
//         // Trigger the download
//         link.click();
        
//         // Clean up
//         document.body.removeChild(link);
        
//         // Show success message
//         toast.success("CV download started!");
        
//         // Reset loading state after a short delay
//         setTimeout(() => {
//             setIsLoading(false);
//         }, 1000);
//     };

//     return ( 
//         <Button
//             onClick={handleDownload}
//             disabled={isLoading}
//             className="font-bold py-2 px-4 transition-transform transform hover:scale-110
//                        bg-black text-white dark:bg-white dark:text-black 
//                        hover:bg-gray-800 dark:hover:bg-gray-200"
//         >
//             {isLoading ? (
//                 <>
//                     <CircleDashed className="animate-spin h-5 w-5 mr-3" />
//                     Downloading...
//                 </>
//             ) : (
//                 "Download CV"
//             )}
//         </Button>
//     );
// }
 
// export default DownloadCV;