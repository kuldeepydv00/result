import mongoose, { Schema, Document } from 'mongoose';

export interface IFetchLog extends Document {
  started_at: Date;
  finished_at: Date;
  game_code?: string;
  success: boolean;
  error_message?: string;
  response_data?: any;
  created_at: Date;
}

const FetchLogSchema: Schema = new Schema(
  {
    started_at: { type: Date, required: true },
    finished_at: { type: Date, required: true },
    game_code: { type: String },
    success: { type: Boolean, required: true, default: false },
    error_message: { type: String },
    response_data: { type: Schema.Types.Mixed }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false }
  }
);

export default mongoose.model<IFetchLog>('FetchLog', FetchLogSchema);
