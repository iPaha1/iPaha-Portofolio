import React from "react";
import { motion } from "framer-motion";
import { BookOpen, Clock, Filter, Tag } from "lucide-react";

// Stats component
const BlogStats = () => {
  const stats = [
    { label: "Articles Published", value: "2+", icon: BookOpen },
    { label: "Reading Time", value: "30+ min", icon: Clock },
    { label: "Categories", value: "2+", icon: Filter },
    { label: "Tags", value: "10+", icon: Tag }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className="text-center"
        >
          <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-200 hover:border-amber-300 transition-colors">
            <stat.icon className="w-8 h-8 text-amber-500 mx-auto mb-3" />
            <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
            <div className="text-sm text-gray-600">{stat.label}</div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default BlogStats;