import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    title: {
      type: String,
      default: 'New Chat',
    },
    summary: {
      type: String,
      default: '',
    },
    summarizedCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Session = mongoose.model('Session', sessionSchema);
export default Session;
