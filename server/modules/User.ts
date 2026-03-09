import mongoose, { Document } from 'mongoose';
import bcrypt from 'bcrypt';
// 定义 IUser 接口，继承 Document，包含 comparePassword 方法
export interface IUser extends Document {
  name: string;
  email: string;
  password: string | undefined;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
  }
}, { timestamps: true })

UserSchema.methods.comparePassword = async function (candidatePassword: string) {
  return await bcrypt.compare(candidatePassword, this.password);
}
// 创建 User 模型
const User = mongoose.model<IUser>('User', UserSchema);

export default User;