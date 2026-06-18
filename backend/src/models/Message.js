import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    session: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Session',
    },
    role: {
      type: String,
      required: true,
      enum: ['user', 'assistant', 'system', 'tool'],
    },
    content: {
      type: String,
      required: false, // Could be empty if it's just a tool call
    },
    tool_calls: {
      type: Array,
      required: false,
    },
    tool_call_id: {
      type: String,
      required: false,
    },
    name: {
      type: String, // Used for tool return names
      required: false, 
    }
  },
  {
    timestamps: true,
  }
);

const Message = mongoose.model('Message', messageSchema);
export default Message;
