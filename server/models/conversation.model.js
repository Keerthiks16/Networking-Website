import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    messages: [
      {
        sender: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        content: {
          type: String,
          required: true,
          trim: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        readBy: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
        ],
        isSystemMessage: {
          type: Boolean,
          default: false,
        },
      },
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    isGroupChat: {
      type: Boolean,
      default: false,
    },
    groupName: {
      type: String,
      trim: true,
      // Only required if isGroupChat is true
    },
    groupAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // Only required if isGroupChat is true
    },
  },
  {
    timestamps: true,
  }
);

// Add validation to require groupName and groupAdmin for group chats
conversationSchema.pre("save", function (next) {
  if (this.isGroupChat && (!this.groupName || !this.groupAdmin)) {
    const error = new Error("Group chats require a name and admin");
    return next(error);
  }
  next();
});

// Indexes for better query performance
conversationSchema.index({ participants: 1 });
conversationSchema.index({ isGroupChat: 1 });
conversationSchema.index({ groupAdmin: 1 });

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;
