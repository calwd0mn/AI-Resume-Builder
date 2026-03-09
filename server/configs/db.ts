import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    mongoose.connection.on('connected', () => {
      console.log('Connected to MongoDB');
    });

    let mongodbURL = process.env.MONGODB_URL;
    const projectName = 'resume_builder_db';

    if (!mongodbURL) {
      throw new Error('MONGODB_URL is not defined');
    }
    if (mongodbURL.endsWith('/')) {
      mongodbURL = mongodbURL.slice(0, -1);
    }

    await mongoose.connect(`${mongodbURL}/${projectName}`);
  } catch (error) {
    console.error('Error connecting to MongoDB', error);
    // 数据库未连通时不应继续提供 API，避免请求在模型层超时
    process.exit(1);
  }
};

export default connectDB;