import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password_hash: string;
  full_name?: string;
  favorites: mongoose.Types.ObjectId[];
  notification_settings: {
    push_enabled: boolean;
    email_enabled: boolean;
    web_push_subscriptions: any[];
  };
  is_active: boolean;
  role: string;
  last_login?: Date;
  created_at: Date;
  updated_at: Date;
}

const UserSchema: Schema = new Schema(
  {
    email: { type: String, unique: true, required: true, lowercase: true, trim: true },
    password_hash: { type: String, required: true },
    full_name: { type: String },
    favorites: [{ type: Schema.Types.ObjectId, ref: 'Game' }],
    notification_settings: {
      push_enabled: { type: Boolean, default: false },
      email_enabled: { type: Boolean, default: false },
      web_push_subscriptions: { type: Array, default: [] }
    },
    is_active: { type: Boolean, default: true },
    role: { type: String, default: 'user' },
    last_login: { type: Date }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

export default mongoose.model<IUser>('User', UserSchema);
