import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  userId?: string;
}

const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  // 同时兼容 "Bearer <token>" 与直接传 "<token>" 两种格式
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : authHeader;
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    req.userId = decoded.userId;
    //执行后续业务逻辑
    next();
  } catch (_error) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
}

export default protect;