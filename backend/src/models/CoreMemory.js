import mongoose from 'mongoose';

const coreMemorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    content: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const CoreMemory = mongoose.model('CoreMemory', coreMemorySchema);
export default CoreMemory;
