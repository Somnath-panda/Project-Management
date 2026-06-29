import express from 'express';
import { addMember, createProject, updateProject, removeMember, deleteProject } from '../controllers/projectController.js';

const projectRouter = express.Router();

projectRouter.post('/', createProject)
projectRouter.put('/', updateProject)
projectRouter.delete('/:projectId', deleteProject)
projectRouter.post('/:projectId/addMember', addMember)
projectRouter.delete('/:projectId/members/:memberUserId', removeMember)

export default projectRouter