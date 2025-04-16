import mongoose from "mongoose"

const UserSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    // В UserSchema добавьте:
    favorites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
      },
    ],
    passwordHash: {
      type: String,
      required: true,
    },
    avatarUrl: String,
    coverUrl: String, // Новое поле для обложки профиля
    about: {
      // Информация "о себе"
      type: String,
      default: "",
      maxlength: 500,
    },
    theme: {
      // Тема профиля
      type: String,
      enum: ["light", "dark", "blue", "green", "purple"],
      default: "dark",
    },
    socialMedia: {
      // Соцсети пользователя
      twitter: String,
      instagram: String,
      facebook: String,
      telegram: String,
      vk: String,
      website: String,
    },
    accountType: {
      type: String,
      enum: ["user", "verified_user", "shop", "admin"],
      default: "user",
    },
    verified: {
      type: String,
      enum: ["unverified", "pending", "verified"],
      default: "unverified",
    },
    verificationCode: {
      type: String,
      default: null,
    },
    subscriptions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    posts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
      },
    ],
    activityLog: [
      {
        action: String,
        details: Object,
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.passwordHash
        delete ret.__v
        delete ret.verificationCode
        return ret
      },
    },
  },
)

UserSchema.virtual("profileUrl").get(function () {
  return `/users/${this._id}`
})

export default mongoose.model("User", UserSchema)
