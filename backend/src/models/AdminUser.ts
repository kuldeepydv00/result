import mongoose, { Schema, Document } from 'mongoose';

export interface IAdminUser extends Document {
  username: string;
  email: string;
  password_hash: string;
  role: 'admin' | 'super_admin';
  last_login?: Date;
  created_at: Date;
  updated_at: Date;
}

const AdminUserSchema: Schema = new Schema(
  {
    username: { type: String, required: true },
    email: { type: String, unique: true, required: true, lowercase: true, trim: true },
    password_hash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'super_admin'], default: 'admin' },
    last_login: { type: Date }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

export default mongoose.model<IAdminUser>('AdminUser', AdminUserSchema);
