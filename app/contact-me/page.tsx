"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { set, useForm } from "react-hook-form";
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
import { ArrowDownCircle, Circle, CircleDashed, Send, SendIcon } from "lucide-react";
import DownloadCV from "@/components/download-cv";
import TextSpan from "@/components/text-span";
import { toast } from "react-toastify";
import axios from "axios";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";


const profileFormSchema = z.object({
  name: z
    .string()
    .min(2, {
      message: "Name must be at least 3 characters.",
    })
    .max(30, {
      message: "Name must not be longer than 30 characters.",
    }),
  email: z
    .string({
      required_error: "Please select an email to display.",
    })
    .email(),
  message: z.string().max(160).min(4),
  
})

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const ContactMePage = () => {

  const router = useRouter();

  const [isButtonClicked, setIsButtonClicked] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const sentence = "Get in touch".split("");

  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      message: "",
    },
  })

  
  // function onSubmit(data: ProfileFormValues) {
  //   console.log("Form Data", {JSON: JSON.stringify(data, null, 4)});
  // }

  async function onSubmit(data: ProfileFormValues) {
    try {
      setIsButtonClicked(true);
      setIsLoading(true);
      const response = await fetch('/api/sendEmail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
  
      if (response.ok) {
        console.log('Email sent successfully');
        toast.success("Email sent successfully");

        // Handle success, maybe clear the form or show a success message
      } else {
        console.log('Failed to send email');
        // Handle error
      }
    } catch (error) {
      console.error('Error sending email', error);
      // Handle network error
    } finally {
      // Redirect to thank-you page after a short delay
      setTimeout(() => {
        setIsLoading(false);
        setIsButtonClicked(false);
        form.reset();
    }, 6000); // 2 seconds delay
      
    }
  }

  async function onSubmitw(data: ProfileFormValues) {
    console.log("Form Data", {JSON: JSON.stringify(data, null, 4)})
    try {
      setIsButtonClicked(true);
      setIsLoading(true);
      const response = await axios.post('/api/sendEmail', data);
      console.log(response);
  
      console.log('Email sent successfully');
      
      toast.success("Email sent successfully");
      form.reset();
      // Handle success, maybe clear the form or show a success message
    } catch (error) {
      console.error('Error sending email', error);
      // Handle error
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center justify-center">
        
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
                    <Link href="https://www.linkedin.com/in/isaac-paha-578911a9/"><LinkedInLogoIcon className="w-5 h-5 transition-transform transform hover:scale-110" /></Link>
                    <Link href=""><InstagramLogoIcon className="w-5 h-5 transition-transform transform hover:scale-110" /></Link>
                    <Link href=""><TwitterLogoIcon className="w-5 h-5 transition-transform transform hover:scale-110" /></Link>
                    <Link href="https://github.com/iPaha1"><GitHubLogoIcon className="w-5 h-5 transition-transform transform hover:scale-110" /></Link>
            </p>

            </motion.div>
            
        </div>
        <div className="p-6 mt-40">
        <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Your name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <Input placeholder="youremail@email.com" {...field} />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter your message here"
                  {...field}
                />
              </FormControl>
              
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" disabled={isLoading}>
          {isButtonClicked ? (
            <>
              <CircleDashed className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24" />
              Sending...
            </>
          ) : (
            "Send"
          )}
        </Button>
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
