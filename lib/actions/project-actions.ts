"use server"

import { connectToDatabase } from "../database";
import Project from "../database/models/project-model";

// create a new project
export async function createProject() {
  try {
    const connectdB = await connectToDatabase();
    console.log('connectdB', connectdB);
    
    const newProject = new Project({
      title: 'test',
      description: 'test',
      projectUrl: 'test',
      imageUrl: 'test',
      createdAt: new Date(),
    });
    
    const project = await newProject.save();
    console.log('project', project);
    
    return project;

  } catch (error) {
    console.log('error', error);
    return error;
  }

}


