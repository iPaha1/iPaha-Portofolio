"use client";


import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { ArrowDownCircle, CircleDashed } from "lucide-react";
import DownloadCV from "@/components/download-cv";
import TextSpan from "@/components/text-span";
import { useState } from "react";
import { toast as sonnerToast } from "sonner";

const profileFormSchema = z.object({
  name: z
    .string()
    .min(2, {
      message: "Name must be at least 2 characters.",
    })
    .max(30, {
      message: "Name must not be longer than 30 characters.",
    }),
  email: z
    .string({
      required_error: "Please enter an email address.",
    })
    .email(),
  message: z.string().min(4).max(500, {
    message: "Message must not be longer than 500 characters.",
  }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const ContactMePage = () => {
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
  });

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

      console.log("THIS IS THE DATA:", data);
      const result = await response.json();

      if (response.ok) {
        console.log('Email sent successfully', result);
        sonnerToast("Email sent successfully", {
          description: `${formattedDate}\nMessage ID: ${result.id}`,
          action: {
            label: 'Close',
            onClick: () => sonnerToast.dismiss(),
          }
        });
      } else {
        console.error('Failed to send email', result);
        sonnerToast("Failed to send email", {
          description: `${formattedDate}\nError: ${result.error}\nDetails: ${result.details}`,
          action: {
            label: 'Close',
            onClick: () => sonnerToast.dismiss(),
          }
        });
      }
    } catch (error) {
      console.error('Error sending email', error);
      sonnerToast("Error sending email", {
        description: `${formattedDate}\nError: ${(error as Error).message}`,
        action: {
          label: 'Close',
          onClick: () => sonnerToast.dismiss(),
        }
      });
    } finally {
      setTimeout(() => {
        setIsLoading(false);
        setIsButtonClicked(false);
        form.reset();
      }, 2000);
    }
  }

  return (
    <section id="contact" className="py-20 bg-white dark:bg-black">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-6">
            <motion.div 
              whileHover={{ scale: 1.1 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
            >
              <h1 className="md:hidden text-5xl sm:text-5xl md:text-6xl font-bold mt-20">
                Get in touch
              </h1>

              <div className="flex flex-row text-6xl font-bold">
                {sentence.map((letter, index) => (
                  <TextSpan key={index}>{letter === " " ? "\u00A0" : letter}</TextSpan>
                ))}
              </div>
              
              
            </motion.div>
          </div>
          
          <div className="p-6">
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
                      <FormControl>
                        <Input placeholder="youremail@email.com" {...field} />
                      </FormControl>
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
                
                <Button type="submit" disabled={isLoading} size='lg'>
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
          </div>
        </div>
        
        <div className="flex flex-col items-center mt-16">
          <ArrowDownCircle className="animate-bounce size-20 mb-4" />
          <DownloadCV />
        </div>
      </div>
    </section>
  );
};

export default ContactMePage;




// "use client";

// import { zodResolver } from "@hookform/resolvers/zod";
// import { useForm } from "react-hook-form";
// import * as z from "zod";
// import { Button } from "@/components/ui/button";
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from "@/components/ui/form";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import { motion } from "framer-motion";
// import { ArrowDownCircle, CircleDashed } from "lucide-react";
// import DownloadCV from "@/components/download-cv";
// import TextSpan from "@/components/text-span";
// import { useState } from "react";
// import { toast as sonnerToast } from "sonner";


// const profileFormSchema = z.object({
//   name: z
//     .string()
//     .min(2, {
//       message: "Name must be at least 2 characters.",
//     })
//     .max(30, {
//       message: "Name must not be longer than 30 characters.",
//     }),
//   email: z
//     .string({
//       required_error: "Please enter an email address.",
//     })
//     .email(),
//   message: z.string().min(4).max(500, {
//     message: "Message must not be longer than 500 characters.",
//   }),
// });

// type ProfileFormValues = z.infer<typeof profileFormSchema>;

// const ContactMePage = () => {
//   const [isButtonClicked, setIsButtonClicked] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);

//   const sentence = "Get in touch".split("");

//   const form = useForm<ProfileFormValues>({
//     resolver: zodResolver(profileFormSchema),
//     mode: "onChange",
//     defaultValues: {
//       name: "",
//       email: "",
//       message: "",
//     },
//   });

//   const formatDate = (date: Date) => {
//     const options: Intl.DateTimeFormatOptions = {
//       weekday: 'long',
//       year: 'numeric',
//       month: 'long',
//       day: '2-digit',
//       hour: 'numeric',
//       minute: 'numeric',
//       hour12: true,
//     };
//     return new Intl.DateTimeFormat('en-US', options).format(date);
//   };

//   const currentDate = new Date();
//   const formattedDate = `\n${formatDate(currentDate)}`;

//   // async function onSubmit(data: ProfileFormValues) {
//   //   try {
//   //     setIsButtonClicked(true);
//   //     setIsLoading(true);
//   //     const response = await fetch('/api/sendEmail', {
//   //       method: 'POST',
//   //       headers: {
//   //         'Content-Type': 'application/json',
//   //       },
//   //       body: JSON.stringify(data),
//   //     });
  
//   //     if (response.ok) {
//   //       console.log('Email sent successfully');
//   //       sonnerToast("Email sent successfully", {
//   //         description: formattedDate,
//   //         action: {
//   //           label: 'Close',
//   //             onClick: () => sonnerToast.dismiss(),
//   //         }
       
//   //         },
//   //       );
//   //     } else {
//   //       console.log('Failed to send email');
//   //       sonnerToast("Failed to send email", {
//   //         description: formattedDate,
//   //         action: {
//   //           label: 'Close',
//   //             onClick: () => sonnerToast.dismiss(),
//   //         }
//   //       });
//   //     }
//   //   } catch (error) {
//   //     console.error('Error sending email', error);
//   //     sonnerToast("Error sending email", {
//   //       description: formattedDate,
//   //       action: {
//   //         label: 'Close',
//   //           onClick: () => sonnerToast.dismiss(),
//   //       }
//   //     });
//   //   } finally {
//   //     setTimeout(() => {
//   //       setIsLoading(false);
//   //       setIsButtonClicked(false);
//   //       form.reset();
//   //     }, 2000);
//   //   }
//   // }

//   async function onSubmit(data: ProfileFormValues) {
//     try {
//       setIsButtonClicked(true);
//       setIsLoading(true);
//       const response = await fetch('/api/sendEmail', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(data),
//       });
//       console.log("THIS IS THE DATA:", data);
  
//       const result = await response.json();
  
//       if (response.ok) {
//         console.log('Email sent successfully', result);
//         sonnerToast("Email sent successfully", {
//           description: `${formattedDate}\nMessage ID: ${result.id}`,
//           action: {
//             label: 'Close',
//             onClick: () => sonnerToast.dismiss(),
//           }
//         });
//       } else {
//         console.error('Failed to send email', result);
//         sonnerToast("Failed to send email", {
//           description: `${formattedDate}\nError: ${result.error}\nDetails: ${result.details}`,
//           action: {
//             label: 'Close',
//             onClick: () => sonnerToast.dismiss(),
//           }
//         });
//       }
//     } catch (error) {
//       console.error('Error sending email', error);
//       sonnerToast("Error sending email", {
//         description: `${formattedDate}\nError: ${(error as Error).message}`,
//         action: {
//           label: 'Close',
//           onClick: () => sonnerToast.dismiss(),
//         }
//       });
//     } finally {
//       setTimeout(() => {
//         setIsLoading(false);
//         setIsButtonClicked(false);
//         form.reset();
//       }, 2000);
//     }
//   }

//   return (
//     <section id="contact" className="py-20 bg-white dark:bg-black">
//       <div className="container mx-auto px-4 max-w-4xl">
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//           <div className="p-6">
//             <motion.div 
//               whileHover={{ scale: 1.1 }}
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               transition={{ duration: 1 }}
//             >
//               <h1 className="md:hidden text-5xl sm:text-5xl md:text-6xl font-bold mt-20">
//                 Get in touch
//               </h1>

//               <div className="flex flex-row text-6xl font-bold">
//                 {sentence.map((letter, index) => (
//                   <TextSpan key={index}>{letter === " " ? "\u00A0" : letter}</TextSpan>
//                 ))}
//               </div>
              
              
//             </motion.div>
//           </div>
          
//           <div className="p-6">
//             <Form {...form}>
//               <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
//                 <FormField
//                   control={form.control}
//                   name="name"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Name</FormLabel>
//                       <FormControl>
//                         <Input placeholder="Your name" {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//                 <FormField
//                   control={form.control}
//                   name="email"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Email</FormLabel>
//                       <FormControl>
//                         <Input placeholder="youremail@email.com" {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//                 <FormField
//                   control={form.control}
//                   name="message"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Message</FormLabel>
//                       <FormControl>
//                         <Textarea
//                           placeholder="Enter your message here"
//                           {...field}
//                         />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
                
//                 <Button type="submit" disabled={isLoading} size='lg'>
//                   {isButtonClicked ? (
//                     <>
//                       <CircleDashed className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24" />
//                       Sending...
//                     </>
//                   ) : (
//                     "Send"
//                   )}
//                 </Button>
//               </form>
//             </Form>
//           </div>
//         </div>
        
//         <div className="flex flex-col items-center mt-16">
//           <ArrowDownCircle className="animate-bounce size-20 mb-4" />
//           <DownloadCV />
//         </div>
//       </div>
//     </section>
//   );
// };

// export default ContactMePage;
