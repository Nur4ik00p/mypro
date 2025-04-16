import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import multer from "multer"
import { registerValidator, loginValidation, PostCreateValidation } from "./validations/auth.js"
import UserModel from "./models/user.js"
import PostModel from "./models/post.js"
import { PS, uc, checkAdmin } from "./control/index.js"
import checkAuth from "./utils/checkAuth.js"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { dirname } from "path"
import { Server } from "socket.io"
import http from "http"
import MessageModel from "./models/message.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Подключение к MongoDB
mongoose
  .connect(
    "mongodb+srv://dmitry:dmitrykhorov2009@cluster0.rmyvs.mongodb.net/chat?retryWrites=true&w=majority&appName=Cluster0",
    {
      retryWrites: true,
      w: "majority",
    },
  )
  .then(async () => {
    console.log("✅ MongoDB connected")

    // Проверяем и исправляем индексы
    try {
      const collection = mongoose.connection.db.collection("messages")
      const indexes = await collection.indexes()

      // Удаляем проблемный индекс
      const problematicIndex = indexes.find((index) => index.key?.messageId)
      if (problematicIndex) {
        await collection.dropIndex(problematicIndex.name)
        console.log("⚠️ Removed problematic index:", problematicIndex.name)
      }
    } catch (err) {
      console.log("ℹ️ No indexes to fix")
    }
  })
  .catch((err) => console.log("❌ MongoDB connection error:", err))

// Инициализация сервера
const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: ["http://185.189.167.72:3000"],
    methods: ["GET", "POST"],
    credentials: true,
  },
})
// Настройка Multer для загрузки файлов
const storage = multer.diskStorage({
  destination: (_, __, cb) => {
    if (!fs.existsSync("uploads")) {
      fs.mkdirSync("uploads")
    }
    cb(null, "uploads")
  },
  filename: (_, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, uniqueSuffix + ext)
  },
})

const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|gif/
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase())
  const mimetype = filetypes.test(file.mimetype)

  if (extname && mimetype) {
    return cb(null, true)
  }
  cb("Error: Images and GIFs only!")
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
})

// Middleware
app.use(
  cors({
    origin: ["http://185.189.167.72:3000"],
    credentials: true,
  })
)
app.use("/uploads", express.static(path.join(__dirname, "uploads")))

// Socket.IO обработчики
app.get("/api/messages", async (req, res) => {
  try {
    const messages = await MessageModel.find().sort({ createdAt: 1 }).limit(100)
    res.json(messages)
  } catch (err) {
    res.status(500).json({ error: "Server error" })
  }
})

// Обработка Socket.IO соединений
io.on("connection", async (socket) => {
  console.log("🔌 New client connected")

  // Отправляем историю сообщений
  const messages = await MessageModel.find().sort({ createdAt: -1 }).limit(50)
  socket.emit("messageHistory", messages.reverse())

  // Обработка нового сообщения
  socket.on("sendMessage", async (data) => {
    try {
      const newMessage = new MessageModel({
        user: data.userName,
        text: data.text,
        avatarColor: data.avatarColor,
      })

      const savedMessage = await newMessage.save()

      io.emit("receiveMessage", {
        _id: savedMessage._id,
        user: savedMessage.user,
        text: savedMessage.text,
        avatarColor: savedMessage.avatarColor,
        createdAt: savedMessage.createdAt,
      })
    } catch (err) {
      console.error("Error saving message:", err)
      // Попытка повторного сохранения без проблемного поля
      if (err.code === 11000) {
        try {
          const fixedMessage = new MessageModel({
            user: data.userName,
            text: data.text,
            avatarColor: data.avatarColor,
            messageId: mongoose.Types.ObjectId(), // Генерируем новый ID
          })
          await fixedMessage.save()
        } catch (retryErr) {
          console.error("Retry failed:", retryErr)
        }
      }
    }
  })

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected")
  })
})

// ====================== Роуты API ======================

// Проверка работы сервера
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    socket: io.engine.clientsCount > 0 ? "connected" : "disconnected",
  })
})

app.patch(
  "/users/:id",
  checkAuth,
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "cover", maxCount: 1 },
  ]),
  uc.updateUser,
)
app.post("/auth/login", loginValidation, uc.login)
app.post(
  "/auth/register",
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "cover", maxCount: 1 },
  ]),
  registerValidator,
  uc.register,
)
app.get("/auth/me", checkAuth, uc.getMe)
app.patch(
  "/users/:id",
  checkAuth,
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "cover", maxCount: 1 },
  ]),
  uc.updateUser,
)
app.get("/posts", PS.getAll)
app.get("/posts/tags", PS.tagsAll)
app.get("/tags", PS.tagsAll)
app.get("/posts/similar/:id", PS.getPostsBySameTitle)
app.post("/posts", checkAuth, PostCreateValidation, PS.create)
app.post("/posts/like/:id", checkAuth, PS.likePost)
app.post("/posts/dislike/:id", checkAuth, PS.dislikePost)
app.delete("/posts/reaction/:id", checkAuth, PS.removeReaction)
app.get("/posts/reaction/:id", checkAuth, PS.checkUserReaction)
app.get("/posts/user/:userId", PS.getPostsByUser)
app.get("/posts/:id", PS.getOne)
app.patch("/posts/:id", checkAuth, PS.update)
app.delete("/posts/:id", checkAuth, PS.remove)
app.post("/upload", checkAuth, upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded or invalid file type" })
  }

  UserModel.findByIdAndUpdate(req.userId, {
    $push: {
      activityLog: {
        action: "file_upload",
        details: {
          filename: req.file.filename,
          size: req.file.size,
        },
      },
    },
  }).catch(console.error)

  res.json({
    url: `/uploads/${req.file.filename}`,
  })
})

app.post("/users/request-verification", checkAuth, upload.array("documents", 3), uc.requestVerification)
app.post("/users/verify", checkAuth, uc.verifyUser)

// Роуты для избранного
app.post("/users/favorites", checkAuth, uc.addToFavorites)
app.delete("/users/favorites/:postId", checkAuth, uc.removeFromFavorites)
app.get("/users/favorites", checkAuth, uc.getFavorites)

// Админские роуты
app.get("/admin/stats", checkAuth, checkAdmin, async (req, res) => {
  try {
    const usersCount = await UserModel.countDocuments()
    const postsCount = await PostModel.countDocuments()

    res.json({
      success: true,
      stats: { usersCount, postsCount },
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Ошибка загрузки статистики",
    })
  }
})

app.get("/admin/users", checkAuth, checkAdmin, async (req, res) => {
  try {
    const users = await UserModel.find().select("-passwordHash -__v -verificationCode").lean()

    res.json({
      success: true,
      users,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({
      success: false,
      message: "Ошибка при получении пользователей",
    })
  }
})
app.patch("/admin/users/:id/account-type", checkAuth, checkAdmin, async (req, res) => {
  try {
    const { accountType } = req.body
    if (!["user", "verified_user", "shop", "admin"].includes(accountType)) {
      return res.status(400).json({
        success: false,
        message: "Неверный тип аккаунта",
      })
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      req.params.id,
      {
        accountType,
        verified: accountType === "user" ? "unverified" : "verified",
      },
      { new: true },
    ).select("-passwordHash -__v -verificationCode")

    res.json({
      success: true,
      user: updatedUser,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({
      success: false,
      message: "Ошибка при обновлении типа аккаунта",
    })
  }
})
app.post("/admin/verify-account", checkAuth, checkAdmin, uc.approveVerification)
app.post("/admin/reject-verification", checkAuth, checkAdmin, uc.rejectVerification)

// Публичные роуты
app.get("/users/:id", async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id).select("-passwordHash -__v -verificationCode").lean()

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Пользователь не найден",
      })
    }

    // Проверяем подписку
    let isSubscribed = false
    if (req.userId) {
      const currentUser = await UserModel.findById(req.userId)
      isSubscribed = currentUser.subscriptions.includes(req.params.id)
    }

    // Получаем количество подписчиков и подписок
    const followersCount = await UserModel.countDocuments({
      subscriptions: req.params.id,
    })

    const subscriptionsCount = await UserModel.countDocuments({
      followers: req.params.id,
    })

    res.json({
      success: true,
      user,
      isSubscribed,
      followersCount,
      subscriptionsCount,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    })
  }
})
app.post("/users/subscribe/:id", checkAuth, uc.subscribe)
app.delete("/users/unsubscribe/:id", checkAuth, uc.unsubscribe)

// ====================== Обработка ошибок ======================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Not found",
    endpoint: `${req.method} ${req.path}`,
  })
})

app.use((err, req, res, next) => {
  console.error("🔥 Server error:", err.stack)
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  })
})

// ====================== Запуск сервера ======================
const PORT = process.env.PORT || 4001
server.listen(PORT, () => {
  console.log(`\n🚀 Server started on port ${PORT}`)
  console.log(`🔗 HTTP: http://localhost:${PORT}`)
  console.log(`🛰️ Socket.IO: ws://localhost:${PORT}`)
  console.log(`📁 Uploads: http://localhost:${PORT}/uploads`)
})
