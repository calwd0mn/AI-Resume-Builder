import express from 'express';
import { getUserResumes, registerUser } from '../controllers/userController';
import { loginUser } from '../controllers/userController';
import { getUserById } from '../controllers/userController';
import protect from '../middlewares/authMiddleware';
import { deleteResume } from '../controllers/resumeController';


const userRoutes = express.Router();

userRoutes.post('/register', registerUser);
userRoutes.post('/login', loginUser);
userRoutes.get('/data', protect, getUserById);
userRoutes.get('/resumes', protect, getUserResumes)
userRoutes.delete('/resumes/delete/:resumeId', protect, deleteResume)

export default userRoutes;