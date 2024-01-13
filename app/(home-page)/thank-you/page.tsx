"use client";

import TextSpan from "@/components/text-span";
import { useConfettiStore } from "@/hooks/use-confetti-store";
import { motion } from "framer-motion";


const ThankYouPage = () => {

    const helloConfetti = "Hello Confetti!"

    const confetti = useConfettiStore();

    const sentence = "Thank You for Your Interest".split("");

    const lineOne = "I am very enthusiastic about the opportunity to work with your team and look forward".split("");

    const lineTwo = "to the possibility of discussing my application with you in more detail during an interview.".split("");

    const lineThree = "Again, thank you for your consideration. I hope to bring my skills and passion to your".split("");

    const lineFour = "organization and contribute to your ongoing success.".split("");

    return ( 
        <div className="flex flex-col h-full items-center justify-center ">
     
            <motion.div 
                whileHover={{ scale: 1.1 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 10 }}
                >
                    <div className="flex flex-row text-5xl font-bold ">
            {sentence.map((letter, index) => {
              return (<TextSpan key={index} >{letter === " " ? "\u00A0" : letter}</TextSpan>
              );
            })}
          </div>
          
            </motion.div>

            <motion.div 
                whileHover={{ scale: 1.1 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 20 }}
                >
                    <div className="flex flex-row text-lg mt-10">
            {lineOne.map((letter, index) => {
                return (<TextSpan key={index} >{letter === " " ? "\u00A0" : letter}</TextSpan>
                );
            })
            }
          </div>

            </motion.div>

            <motion.div 
                whileHover={{ scale: 1.1 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 30 }}
                >
                    <div className="flex flex-row text-lg">
            {lineTwo.map((letter, index) => {
                return (<TextSpan key={index} >{letter === " " ? "\u00A0" : letter}</TextSpan>
                );
            })
            }
          </div>

            </motion.div>

            <motion.div 
                whileHover={{ scale: 1.1 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 40 }}
                >
                    <div className="flex flex-row text-lg">
            {lineThree.map((letter, index) => {
                return (<TextSpan key={index} >{letter === " " ? "\u00A0" : letter}</TextSpan>
                );
            })
            }
          </div>

            </motion.div>

            <motion.div 
                whileHover={{ scale: 1.1 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 50 }}
                >
                    <div className="flex flex-row text-lg">
            {lineFour.map((letter, index) => {
                return (<TextSpan key={index} >{letter === " " ? "\u00A0" : letter}</TextSpan>
                );
            })
            }
          </div>

            </motion.div>
          
          <div>
          <h1 className="md:hidden text-5xl font-bold p-4">Thank You for Your Interest</h1>
          <p className="md:hidden mt-5 p-4">
                I am very enthusiastic about the opportunity to work with your team and look forward to the possibility 
                of discussing my application with you in more detail during an interview.
                Again, thank you for your consideration. I hope to bring my skills and 
                passion to your organization and contribute to your ongoing success.
            </p>
            
        </div>
        </div>
     );
}
 
export default ThankYouPage;