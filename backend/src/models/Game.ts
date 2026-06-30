import mongoose, { Schema, Document } from 'mongoose';

export interface IGame extends Document {
  name: string;
  code: string;
  display_name: string;
  schedule_time: string;
  timezone: string;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

const GameSchema: Schema = new Schema(
  {
    name: { type: String, unique: true, required: true },
    code: { type: String, unique: true, required: true, lowercase: true, trim: true },
    display_name: { type: String, required: true },
    schedule_time: { type: String, required: true },
    timezone: { type: String, default: "Asia/Kolkata" },
    is_active: { type: Boolean, default: true },
    is_featured: { type: Boolean, default: false },
    sort_order: { type: Number, default: 0 }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

export default mongoose.model<IGame>('Game', GameSchema);
