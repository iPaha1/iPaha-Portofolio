import { connectToDatabase } from "@/lib/database";
import Project from "@/lib/database/models/project-model";
import { NextRequest, NextResponse } from "next/server";




export async function GET(request: NextRequest, response: NextResponse) {
    const connectdB = await connectToDatabase();
    console.log('connectdB', connectdB);
    
    return new NextResponse("Hello, world Agian!");

}

export async function POST(request: NextRequest, response: NextResponse) {
    // Connect to the database
    await connectToDatabase();

    // Parse the request body to get project data
    const data = await request.json();
    console.log('data', data);

    try {
        // Create a new project using the model
        const newProject = new Project(data);
        // Save the new project
        await newProject.save();

        // Return a response
        return new NextResponse(JSON.stringify(newProject), {
            status: 201, // Created
            headers: {
                'Content-Type': 'application/json',
            },
        });
    } catch (error) {
        // Handle any errors
        console.error('Error creating new project:', error);
        return new NextResponse(JSON.stringify({ error: 'Error creating new project' }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }
}