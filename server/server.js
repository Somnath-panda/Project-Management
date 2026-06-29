import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { clerkMiddleware } from '@clerk/express'
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js";
import workspaceRouter from './routes/workspaceRoutes.js';
import { protect } from './middlewares/authMiddleware.js';
import projectRouter from './routes/projectRoutes.js';
import taskRouter from './routes/taskRoutes.js';
import commentRouter from './routes/commentRoutes.js';

import prisma from './configs/prisma.js';

const app = express();

app.use(express.json());
app.use(cors());

// Clerk Webhook direct handler
app.post("/api/clerk-webhook", async (req, res) => {
    try {
        const { type, data } = req.body;
        console.log("CLERK WEBHOOK RECEIVED:", type);

        if (type === "user.created") {
            const displayName = [data?.first_name, data?.last_name].filter(Boolean).join(" ").trim() 
                || data?.username 
                || data?.email_addresses?.[0]?.email_address?.split("@")[0] 
                || "Unknown User";

            await prisma.user.create({
                data: {
                    id: data.id,
                    email: data?.email_addresses[0]?.email_address,
                    name: displayName,
                    image: data?.image_url || "",
                },
            });
            console.log("User created via webhook:", data.id);
        } else if (type === "user.updated") {
            const displayName = [data?.first_name, data?.last_name].filter(Boolean).join(" ").trim() 
                || data?.username 
                || data?.email_addresses?.[0]?.email_address?.split("@")[0] 
                || "Unknown User";

            await prisma.user.upsert({
                where: { id: data.id },
                update: {
                    email: data?.email_addresses[0]?.email_address,
                    name: displayName,
                    image: data?.image_url || "",
                },
                create: {
                    id: data.id,
                    email: data?.email_addresses[0]?.email_address,
                    name: displayName,
                    image: data?.image_url || "",
                }
            });
            console.log("User updated via webhook:", data.id);
        } else if (type === "user.deleted") {
            await prisma.user.delete({
                where: { id: data.id },
            });
            console.log("User deleted via webhook:", data.id);
        } else if (type === "organization.created") {
            const user = await prisma.user.findUnique({
                where: { id: data.created_by },
            });
            if (user) {
                const existingWorkspace = await prisma.workspace.findUnique({
                    where: { id: data.id },
                });
                if (!existingWorkspace) {
                    await prisma.workspace.create({
                        data: {
                            id: data.id,
                            name: data.name,
                            slug: data.slug,
                            ownerId: data.created_by,
                            image_url: data.image_url || "",
                        },
                    });
                    await prisma.workspaceMember.create({
                        data: {
                            userId: data.created_by,
                            workspaceId: data.id,
                            role: "ADMIN",
                        },
                    });
                    console.log("Workspace created via webhook:", data.id);
                }
            }
        } else if (type === "organization.updated") {
            await prisma.workspace.update({
                where: { id: data.id },
                data: {
                    name: data.name,
                    slug: data.slug,
                    image_url: data.image_url || "",
                }
            });
            console.log("Workspace updated via webhook:", data.id);
        } else if (type === "organization.deleted") {
            await prisma.workspace.delete({
                where: { id: data.id },
            });
            console.log("Workspace deleted via webhook:", data.id);
        } else if (type === "organizationInvitation.accepted") {
            await prisma.workspaceMember.create({
                data: {
                    userId: data.user_id,
                    workspaceId: data.organization_id,
                    role: String(data.role_name).toUpperCase(),
                },
            });
            console.log("Workspace member added via webhook:", data.user_id);
        }

        res.json({ success: true });
    } catch (error) {
        console.error("Webhook processing error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Inngest route FIRST
app.use("/api/inngest", serve({
 client: inngest,
 functions
}));

// Clerk middleware AFTER inngest
app.use(clerkMiddleware());

app.get('/', (req,res) => res.send('Server is live!'));

// Routes
app.use('/api/workspaces', protect, workspaceRouter);
app.use("/api/projects", protect,projectRouter)
app.use("/api/tasks", protect, taskRouter)
app.use("/api/comments", protect, commentRouter)

if (process.env.NODE_ENV !== 'production') {
 const PORT = process.env.PORT || 5000;
 app.listen(PORT, () =>
   console.log(`Server is running on port ${PORT}`)
 );
}

export default app;