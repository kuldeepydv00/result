import mongoose, { Schema, Document } from 'mongoose';

export interface IChartDay {
  day: number;
  result: string;
}

export interface IChart extends Document {
  game_id: mongoose.Types.ObjectId;
  year: number;
  month: number;
  data: IChartDay[];
  created_at: Date;
  updated_at: Date;
}

const ChartSchema: Schema = new Schema(
  {
    game_id: { type: Schema.Types.ObjectId, ref: 'Game', required: true },
    year: { type: Number, required: true },
    month: { type: Number, required: true },
    data: [
      {
        day: { type: Number, required: true },
        result: { type: String, default: '' }
      }
    ]
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

// Compound unique index for game, year, and month
ChartSchema.index({ game_id: 1, year: 1, month: 1 }, { unique: true });

export default mongoose.model<IChart>('Chart', ChartSchema);
