import mongoose, { Schema, Document } from 'mongoose';

export interface IResult extends Document {
  game_id: mongoose.Types.ObjectId;
  date: Date;
  result_number: string | null;
  status: 'announced' | 'pending';
  source: 'api' | 'manual';
  fetched_at?: Date;
  created_at: Date;
  updated_at: Date;
}

const ResultSchema: Schema = new Schema(
  {
    game_id: { type: Schema.Types.ObjectId, ref: 'Game', required: true },
    date: { type: Date, required: true },
    result_number: { type: String, default: null },
    status: { type: String, enum: ['announced', 'pending'], default: 'pending' },
    source: { type: String, enum: ['api', 'manual'], default: 'api' },
    fetched_at: { type: Date }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

// Compound unique index for game_id and date
ResultSchema.index({ game_id: 1, date: 1 }, { unique: true });

export default mongoose.model<IResult>('Result', ResultSchema);
