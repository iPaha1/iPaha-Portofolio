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
  image: z
    .string()
    .min(2, {
      message: "Please upload image.",
    }),
   
  title: z
    .string({
      required_error: "Please enter title.",
    }),
    projectDescription: z.string().max(160).min(4),
  
})

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const AddProjectForm = () => {

  const router = useRouter();

  const [isButtonClicked, setIsButtonClicked] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const sentence = "Get in touch".split("");

  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    mode: "onChange",
    defaultValues: {
      image: "",
      title: "",
      projectDescription: "",
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center justify-center p-6">
        
         <div className="p-6 mt-40">
        <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="image"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image</FormLabel>
              <FormControl>
                <Input placeholder="Upload Image" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" disabled={isLoading}>
          {isButtonClicked ? (
            <>
              <CircleDashed className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24" />
              Uploading image ...
            </>
          ) : (
            "Upload"
          )}
        </Button>
      </form>
    </Form>
      
      </div>
        <div className="p-6 mt-40">
        <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Project title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="projectDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter the project description here"
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
              Adding Project ...
            </>
          ) : (
            "Add Project"
          )}
        </Button>
      </form>
    </Form>
      
      </div>
      
    </div>
  );
};

export default AddProjectForm;
