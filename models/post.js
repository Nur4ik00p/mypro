import mongoose from "mongoose"

const PostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
      unique: true,
    },
    tags: {
      type: [String],
      required: true,
    },
    viewsCount: {
      type: Number,
      default: 0,
    },
    likes: {
      type: {
        count: { type: Number, default: 0 },
        users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      },
      default: { count: 0, users: [] },
    },
    dislikes: {
      type: {
        count: { type: Number, default: 0 },
        users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      },
      default: { count: 0, users: [] },
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    imageUrl: String,
  },
  {
    timestamps: true,
  },
)

// Добавляем middleware для нормализации данных при загрузке
PostSchema.post("init", (doc) => {
  if (Array.isArray(doc.likes)) {
    doc.likes = {
      count: doc.likes.length,
      users: doc.likes,
    }
  }
  if (Array.isArray(doc.dislikes)) {
    doc.dislikes = {
      count: doc.dislikes.length,
      users: doc.dislikes,
    }
  }
})

export default mongoose.model("Post", PostSchema)
