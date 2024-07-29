"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

interface ErrorProps {
  message: string;
  statusCode?: number;
}

const ErrorComponent: React.FC<ErrorProps> = ({ message, statusCode }) => {
  return (
    <motion.div 
      className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-black text-black dark:text-white"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
      <h1 className="text-4xl font-bold mb-2">Oops! Something went wrong</h1>
      {statusCode && (
        <p className="text-xl mb-4">Error {statusCode}</p>
      )}
      <p className="text-lg text-center max-w-md mb-8">{message}</p>
      <motion.button
        className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-md font-semibold"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => window.location.reload()}
      >
        Try Again
      </motion.button>
    </motion.div>
  );
};

export default ErrorComponent;