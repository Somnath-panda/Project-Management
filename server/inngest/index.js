import { Inngest } from "inngest";
import prisma from "../configs/prisma.js";

// Create Inngest client
export const inngest = new Inngest({
  id: "project-management",
});

// Sync user creation from Clerk
const syncUserCreation = inngest.createFunction(
  {
    id: "sync-user-from-clerk",
    triggers: [{ event: "clerk/user.created" }],
  },
  async ({ event }) => {
    const { data } = event;

    await prisma.user.create({
      data: {
        id: data.id,
        email: data?.email_addresses[0]?.email_address,
        name: `${data?.first_name || ""} ${data?.last_name || ""}`,
        image: data?.image_url,
      },
    });
  }
);

// Sync user deletion from Clerk
const syncUserDeletion = inngest.createFunction(
  {
    id: "delete-user-from-clerk",
    triggers: [{ event: "clerk/user.deleted" }],
  },
  async ({ event }) => {
    const { data } = event;

    await prisma.user.delete({
      where: {
        id: data.id,
      },
    });
  }
);

// Sync user updation from Clerk
const syncUserUpdation = inngest.createFunction(
  {
    id: "update-user-from-clerk",
    triggers: [{ event: "clerk/user.updated" }],
  },
  async ({ event }) => {
    const { data } = event;

    await prisma.user.update({
      where: {
        id: data.id,
      },
      data: {
        email: data?.email_addresses[0]?.email_address,
        name: `${data?.first_name || ""} ${data?.last_name || ""}`,
        image: data?.image_url,
      },
    });
  }
);

// Inngest function to save workspace data to database
const saveWorkspaceData = inngest.createFunction(
  {
    id: "sync-workspace-from-clerk",
    triggers: [{ event: "clerk/organization.created" }],
  },

  async ({ event }) => {
    const { data } = event;

    console.log("ORG CREATED:", data);

    // Check if owner user exists
    const user = await prisma.user.findUnique({
      where: {
        id: data.created_by,
      },
    });

    if (!user) {
      console.log("User not found:", data.created_by);
      return;
    }

    // Prevent duplicate workspace
    const existingWorkspace = await prisma.workspace.findUnique({
      where: {
        id: data.id,
      },
    });

    if (existingWorkspace) {
      console.log("Workspace already exists");
      return;
    }

    await prisma.workspace.create({
      data: {
        id: data.id,
        name: data.name,
        slug: data.slug,
        ownerId: data.created_by,
        image_url: data.image_url,
      },
    });

    console.log("Workspace created");

    await prisma.workspaceMember.create({
      data: {
        userId: data.created_by,
        workspaceId: data.id,
        role: "ADMIN",
      },
    });

    console.log("Workspace member created");
  }
);
    const syncWorkspaceUpdation = inngest.createFunction(
{
  id: "update-workspace-from-clerk",
  triggers: [{ event: "clerk/organization.updated" }]
},

async ({ event }) => {
  const { data } = event;

  const workspace = await prisma.workspace.findUnique({
    where: { id: data.id }
  });

  if (!workspace) {
    console.log("Workspace not found");
    return;
  }

  await prisma.workspace.update({
    where: {
      id: data.id
    },
    data: {
      name: data.name,
      slug: data.slug,
      image_url: data.image_url,
    }
  });

  console.log("Workspace updated");
}
)
    //Inngest function to delete workspace data from database
    const syncWorkspaceDeletion = inngest.createFunction(
      {
        id: "delete-workspace-from-clerk",
        triggers: [{ event: "clerk/organization.deleted" }],
      },
      async ({ event }) => {
        const { data } = event;
        await prisma.workspace.delete({
          where: {
            id :data.id
          }
        })
      }

  )
  // Inngest function to save workspace member data to database
const saveWorkspaceMemberData = inngest.createFunction(
  {
    id: "sync-workspace-member-from-clerk",
    triggers: [
      { event: "clerk/organizationInvitation.accepted" }
    ],
  },

  async ({ event }) => {
    const { data } = event;

    await prisma.workspaceMember.create({
      data: {
        userId: data.user_id,
        workspaceId: data.organization_id,
        role: String(data.role_name).toUpperCase(),
      },
    })
  }
)

   
// Export functions
export const functions = [
  syncUserCreation,
  syncUserDeletion,
  syncUserUpdation,
  saveWorkspaceData,
  syncWorkspaceUpdation,
  syncWorkspaceDeletion,
  saveWorkspaceMemberData,
];