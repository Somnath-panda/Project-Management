import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { clerkMiddleware } from '@clerk/express'
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js";
import workspaceRouter from './routes/workspaceRoutes.js';
import { protect } from './middlewares/authMiddleware.js';

const app = express();

app.use(express.json());
app.use(cors());

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

if (process.env.NODE_ENV !== 'production') {
 const PORT = process.env.PORT || 5000;
 app.listen(PORT, () =>
   console.log(`Server is running on port ${PORT}`)
 );
}

export default app;