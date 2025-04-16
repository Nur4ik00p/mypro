import { body } from "express-validator"

export const registerValidator = [
  body("email", "Неверный формат почты").isEmail(),
  body("password", "Пароль должен быть минимум 5 символов").isLength({ min: 5 }),
  body("fullName", "Укажите имя (минимум 3 символа)").isLength({ min: 3 }),
  body("about", "Описание не должно превышать 500 символов").optional().isLength({ max: 500 }),
  body("theme", "Недопустимая тема").optional().isIn(["light", "dark", "blue", "green", "purple"]),
  body("socialMedia.twitter").optional().isURL(),
  body("socialMedia.instagram").optional().isURL(),
  body("socialMedia.facebook").optional().isURL(),
  body("socialMedia.telegram").optional().isString(),
  body("socialMedia.vk").optional().isURL(),
  body("socialMedia.website").optional().isURL(),
]
export const loginValidation = [
  body("email").isEmail().withMessage("Invalid email"),
  body("password").isLength({ min: 5 }).withMessage("Password must be at least 5 characters"),
]

export const PostCreateValidation = [
  body("title").isLength({ min: 10 }).withMessage("Title must be at least 10 characters").isString(),
  body("text").isLength({ min: 5 }).withMessage("Text must be at least 5 characters").isString(),
  body("tags").optional().isArray(),
  body("imageUrl").optional().isString(),
]
