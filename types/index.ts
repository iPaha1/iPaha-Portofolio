import exp from "constants"

// ====== USER PARAMS
export type CreateUserParams = {
    clerkId: string
    firstName: string
    lastName: string
    username: string
    email: string
    photo: string
  }
  
  export type UpdateUserParams = {
    firstName: string
    lastName: string
    username: string
    photo: string
  }
  
  // ====== Project PARAMS
  export type CreateProjectParams = {
    userId: string
    project: {
      title: string
      description: string
      projectUrl: string
      imageUrl: string
    }
    path: string
  }

  export type UpdateProjectParams = {
    userId: string
    project: {
      _id: string
      title: string
      description: string
      projectUrl: string
      imageUrl: string
    }
    path: string
  }
  
  export type DeleteProjectParams = {
    projectId: string
    path: string
  }

  export type GetProjectParams = {
    projectId: string
  }
  
  export type GetAllEventsParams = {
    query: string
    category: string
    limit: number
    page: number
  }
  
  export type Project = {
    _id: string
    title: string
    description: string
    projectUrl: string
    imageUrl: string
    createdAt: Date
    updatedAt: Date
  }

  