import UserModel from "../models/user.js"

export const checkAdmin = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.userId)

    if (!user || user.accountType !== "admin") {
      return res.status(403).json({
        message: "Доступ запрещен. Требуются права администратора.",
      })
    }

    next()
  } catch (err) {
    console.error("Admin check error:", err)
    res.status(500).json({ message: "Ошибка проверки прав доступа" })
  }
}
