import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import { validationResult } from "express-validator"
import fs from "fs"
import UserModel from "../models/user.js"
import PostModel from "../models/post.js"
import { fileURLToPath } from "url"
import path from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
export const login = async (req, res) => {
  try {
    const user = await UserModel.findOne({ email: req.body.email })
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      })
    }

    const isValidPass = await bcrypt.compare(req.body.password, user._doc.passwordHash)
    if (!isValidPass) {
      return res.status(400).json({
        message: "Invalid password",
      })
    }

    const token = jwt.sign({ _id: user._id }, "secret123", { expiresIn: "30d" })

    // Log login activity
    await UserModel.findByIdAndUpdate(user._id, {
      $push: {
        activityLog: {
          action: "login",
          details: { ip: req.ip },
        },
      },
    })

    res.json({ user, token })
  } catch (err) {
    console.error("Login error:", err)
    res.status(500).json({
      message: "Login failed",
    })
  }
}

export const register = async (req, res) => {
  try {
    // Валидация
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      // Удаляем загруженные файлы если есть ошибки валидации
      if (req.files?.avatar) {
        fs.unlinkSync(req.files.avatar[0].path)
      }
      if (req.files?.cover) {
        fs.unlinkSync(req.files.cover[0].path)
      }
      return res.status(400).json({
        errors: errors.array(),
        message: "Некорректные данные при регистрации",
      })
    }

    const { email, password, fullName, about, theme, socialMedia } = req.body

    // Проверка существующего пользователя
    const candidate = await UserModel.findOne({ email })
    if (candidate) {
      // Удаляем загруженные файлы если пользователь уже существует
      if (req.files?.avatar) {
        fs.unlinkSync(req.files.avatar[0].path)
      }
      if (req.files?.cover) {
        fs.unlinkSync(req.files.cover[0].path)
      }
      return res.status(400).json({ message: "Пользователь с таким email уже существует" })
    }

    // Хеширование пароля
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(password, salt)

    // Пути к файлам
    const avatarUrl = req.files?.avatar ? `/uploads/${req.files.avatar[0].filename}` : null
    const coverUrl = req.files?.cover ? `/uploads/${req.files.cover[0].filename}` : null

    // Создание пользователя
    const doc = new UserModel({
      email,
      fullName,
      passwordHash,
      avatarUrl,
      coverUrl,
      about: about || "",
      theme: theme || "light",
      socialMedia: socialMedia || {},
    })

    const user = await doc.save()

    // Генерация токена
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET || "secret123", { expiresIn: "30d" })

    // Логирование активности
    await UserModel.findByIdAndUpdate(user._id, {
      $push: {
        activityLog: {
          action: "registration",
          details: { ip: req.ip },
        },
      },
    })

    res.status(201).json({
      ...user._doc,
      passwordHash: undefined,
      verificationCode: undefined,
      token,
    })
  } catch (err) {
    console.error("Registration error:", err)

    // Удаляем загруженные файлы в случае ошибки
    if (req.files?.avatar) {
      fs.unlinkSync(req.files.avatar[0].path)
    }
    if (req.files?.cover) {
      fs.unlinkSync(req.files.cover[0].path)
    }

    res.status(500).json({
      message: "Не удалось зарегистрироваться. Попробуйте позже.",
      error: err.message,
    })
  }
}

export const getMe = async (req, res) => {
  try {
    const user = await UserModel.findById(req.userId)
      .select("-passwordHash -__v -verificationCode")
      .populate("subscriptions", "fullName avatarUrl verified")
      .populate("followers", "fullName avatarUrl verified")

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      })
    }

    res.json(user)
  } catch (err) {
    console.error(err)
    res.status(500).json({
      message: "Failed to get user data",
    })
  }
}

export const subscribe = async (req, res) => {
  try {
    const userId = req.userId
    const targetUserId = req.params.id

    if (userId === targetUserId) {
      return res.status(400).json({ message: "You can't subscribe to yourself" })
    }

    // Add to subscriptions
    await UserModel.findByIdAndUpdate(userId, {
      $addToSet: { subscriptions: targetUserId },
    })

    // Add to target user's followers
    await UserModel.findByIdAndUpdate(targetUserId, {
      $addToSet: { followers: userId },
    })

    // Log subscription activity
    await UserModel.findByIdAndUpdate(userId, {
      $push: {
        activityLog: {
          action: "subscription",
          details: { targetUserId },
        },
      },
    })

    res.json({ message: "Subscription successful" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Subscription failed" })
  }
}

export const unsubscribe = async (req, res) => {
  try {
    const userId = req.userId
    const targetUserId = req.params.id

    // Remove from subscriptions
    await UserModel.findByIdAndUpdate(userId, {
      $pull: { subscriptions: targetUserId },
    })

    // Remove from target user's followers
    await UserModel.findByIdAndUpdate(targetUserId, {
      $pull: { followers: userId },
    })

    // Log unsubscription activity
    await UserModel.findByIdAndUpdate(userId, {
      $push: {
        activityLog: {
          action: "unsubscription",
          details: { targetUserId },
        },
      },
    })

    res.json({ message: "Unsubscription successful" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Unsubscription failed" })
  }
}

export const getActivity = async (req, res) => {
  try {
    const user = await UserModel.findById(req.userId)
      .select("activityLog -_id")
      .sort({ "activityLog.timestamp": -1 })
      .limit(20)

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json(user.activityLog)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to get activity log" })
  }
}

export const getStats = async (req, res) => {
  try {
    const userCount = await UserModel.countDocuments()
    const postCount = await PostModel.countDocuments()

    res.json({
      users: userCount,
      posts: postCount,
      updatedAt: new Date(),
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to get statistics" })
  }
}

// Запрос на верификацию
export const requestVerification = async (req, res) => {
  try {
    const { accountType } = req.body

    if (!["verified_user", "shop"].includes(accountType)) {
      return res.status(400).json({ message: "Invalid account type" })
    }

    await UserModel.findByIdAndUpdate(req.userId, {
      accountType,
      "verificationData.status": "pending",
      "verificationData.documents": req.files?.map((file) => file.path) || [],
    })

    res.json({
      success: true,
      message: "Verification request submitted for review",
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to request verification" })
  }
}

// Админский метод для подтверждения верификации
export const approveVerification = async (req, res) => {
  try {
    const { userId, accountType } = req.body

    const user = await UserModel.findByIdAndUpdate(userId, {
      accountType,
      "verificationData.status": "verified",
      "verificationData.rejectionReason": null,
    })

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json({
      success: true,
      message: "Account verified successfully",
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to verify account" })
  }
}

// Админский метод для отклонения верификации
export const rejectVerification = async (req, res) => {
  try {
    const { userId, reason } = req.body

    const user = await UserModel.findByIdAndUpdate(userId, {
      "verificationData.status": "rejected",
      "verificationData.rejectionReason": reason,
    })

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json({
      success: true,
      message: "Verification rejected",
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to reject verification" })
  }
}

export const verifyUser = async (req, res) => {
  try {
    const { code } = req.body
    const user = await UserModel.findById(req.userId)

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    if (user.verificationCode !== code) {
      return res.status(400).json({ message: "Invalid verification code" })
    }

    await UserModel.findByIdAndUpdate(req.userId, {
      verified: "verified",
      verificationCode: null,
    })

    res.json({
      success: true,
      message: "Account verified successfully",
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to verify account" })
  }
}

// Добавим новый метод updateUser в экспорты

export const updateUser = async (req, res) => {
  try {
    // Проверка прав доступа
    if (req.userId !== req.params.id) {
      return res.status(403).json({ message: "Недостаточно прав" })
    }

    // Подготовка данных для обновления
    const updateData = {
      fullName: req.body.fullName,
      about: req.body.about || "",
      theme: req.body.theme || "light",
      socialMedia: req.body.socialMedia ? JSON.parse(req.body.socialMedia) : {},
    }

    // Функция для безопасного удаления файла
    const safeDeleteFile = (filePath) => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath)
          console.log(`Файл удалён: ${filePath}`)
        }
      } catch (err) {
        console.error(`Ошибка при удалении файла ${filePath}:`, err)
      }
    }

    // Обработка аватара
    if (req.files?.avatar) {
      const avatar = req.files.avatar[0]

      // Удаление старого аватара
      const user = await UserModel.findById(req.params.id)
      if (user.avatarUrl) {
        const oldAvatarPath = path.join(__dirname, "..", user.avatarUrl)
        safeDeleteFile(oldAvatarPath)
      }

      updateData.avatarUrl = `/uploads/${avatar.filename}`
    } else if (req.body.removeAvatar === "true") {
      // Удаление аватара
      const user = await UserModel.findById(req.params.id)
      if (user.avatarUrl) {
        const oldAvatarPath = path.join(__dirname, "..", user.avatarUrl)
        safeDeleteFile(oldAvatarPath)
      }
      updateData.avatarUrl = null
    }

    // Обработка обложки
    if (req.files?.cover) {
      const cover = req.files.cover[0]

      // Удаление старой обложки
      const user = await UserModel.findById(req.params.id)
      if (user.coverUrl) {
        const oldCoverPath = path.join(__dirname, "..", user.coverUrl)
        safeDeleteFile(oldCoverPath)
      }

      updateData.coverUrl = `/uploads/${cover.filename}`
    } else if (req.body.removeCover === "true") {
      // Удаление обложки
      const user = await UserModel.findById(req.params.id)
      if (user.coverUrl) {
        const oldCoverPath = path.join(__dirname, "..", user.coverUrl)
        safeDeleteFile(oldCoverPath)
      }
      updateData.coverUrl = null
    }

    // Обновление пользователя
    const updatedUser = await UserModel.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).select("-passwordHash -__v -verificationCode")

    if (!updatedUser) {
      return res.status(404).json({ message: "Пользователь не найден" })
    }

    // Логирование активности
    await UserModel.findByIdAndUpdate(req.params.id, {
      $push: {
        activityLog: {
          action: "profile_update",
          details: { fields: Object.keys(updateData) },
          timestamp: new Date(),
        },
      },
    })

    res.json({
      success: true,
      user: updatedUser,
    })
  } catch (err) {
    console.error("Ошибка обновления:", err)

    // Удаление загруженных файлов в случае ошибки
    if (req.files?.avatar) {
      const avatarPath = path.join(__dirname, "..", "uploads", req.files.avatar[0].filename)
      safeDeleteFile(avatarPath)
    }
    if (req.files?.cover) {
      const coverPath = path.join(__dirname, "..", "uploads", req.files.cover[0].filename)
      safeDeleteFile(coverPath)
    }

    // Определение типа ошибки
    let errorMessage = "Ошибка при обновлении профиля"
    let statusCode = 500

    if (err.name === "ValidationError") {
      statusCode = 400
      errorMessage = Object.values(err.errors)
        .map((val) => val.message)
        .join(", ")
    } else if (err.code === "LIMIT_FILE_SIZE") {
      statusCode = 413
      errorMessage = "Размер файла слишком большой (макс. 10MB)"
    }

    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    })
  }
}

export const addToFavorites = async (req, res) => {
  try {
    const { postId } = req.body

    // Проверяем существование поста
    const post = await PostModel.findById(postId)
    if (!post) {
      return res.status(404).json({ message: "Post not found" })
    }

    // Добавляем в избранное, если еще не добавлен
    const user = await UserModel.findByIdAndUpdate(
      req.userId,
      { $addToSet: { favorites: postId } },
      { new: true },
    ).select("favorites")

    // Логируем действие
    await UserModel.findByIdAndUpdate(req.userId, {
      $push: {
        activityLog: {
          action: "add_to_favorites",
          details: { postId },
        },
      },
    })

    res.json({
      success: true,
      favorites: user.favorites,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to add to favorites" })
  }
}

// Удаление поста из избранного
export const removeFromFavorites = async (req, res) => {
  try {
    const { postId } = req.params

    // Удаляем из избранного
    const user = await UserModel.findByIdAndUpdate(req.userId, { $pull: { favorites: postId } }, { new: true }).select(
      "favorites",
    )

    // Логируем действие
    await UserModel.findByIdAndUpdate(req.userId, {
      $push: {
        activityLog: {
          action: "remove_from_favorites",
          details: { postId },
        },
      },
    })

    res.json({
      success: true,
      favorites: user.favorites,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to remove from favorites" })
  }
}

// Получение избранных постов
export const getFavorites = async (req, res) => {
  try {
    const user = await UserModel.findById(req.userId)
      .select("favorites")
      .populate({
        path: "favorites",
        populate: {
          path: "user",
          select: "fullName avatarUrl",
        },
      })

    res.json({
      success: true,
      favorites: user.favorites,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to get favorites" })
  }
}

// Обновим экспорт
export const uc = {
  login,
  register,
  getMe,
  subscribe,
  unsubscribe,
  getActivity,
  getStats,
  requestVerification,
  approveVerification,
  rejectVerification,
  verifyUser,
  updateUser,
  addToFavorites,
  removeFromFavorites,
  getFavorites,
}
