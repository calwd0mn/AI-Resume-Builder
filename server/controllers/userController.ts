import { Request, Response } from 'express';
import User, { type IUser } from '../modules/User';
import Resume from '../modules/Resume';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../middlewares/authMiddleware';


// 报错1修复：用 ! 非空断言告诉 TS 该环境变量一定存在，
// 或者在运行时提前校验（更推荐后者，这里用断言简洁处理）
const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: '7d' });
}

//POST: /api/users/register
export const registerUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    // check if required fields are present
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    // check if user already exists
    const user = await User.findOne({ email })
    if (user) {
      return res.status(400).json({ message: 'User already exists' })
    }

    // create new user
    const hashedPassword = await bcrypt.hash(password, 10)
    const newUser = await User.create({
      name, email, password: hashedPassword
    })

    // 报错2修复：ObjectId → string，用 .toString() 转换
    const token = generateToken(newUser._id.toString())
    // 确保hash不会被传到前端
    newUser.password = undefined;

    return res.status(201).json({ message: 'User created successfully', token, user: newUser })

    // 报错3修复：catch 的 error 类型为 unknown，需要先判断类型再访问属性
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ message })
  }
}

// controller for user login
// POST: /api/users/login
export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // check if user exists
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' })
    }

    // check if password is correct
    const isMatch = await (user as IUser).comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' })
    }

    // return success message
    const token = generateToken(user._id.toString())
    user.password = undefined;

    return res.status(200).json({ message: 'Login successful', token, user })

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ message })
  }
}

// controller for getting user by id
// GET: /api/users/data
export const getUserById = async (req: AuthRequest, res: Response) => {
  try {

    const userId = req.userId;

    // check if user exists
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    // return user
    user.password = undefined;
    return res.status(200).json({ user })

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ message })
  }
}

// controller for getting user resumes
// GET: /api/users/resumes
export const getUserResumes = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    const resumes = await Resume.find({ userId })
    return res.status(200).json({ resumes })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ message })
  }
}