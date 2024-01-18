"use server"

import { CreateProjectParams } from "@/types";
import { connectToDatabase } from "../database/models";
import { handleError } from "../utils";
import { revalidatePath } from "next/cache";
import Project from "../database/models/project-model";

// create a new project
export async function createProject({ userId, project, path }: CreateProjectParams) {
  try {
    await connectToDatabase();

    const newProject = await Project.create({...project, userId})
    revalidatePath(path);

    

    if (!newProject) throw new Error("Project creation failed");

    return JSON.parse(JSON.stringify(newProject));

  } catch (error) {
    handleError(error);
  }
}

// get all projects
export async function getAllProjects() {
  try {
    await connectToDatabase();

    const projects = await Project.find({});

    return JSON.parse(JSON.stringify(projects));
  } catch (error) {
    handleError(error);
  }
}

// Update a project
export async function updateProject({ userId, project, path }: CreateProjectParams) {
  try {
    await connectToDatabase();

    const updatedProject = await Project.findOneAndUpdate({ userId }, project, { new: true });

    if (!updatedProject) throw new Error("Project update failed");

    revalidatePath(path);

    return JSON.parse(JSON.stringify(updatedProject));
  } catch (error) {
    handleError(error);
  }
}


