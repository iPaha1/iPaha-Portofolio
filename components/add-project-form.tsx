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
import { UploadButton } from "@/utils/uploadthing";
import Project from "@/lib/database/models/project-model";


const projectFormSchema = z.object({
  image: z.string().optional(),
  title: z.string({ required_error: "Project title is required" }),
  projectDescription: z.string().max(160).min(4),
  
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

const AddProjectForm = () => {

  const router = useRouter();

  const [isButtonClicked, setIsButtonClicked] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const sentence = "Get in touch".split("");

  
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    mode: "onChange",
    defaultValues: {
      image: "",
      title: "",
      projectDescription: "",
    },
  })

  
  // function onSubmit(data: ProjectFormValues) {
  //   console.log("Form Data", {JSON: JSON.stringify(data, null, 4)});
  // }

  async function onSubmit(data: ProjectFormValues) {
    try {
      setIsButtonClicked(true);
      setIsLoading(true);
      // Send the data to your backend endpoint (adjust the URL as needed)
      const response = await axios.post('/api/mongoose', data);

      if (response.status === 200) {
        console.log('Project Entered into DB Successfully');
        toast.success("Project Entered into DB Successfully");
        // Maybe navigate to a different page or reset the form
      } else {
        console.log('Failed to add project to DB');
        // Handle error
      }
    } catch (error) {
      console.error('Error adding project to db', error);
      // Handle network error
    } finally {
      setIsLoading(false);
      setIsButtonClicked(false);
      form.reset();
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
              <UploadButton
                className="mt-4 ut-button:bg-red-500 ut-button:ut-readying:bg-red-500/50"
                endpoint="imageUploader"
                onClientUploadComplete={(res) => {
                  // Do something with the response
                  console.log("Files: ", res);
                  alert("Upload Completed");
                  form.setValue("image", res[0].url);
                }}
                onUploadError={(error: Error) => {
                  // Do something with the error.
                  alert(`ERROR! ${error.message}`);
                }}
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
