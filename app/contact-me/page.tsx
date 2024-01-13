"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { motion } from "framer-motion";
import { GitHubLogoIcon, InstagramLogoIcon, LinkedInLogoIcon, TwitterLogoIcon } from "@radix-ui/react-icons";
import { ArrowDownCircle, Send, SendIcon } from "lucide-react";
import DownloadCV from "@/components/download-cv";
import TextSpan from "@/components/text-span";
import { useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { clear } from "console";

const formSchema = z.object({
  username: z.string().min(2, {
    message: "Required.",
  }),
});

const onSubmit = async (formData: Record<string, any>) => {
  try {
      const response = await fetch('/api/send-email', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({
              name: formData.username,
              email: formData.email,
              message: formData.message, // Assuming you have a message field in your form
          }),
      });

      if (response.ok) {
          toast.success("Email sent successfully!");
          // Clear the form here
      } else {
          throw new Error('Failed to send email');
      }
  } catch (error) {
      toast.error("An error occurred while sending the email.");
  }
};

const ContactMePage = () => {

  const sentence = "Get in touch".split("");

  const form = useForm({
    resolver: zodResolver(formSchema),
  });

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
            router.push(`/downloadipahacv-page`)
            toast.success("Email sent Successfully")
            // Add Clear the form entries
        } else {
            toast.error("Please enter a valid name and email address and a message.");
        }
    }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full items-center justify-center">
        
        <div className="p-6">
            
            <motion.div 
                whileHover={{ scale: 1.1 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 10 }}
            >
                {/* <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500 dark:bg-white"></span>
                </span> */}
            <h1 className="md:hidden text-5xl sm:text-5xl md:text-6xl font-bold">
              Get in touch
            </h1>

            <div className="flex flex-row text-6xl font-bold ">
                {sentence.map((letter, index) => {
                return (<TextSpan key={index} >{letter === " " ? "\u00A0" : letter}</TextSpan>
                );
                })}
            </div>
            <div className="mt-4 flex">
                <p>
                    <SendIcon className="w-4 h-4 transition-transform transform hover:scale-110 animate-pulse" />
                </p>
                <a href="mailto:contact@ipahait.com" className="hover:underline ml-4">
                  contact@ipahait.com
                </a>
            </div>

            <p className="flex items-center gap-2 ml-4 justify-start mt-10" >
                <a href=""><LinkedInLogoIcon className="w-5 h-5 transition-transform transform hover:scale-110 animate-pulse" /></a>
                <a href=""><InstagramLogoIcon className="w-5 h-5 transition-transform transform hover:scale-110 animate-pulse" /></a>
                <a href=""><TwitterLogoIcon className="w-5 h-5 transition-transform transform hover:scale-110 animate-pulse" /></a>
                <a href=""><GitHubLogoIcon className="w-5 h-5 transition-transform transform hover:scale-110 animate-pulse" /></a>
            </p>

            </motion.div>
            
        </div>
        <div className="p-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <Input type="text" placeholder="Your name"/>
                <FormMessage />
                <FormControl>
                  <Input type="email" placeholder="youremail@email.com" {...field} />
                </FormControl>
                <FormMessage />
                <Textarea placeholder="Type your message here." />
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" onClick={onSubmit}>Submit</Button>
        </form>
      </Form>
      <div className="flex flex-row text-lg mt-40 justify-center">
          <ArrowDownCircle className="animate-bounce size-20" />
        </div>
        <div className="flex flex-row justify-center">
          <DownloadCV />
        </div>
      </div>
      
    </div>
  );
};

export default ContactMePage;
