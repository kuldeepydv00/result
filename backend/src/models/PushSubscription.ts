import mongoose, { Schema, Document } from 'mongoose';

export interface IPushSubscription extends Document {
  subscription: any;
  favorites: mongoose.Types.ObjectId[];
  created_at: Date;
}

const PushSubscriptionSchema: Schema = new Schema({
  subscription: { type: Object, required: true, unique: true },
  favorites: [{ type: Schema.Types.ObjectId, ref: 'Game' }],
  created_at: { type: Date, default: Date.now }
});

export default mongoose.model<IPushSubscription>('PushSubscription', PushSubscriptionSchema);
