import mongoose from "mongoose"

const messageSchema = new mongoose.Schema({
  user: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  avatarColor: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

export default mongoose.model("Message", messageSchema)
