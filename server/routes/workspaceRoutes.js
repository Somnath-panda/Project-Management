import express from 'express'
import { getWorkspaces, addMembers } from '../controllers/workspaceController.js';
const workspaceRouter = express.Router();

workspaceRouter.get('/', getWorkspaces);
workspaceRouter.post('/add-member', addMembers);

export default workspaceRouter;

