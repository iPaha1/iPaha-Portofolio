"use client";

import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"


import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { connect } from "http2";
import { set } from "lodash";
import { CircleDashed } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { toast } from "react-toastify";

const DownloadCV = () => {

    const [isButtonClicked, setIsButtonClicked] = useState(false);

    const [isLoading, setIsLoading] = useState(false);

    const router = useRouter();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setName(e.target.value);
    }

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
    }

    const validateAndDownload = () => {
        if (name.trim() !== "" && email.trim() !== "" && email.includes("@") && email.includes(".")) {
            setIsButtonClicked(true);
            setIsLoading(true);
            // Redirect to download page after a short delay
            setTimeout(() => {
            router.push(`/downloadipahacv-page`);
            }, 4000); // 4 seconds delay
            // router.push(`/downloadipahacv-page`)
        } else {
            toast.error("Please enter a valid name and email address.");
        }
    }

    return ( 
        <div>
            <Dialog>
                <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    className="dark:hidden hover:bg-black hover:text-white text-black font-bold py-2 px-4 ml-4 transition-transform transform hover:scale-110"
                >
                    Download CV
                </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                    <DialogTitle>Get My CV</DialogTitle>
                    <DialogDescription>
                        Enter your name and email address and press send to get my CV.
                    </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                        Name
                        </Label>
                        <Input type="text" placeholder="Your name" className="col-span-3" onChange={handleNameChange}/>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="username" className="text-right">
                            Email
                        </Label>
                        <Input type="emial" placeholder="youremail@email.com" className="col-span-3" onChange={handleEmailChange}/>
                    </div>
                    </div>
                    <DialogFooter>
                    <Button type="submit" disabled={isLoading} onClick={validateAndDownload}>
                        {isButtonClicked ? (
                            <>
                            <CircleDashed className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24" />
                            Sending ...
                            </>
                        ) : (
                            "Send"
                        )}
                    </Button>
                    </DialogFooter>
                </DialogContent>
                </Dialog>


                <Dialog>
                <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    className="hidden dark:block dark:hover:bg-white dark:hover:text-black dark:text-white font-bold py-2 px-4 ml-4 transition-transform transform hover:scale-110"
                >
                        Download CV
                </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                    <DialogTitle>Get My CV</DialogTitle>
                    <DialogDescription>
                        Enter your name and email address and press send to get my CV.
                    </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                        Name
                        </Label>
                        <Input type="text" placeholder="Your name" className="col-span-3" onChange={handleNameChange}/>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="username" className="text-right">
                            Email
                        </Label>
                        <Input type="emial" placeholder="youremail@email.com" className="col-span-3" onChange={handleEmailChange}/>
                    </div>
                    </div>
                    <DialogFooter>
                    <Button type="submit" disabled={isLoading} onClick={validateAndDownload}>
                        {isButtonClicked ? (
                            <>
                            <CircleDashed className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24" />
                            Sending ...
                            </>
                        ) : (
                            "Send"
                        )}
                    </Button>
                    </DialogFooter>
                </DialogContent>
                </Dialog>
            

            
        </div>
     );
}
 
export default DownloadCV;