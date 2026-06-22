import { Inngest } from "inngest";
import prisma from "../configs/prisma.js";
import sendEmail from "../configs/nodemailer.js";

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

// Inngest Function to Send Email on Task Creation
const sendTaskAssignmentEmail = inngest.createFunction(
  {
    id: "send-task-assignment-mail",
    triggers: [
      {
        event: "app/task.assigned"
      }
    ]
  },
  async ({ event, step }) => {
    const { task, origin } = event.data || {};
    const taskId = event.data?.taskId || task?.id;

    if (!task && !taskId) return;

    const assignedTask = task || await prisma.task.findUnique({
      where: { id: taskId },
      include: { assignee: true, project: true },
    });

    if (!assignedTask) return;

    await sendEmail({
      to: assignedTask.assignee.email,

      subject: `New Task Assignment in ${assignedTask.project.name}`,

      body: `
      <div style="max-width:600px;">

        <h2>Hi ${assignedTask.assignee.name}, 👋</h2>

        <p style="font-size:16px;">
          You've been assigned a new task:
        </p>

        <p
          style="
            font-size:18px;
            font-weight:bold;
            color:#007bff;
            margin:8px 0;
          "
        >
          ${assignedTask.title}
        </p>

        <div
          style="
            border:1px solid #ddd;
            padding:12px 16px;
            border-radius:6px;
            margin-bottom:30px;
          "
        >
          <p style="margin:6px 0;">
            <strong>Description:</strong>
            ${assignedTask.description}
          </p>

          <p style="margin:6px 0;">
            <strong>Due Date:</strong>
            ${new Date(assignedTask.due_date).toLocaleDateString()}
          </p>
        </div>

        <a
          href="${origin}"
          style="
            background-color:#007bff;
            padding:12px 24px;
            border-radius:5px;
            color:#fff;
            font-weight:600;
            font-size:16px;
            text-decoration:none;
          "
        >
          View Task
        </a>

        <p
          style="
            margin-top:20px;
            font-size:14px;
            color:#6c757d;
          "
        >
          Please make sure to review and complete it before the due date.
        </p>

      </div>
      `,
    });

    if (
  new Date(assignedTask.due_date).toLocaleDateString() !==
  new Date().toLocaleDateString()
   ) 
   {
    await step.sleepUntil(
     "wait-for-the-due-date",
     new Date(assignedTask.due_date)
    );
   }

  await step.run("check-if-task-is-completed", async () => {

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignee: true,
        project: true,
      },
    });

    if (!task) return;

    if (task.status !== "DONE") {

      await step.run("send-task-remainder-mail", async () => {

        await sendEmail({
          to: task.assignee.email,

          subject: `Reminder for ${task.project.name}`,

          body: `
            <div style="max-width: 600px;">
            <h2>
    Hi ${task.assignee.name}, 👋
  </h2>

  <p style="font-size:16px;">
    You have a task due in ${task.project.name}:
  </p>

  <p
    style="
      font-size:18px;
      font-weight:bold;
      color:#007bff;
      margin:8px 0;
    "
  >
    ${task.title}
  </p>

  <div
    style="
      border:1px solid #ddd;
      padding:12px 16px;
      border-radius:6px;
      margin-bottom:30px;
    "
  >

    <p style="margin:6px 0;">
      <strong>Description:</strong>
      ${task.description}
    </p>

    <p style="margin:6px 0;">
      <strong>Due Date:</strong>
      ${new Date(task.due_date).toLocaleDateString()}
    </p>

  </div>

  <a
    href="${origin}"
    style="
      background-color:#007bff;
      padding:12px 24px;
      border-radius:5px;
      color:#fff;
      font-weight:600;
      font-size:16px;
      text-decoration:none;
    "
  >
    View Task
  </a>

  <p
    style="
      margin-top:20px;
      font-size:14px;
      color:#6c757d;
    "
  >
    Please make sure to review and complete it before the due date.
  </p>

 </div>`
        });

      });

    }

  });
});
   
// Export functions
export const functions = [
  syncUserCreation,
  syncUserDeletion,
  syncUserUpdation,
  saveWorkspaceData,
  syncWorkspaceUpdation,
  syncWorkspaceDeletion,
  saveWorkspaceMemberData,
  sendTaskAssignmentEmail

];