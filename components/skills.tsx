"use client"

import React from "react";
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"


const SkillsPage = () => {
    return ( 
        <div>
          <div className="max-w-3xl space-y-4">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold">
              Skills
            </h1>
          <p>
            Skill in the IT industry is a broad term that refers to a person&apos;s knowledge, abilities, and expertise in a particular area.
            But I believe that the most important skill is the ability to learn and adapt to new technologies. As an IT student with a strong 
            passion for technology and a keen interest in computer science, I am eager to apply my knowledge and skills to real-world challenges and make a positive impact in the field. I am a quick learner and am always looking for opportunities to learn and grow, both in the classroom and through hands-on experience. I am a dedicated and hardworking individual with a strong work ethic and a commitment to excellence. I am confident that my skills and experience make me a strong candidate for any opportunity in the IT field.
            Below are some of the skills I have acquired over the years.
            I am always learning new skills and technologies to keep up with the ever-changing world of technology.
          </p>
          <div>
          <Tabs defaultValue="skills" className="w-[800px] sm:flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="skills">Skills</TabsTrigger>
              <TabsTrigger value="experience">Experience</TabsTrigger>
              <TabsTrigger value="education">Education & Certifications</TabsTrigger>
            </TabsList>
            <TabsContent value="skills">
              <Card>
                <CardHeader>
                  <CardTitle>Software Management</CardTitle>
                  <CardDescription>
                      Make changes to your account here. Click save when you&apos;re done.
                  </CardDescription>
                  <CardTitle>System Administration</CardTitle>
                  <CardDescription>
                      Make changes to your account here. Click save when you&apos;re done.
                  </CardDescription>
                  <CardTitle>Troubleshooting</CardTitle>
                  <CardDescription>
                      Make changes to your account here. Click save when you&apos;re done.
                  </CardDescription>
                  <CardTitle>Customer Service</CardTitle>
                  <CardDescription>
                      Make changes to your account here. Click save when you&apos;re done.
                  </CardDescription>
                  <CardTitle>And More ...</CardTitle>
                  <CardDescription>
                      Make changes to your account here. Click save when you&apos;re done.
                  </CardDescription>
                </CardHeader>
                
                <CardFooter>
                  <Button>Go to Skills Page</Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="experience">
              <Card>
                <CardHeader>
                  <CardTitle>The Open University</CardTitle>
                  <CardDescription>
                      Make changes to your account here. Click save when you&apos;re done.
                  </CardDescription>
                  <CardTitle>System Administration</CardTitle>
                  <CardDescription>
                      Make changes to your account here. Click save when you&apos;re done.
                  </CardDescription>
                  <CardTitle>Troubleshooting</CardTitle>
                  <CardDescription>
                      Make changes to your account here. Click save when you&apos;re done.
                  </CardDescription>
                  <CardTitle>Customer Service</CardTitle>
                  <CardDescription>
                      Make changes to your account here. Click save when you&apos;re done.
                  </CardDescription>
                  <CardTitle>And More ...</CardTitle>
                  <CardDescription>
                      Make changes to your account here. Click save when you&apos;re done.
                  </CardDescription>
                </CardHeader>
                
                <CardFooter>
                  <Button>Go to Experience Page</Button>
                </CardFooter>
              </Card>
            </TabsContent>


            <TabsContent value="education">
              <Card>
                <CardHeader>
                  <CardTitle> Degree </CardTitle>
                  <CardDescription>
                      Make changes to your account here. Click save when you&apos;re done.
                  </CardDescription>
                  <CardTitle>System Administration</CardTitle>
                  <CardDescription>
                      Make changes to your account here. Click save when you&apos;re done.
                  </CardDescription>
                  <CardTitle>Troubleshooting</CardTitle>
                  <CardDescription>
                      Make changes to your account here. Click save when you&apos;re done.
                  </CardDescription>
                  <CardTitle>Customer Service</CardTitle>
                  <CardDescription>
                      Make changes to your account here. Click save when you&apos;re done.
                  </CardDescription>
                  <CardTitle>And More ...</CardTitle>
                  <CardDescription>
                      Make changes to your account here. Click save when you&apos;re done.
                  </CardDescription>
                </CardHeader>
                
                <CardFooter>
                  <Button>Go to Education & Certification Page</Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>

          </div>
        </div>
        </div>
     );
}
 
export default SkillsPage;