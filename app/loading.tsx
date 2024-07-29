"use client";

import React from 'react';
import { motion } from 'framer-motion';

const LoadingComponent = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white dark:bg-black">
      <motion.div
        className="flex space-x-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className="w-4 h-4 bg-black dark:bg-white rounded-full"
            animate={{
              y: ['0%', '-50%', '0%'],
              scale: [1, 0.8, 1],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'easeInOut',
              delay: index * 0.15,
            }}
          />
        ))}
      </motion.div>
    </div>
  );
};

export default LoadingComponent;