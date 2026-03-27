import mongoose, { Document } from 'mongoose';
import bcrypt from 'bcrypt';
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
const User = mongoose.model<IUser>('User', UserSchema);

export default User;