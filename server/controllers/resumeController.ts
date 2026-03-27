import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import Resume from "../modules/Resume";
import imageKit from "../configs/imageKit";
import fs from 'fs';


// controller for creating a new resume
// POST: /api/resumes/create
export const createResume = async (req: AuthRequest, res: Response) => {

  try {
    const userId = req.userId;
    const { title } = req.body;

    //create new resume
    const newResume = await Resume.create({
      userId,
      title,
    })
    // response 必须从 express 显式导入，不然status会与浏览器默认的全局类型冲突
    return res.status(201).json({ message: 'Resume created successfully', resume: newResume })



  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(400).json({ message })
  }
}

// controller for deleting a resumes
// DELETE: /api/resumes/delete/:id
export const deleteResume = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    // 通过路由传入的resumeId来删除简历 
    // 路由中的/:resumeId 是路由参数，通过req.params.resumeId 获取
    // 冒号是关键，表示这是一个路由参数
    const { resumeId } = req.params;

    await Resume.findOneAndDelete({ userId, _id: resumeId })

    return res.status(200).json({ message: 'Resume deleted successfully' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(400).json({ message })
  }
}

// controller for getting a resume by id
// GET: /api/resumes/get
export const getResumeById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { resumeId } = req.params;

    // select('-__v -createdAt -updatedAt') 表示排除 __v、createdAt、updatedAt 字段，以达到不传递给前端的效果，类似前面的undefined
    const resume = await Resume.findOne({ userId, _id: resumeId }).select('-__v -createdAt -updatedAt');
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' })
    }

    return res.status(200).json({ resume })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(400).json({ message })
  }
}

// controller for updating a resume by id
// PUT: /api/resumes/update/:id
export const updateResumeById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { resumeId, resumeData, removeBackground } = req.body;
    const image = req.file

    let resumeDataCopy = JSON.parse(resumeData);
    if (image) {

      const imageBufferData = fs.createReadStream(image.path);

      const response = await imageKit.files.upload({
        file: imageBufferData,
        fileName: 'resume.jpg',
        folder: 'user-resumes',
        transformation: {
          pre: 'w-300,h-300,fo-face,z-0.75' + (removeBackground ? ',e-bgremove' : '')
        }
      });
      resumeDataCopy.personal_info = resumeDataCopy.personal_info || {};
      resumeDataCopy.personal_info.image = response.url;
    }
    const resume = await Resume.findOneAndUpdate(
      { userId, _id: resumeId },
      resumeDataCopy,
      { returnDocument: 'after' }
    );

    return res.status(200).json({ message: 'Resume updated successfully', resume })

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(400).json({ message })
  }
}
