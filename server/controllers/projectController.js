
import prisma from "../configs/prisma.js";
//Create project
export const createProject = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const { workspaceId, description, name, status, start_date, end_date, team_members, team_lead, progress, priority } = req.body;

    //check if user has admin role for workspace
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { members: { include: { user: true } } }
    })

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    if (!workspace.members.some((member) => member.userId === userId && member.role === 'ADMIN')) {
      return res.status(403).json({ message: "You don't have permission to create project in this workspace" });
    }

    //Get team lead using email
    const teamLead = team_lead ? await prisma.user.findUnique({
      where: { email: team_lead },
      select: { id: true }
    }) : null

    const project = await prisma.project.create({
      data: {
        workspaceId,
        name,
        description,
        status,
        priority,
        progress,
        start_date: start_date ? new Date(start_date) : null,
        end_date: end_date ? new Date(end_date) : null,
        team_lead: teamLead?.id || userId,
      }
    })

    //Add members to project if they are in the workspace
    if (team_members?.length > 0) {
      const membersToAdd = []
      workspace.members.forEach(member => {
        if (team_members.includes(member.user.email)) {
          membersToAdd.push(member.userId)
        }
      })

      //Project members are added using createMany for better performance
      await prisma.projectMember.createMany({
        data: membersToAdd.map(memberId => ({
          projectId: project.id,
          userId: memberId
        }))
      })
    }

    // Fetch project along with members, tasks, comments, assignee and owner details
    const projectWithMembers = await prisma.project.findUnique({
      where: { id: project.id },
      include: {
        members: { include: { user: true } },
        tasks: { include: { assignee: true, comments: { include: { user: true } } } },
        owner: true
      }
    })

    res.json({ project: projectWithMembers, message: "Project created successfully..." })


  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.code || error.message })
  }
}

// Update Project
export const updateProject = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const { id, workspaceId, description, name, status, start_date, end_date, progress, priority } = req.body;

    // check if user has admin role for workspace
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { members: { include: { user: true } } }
    })

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    if (!workspace.members.some((member) => member.userId === userId && member.role === "ADMIN")) {
      const project = await prisma.project.findUnique({
        where: { id }
      })

      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      } else if (project.team_lead !== userId) {
        return res.status(403).json({ message: "You don't have permission to update projects in this workspace" })
      }

    }


    const project = await prisma.project.update({
      where: { id },
      data: {
        workspaceId,
        description,
        name,
        status,
        priority,
        progress,
        start_date: start_date ? new Date(start_date) : null,
        end_date: end_date ? new Date(end_date) : null,
      }
    })

    res.json({ project, message: "Project updated successfully!" })

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.code || error.message })
  }
}

//Add member to project
export const addMember = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const { projectId } = req.params;
    const { email } = req.body;

    //Check if user is project lead
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: { include: { user: true } } }
    })

    if (!project) {
      return res.status(404).json({ message: "Project not found" })
    }

    if (project.team_lead !== userId) {
      return res.status(404).json({ message: "Only project lead can add members" });
    }

    // Check if the user is already a member
    const existingMember = project.members.find((member) => member.user.email === email)

    if (existingMember) {
      return res.status(400).json({ message: "User is already a member" });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const member = await prisma.projectMember.create({
      data: {
        userId: user.id,
        projectId
      }
    })

    res.json({ member, message: "Member added successfully" })



  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.code || error.message })
  }
}

// Remove member from project
export const removeMember = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const { projectId, memberUserId } = req.params;

    // Fetch the project to verify access
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { workspace: { include: { members: true } } }
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Only Workspace ADMIN or Project Team Lead can delete members
    const isWorkspaceAdmin = project.workspace.members.some(
      (m) => m.userId === userId && m.role === "ADMIN"
    );
    const isTeamLead = project.team_lead === userId;

    if (!isWorkspaceAdmin && !isTeamLead) {
      return res.status(403).json({ message: "You don't have permission to remove members from this project" });
    }

    // Prevent removing the team lead from project members
    if (project.team_lead === memberUserId) {
      return res.status(400).json({ message: "Cannot remove the Team Lead from the project" });
    }

    await prisma.projectMember.delete({
      where: {
        userId_projectId: {
          userId: memberUserId,
          projectId
        }
      }
    });

    res.json({ message: "Member removed from project successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.code || error.message });
  }
};

// Delete Project
export const deleteProject = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const { projectId } = req.params;

    // Fetch the project to verify access
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { workspace: { include: { members: true } } }
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Only Workspace ADMIN can delete projects
    const isWorkspaceAdmin = project.workspace.members.some(
      (m) => m.userId === userId && m.role === "ADMIN"
    );

    if (!isWorkspaceAdmin) {
      return res.status(403).json({ message: "Only Workspace Administrators can delete projects" });
    }

    // Delete the project (cascade deletes project members and tasks)
    await prisma.project.delete({
      where: { id: projectId }
    });

    res.json({ message: "Project deleted successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.code || error.message });
  }
};

