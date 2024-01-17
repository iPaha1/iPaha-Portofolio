// import { Blog } from "@/types/blog";
import { Blog } from "@/components/types/blog";

const blogData: Blog[] = [
  {
    id: 1,
    title: "Best UI components for modern websites",
    paragraph:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras sit amet dictum neque, laoreet dolor.",
    image: "/images/blog/blog-01.jpg",
    author: {
      name: "Isaac Paha",
      image: "/images/blog/pic.jpg",
      designation: "Software Engineer",
    },
    tags: ["creative"],
    publishDate: "2023",
  },
  {
    id: 2,
    title: "9 simple ways to improve your design skills",
    paragraph:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras sit amet dictum neque, laoreet dolor.",
    image: "/images/blog/blog-02.jpg",
    author: {
      name: "Isaac Paha",
      image: "/images/blog/pic.jpg",
      designation: "Software Engineer",
    },
    tags: ["computer"],
    publishDate: "2024",
  },
  {
    id: 3,
    title: "Tips to quickly improve your coding speed.",
    paragraph:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras sit amet dictum neque, laoreet dolor.",
    image: "/images/blog/blog-03.jpg",
    author: {
      name: "Isaac Paha",
      image: "/images/blog/pic.jpg",
      designation: "Software Engineer",
    },
    tags: ["design"],
    publishDate: "2022",
  },
];
export default blogData;