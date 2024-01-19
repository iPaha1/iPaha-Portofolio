import { Schema, model, models } from "mongoose";

export interface iProject extends Document {
    _id: string;
    title: string;
    description: string;
    projectUrl: string;
    imageUrl: string;
    createdAt: Date;
    updatedAt: Date;
}

const ProjectSchema = new Schema({
    title: { type: String, required: true},
    description: { type: String, required: true},
    projectUrl: { type: String, required: true},
    imageUrl: { type: String, required: true},
    createdAt: { type: Date, default: Date.now,},
    updatedAt: { type: Date, required: true,  default: Date.now,},
    });

    const Project = models.Project || model('Project', ProjectSchema);
    
export default Project;