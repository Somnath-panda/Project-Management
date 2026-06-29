import { clerkClient } from "@clerk/express";
import prisma from "../configs/prisma.js";

//Get all workspace for user
export const getWorkspaces = async (req, res) => {
  try {
    const {userId} = await req.auth();
    const workspaces = await prisma.workspace.findMany({
      where: {
        members: {some: {userId: userId }}
      },
      include: {
        members: {include: {user: true}},
        projects: {
          include:{
            tasks: {include: {assignee: true,
              comments: {include: {user: true} }
            }},
            members: { include: {user: true} }
          }
        },
        owner: true
      }
    });
    res.json(workspaces);

  }catch (error) {
    console.log(error);
    res.status(500).json({ message: error.code || error.message })
  }
}




//Add member to workspace
export const addMembers = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const { email, role, workspaceId, message } = req.body;

    if (!workspaceId || !role || !email) {
      return res.status(400).json({ message: 'Missing required parameters' });
    }

    if (!["ADMIN", "MEMBER"].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // fetch workspace
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { members: true }
    });

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    // Check if the current user has admin role in this workspace
    const currentUserMember = workspace.members.find((member) => member.userId === userId);
    if (!currentUserMember || currentUserMember.role !== 'ADMIN') {
      return res.status(403).json({ message: "You don't have admin privileges to add members" });
    }

    // Check if user is already a member
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      const existingMember = workspace.members.find((member) => member.userId === existingUser.id);
      if (existingMember) {
        return res.status(400).json({ message: 'User is already a member of this workspace' });
      }
    }

    // Map roles for Clerk Organization Invitation
    const clerkRole = role === "ADMIN" ? "org:admin" : "org:member";

    // Invite the member via Clerk
    await clerkClient.organizations.createOrganizationInvitation({
      organizationId: workspaceId,
      inviterUserId: userId,
      emailAddress: email,
      role: clerkRole,
    });

    res.json({ message: "Invitation email sent successfully!" });

  } catch (error) {
    console.error("Clerk invitation error:", error);
    res.status(500).json({ message: error.message || "Failed to send invitation" });
  }
}