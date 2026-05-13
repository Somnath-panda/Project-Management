import { Inngest } from "inngest";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Create a client to send and receive events
export const inngest = new Inngest({ id: "project-management" });

//Inngest function to save user data to the database when a user is created in Clerk
const syncUserCreation = inngest.createFunction(
  {id: 'sync-user-from-clerk'},
  { trigger: "clerk/user.created" },
  async ({ event}) => {
    const {data} = event;
    await prisma.user.create({
      data:{
        id: data.id,
        email: data?.email_addresses[0]?.email_addresses,
        name: data?.first_name + " " + data?.last_name,
        image: data?.image_url,
      }
    })
  }
)


//Inngest function to delete user data from the database when a user is deleted in Clerk
const syncUserDeletion = inngest.createFunction(
  {id: 'delete-user-from-clerk'},
  { trigger: "clerk/user.deleted" },
  async ({ event}) => {
    const {data} = event;
    await prisma.user.delete({
      where:{
        id: data.id
      }
    })
      }
)


//Inngest function to update user data in the database when a user is updated in Clerk
const syncUserUpdation = inngest.createFunction(
  {id: 'update-user-from-clerk'},
  { trigger: "clerk/user.updated" },
  async ({ event}) => {
    const {data} = event;
    await prisma.user.update({
      where:{
         id: data.id
      },
      data:{
        email: data?.email_addresses[0]?.email_addresses,
        name: data?.first_name + " " + data?.last_name,
        image: data?.image_url,
      }
    })
  }
)


// Create an empty array where we'll export future Inngest functions
export const functions = [
  syncUserCreation,
  syncUserDeletion,
  syncUserUpdation
];