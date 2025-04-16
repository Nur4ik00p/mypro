import PostModel from "../models/post.js"
import UserModel from "../models/user.js"

// Вспомогательные функции для работы с реакциями
const ensureReactionStructure = async (postId) => {
  const post = await PostModel.findById(postId)
  if (!post) return null

  let needsUpdate = false
  const update = {}

  // Проверяем и нормализуем лайки
  if (Array.isArray(post.likes)) {
    update.likes = {
      count: post.likes.length,
      users: post.likes,
    }
    needsUpdate = true
  } else if (!post.likes || typeof post.likes !== "object") {
    update.likes = { count: 0, users: [] }
    needsUpdate = true
  }

  // Проверяем и нормализуем дизлайки
  if (Array.isArray(post.dislikes)) {
    update.dislikes = {
      count: post.dislikes.length,
      users: post.dislikes,
    }
    needsUpdate = true
  } else if (!post.dislikes || typeof post.dislikes !== "object") {
    update.dislikes = { count: 0, users: [] }
    needsUpdate = true
  }

  if (needsUpdate) {
    return await PostModel.findByIdAndUpdate(postId, { $set: update }, { new: true })
  }

  return post
}

// Создание поста
export const create = async (req, res) => {
  try {
    const doc = new PostModel({
      title: req.body.title,
      text: req.body.text,
      imageUrl: req.body.imageUrl,
      tags: req.body.tags || [],
      user: req.userId,
    })

    const post = await doc.save()

    await UserModel.findByIdAndUpdate(req.userId, {
      $push: {
        posts: post._id,
        activityLog: {
          action: "post_created",
          details: { postId: post._id, title: post.title },
        },
      },
    })

    res.json(post)
  } catch (err) {
    console.error("Error creating post:", err)
    res.status(500).json({
      message: "Failed to create post",
      error: err.message,
    })
  }
}

// Получение всех постов
export const getAll = async (req, res) => {
  try {
    const posts = await PostModel.find().populate("user", "fullName avatarUrl profileUrl").exec()

    // Добавляем информацию об избранном для аутентифицированных пользователей
    if (req.userId) {
      const user = await UserModel.findById(req.userId).select("favorites")
      const postsWithFavorites = posts.map((post) => ({
        ...post.toObject(),
        isFavorite: user.favorites.some((favId) => favId.equals(post._id)),
      }))
      return res.json(postsWithFavorites)
    }

    res.json(posts)
  } catch (err) {
    console.error("Error getting posts:", err)
    res.status(500).json({
      message: "Failed to get posts",
      error: err.message,
    })
  }
}

// Получение одного поста
export const getOne = async (req, res) => {
  try {
    const postId = req.params.id

    // Нормализуем структуру перед получением
    await ensureReactionStructure(postId)

    const post = await PostModel.findOneAndUpdate({ _id: postId }, { $inc: { viewsCount: 1 } }, { new: true }).populate(
      "user",
      "fullName avatarUrl profileUrl",
    )

    if (!post) {
      return res.status(404).json({ message: "Post not found" })
    }

    // Проверяем реакцию текущего пользователя
    let userReaction = null
    let isFavorite = false
    if (req.userId) {
      const user = await UserModel.findById(req.userId)

      if (post.likes.users.some((user) => user.equals(req.userId))) {
        userReaction = "like"
      } else if (post.dislikes.users.some((user) => user.equals(req.userId))) {
        userReaction = "dislike"
      }

      isFavorite = user.favorites.some((favId) => favId.equals(post._id))
    }

    res.json({
      ...post.toObject(),
      userReaction,
      likesCount: post.likes.count,
      dislikesCount: post.dislikes.count,
      isFavorite,
    })
  } catch (err) {
    console.error("Error getting post:", err)
    res.status(500).json({
      message: "Failed to get post",
      error: err.message,
    })
  }
}

// Удаление поста
export const remove = async (req, res) => {
  try {
    const postId = req.params.id
    const post = await PostModel.findOneAndDelete({ _id: postId })

    if (!post) {
      return res.status(404).json({ message: "Post not found" })
    }

    // Удаляем пост из избранного у всех пользователей
    await UserModel.updateMany({ favorites: postId }, { $pull: { favorites: postId } })

    await UserModel.findByIdAndUpdate(post.user, {
      $pull: { posts: postId },
      $push: {
        activityLog: {
          action: "post_deleted",
          details: { postId, title: post.title },
        },
      },
    })

    res.json({ success: true, message: "Post deleted" })
  } catch (err) {
    console.error("Error deleting post:", err)
    res.status(500).json({
      message: "Failed to delete post",
      error: err.message,
    })
  }
}

// Обновление поста
export const update = async (req, res) => {
  try {
    const postId = req.params.id
    await PostModel.updateOne(
      { _id: postId },
      {
        title: req.body.title,
        text: req.body.text,
        imageUrl: req.body.imageUrl,
        tags: req.body.tags,
        user: req.userId,
      },
    )

    await UserModel.findByIdAndUpdate(req.userId, {
      $push: {
        activityLog: {
          action: "post_updated",
          details: { postId },
        },
      },
    })

    res.json({ success: true, message: "Post updated" })
  } catch (err) {
    console.error("Error updating post:", err)
    res.status(500).json({
      message: "Failed to update post",
      error: err.message,
    })
  }
}

// Получение постов пользователя
export const getPostsByUser = async (req, res) => {
  try {
    const posts = await PostModel.find({ user: req.params.userId })
      .populate("user", "fullName avatarUrl profileUrl")
      .exec()

    // Добавляем информацию об избранном для аутентифицированных пользователей
    if (req.userId) {
      const user = await UserModel.findById(req.userId).select("favorites")
      const postsWithFavorites = posts.map((post) => ({
        ...post.toObject(),
        isFavorite: user.favorites.some((favId) => favId.equals(post._id)),
      }))
      return res.json(postsWithFavorites)
    }

    res.json(posts)
  } catch (err) {
    console.error("Error getting user posts:", err)
    res.status(500).json({
      message: "Failed to get user posts",
      error: err.message,
    })
  }
}

// Получение популярных тегов
export const tagsAll = async (req, res) => {
  try {
    const posts = await PostModel.find().limit(5).exec()
    const tags = posts.flatMap((post) => post.tags).slice(0, 5)
    res.json(tags)
  } catch (err) {
    console.error("Error getting tags:", err)
    res.status(500).json({
      message: "Failed to get tags",
      error: err.message,
    })
  }
}

// Получение похожих постов
export const getPostsBySameTitle = async (req, res) => {
  try {
    const post = await PostModel.findById(req.params.id)
    if (!post) {
      return res.status(404).json({ message: "Post not found" })
    }

    const posts = await PostModel.find({
      title: post.title,
      _id: { $ne: post._id },
    }).populate("user", "fullName avatarUrl profileUrl")

    // Добавляем информацию об избранном для аутентифицированных пользователей
    if (req.userId) {
      const user = await UserModel.findById(req.userId).select("favorites")
      const postsWithFavorites = posts.map((post) => ({
        ...post.toObject(),
        isFavorite: user.favorites.some((favId) => favId.equals(post._id)),
      }))
      return res.json(postsWithFavorites)
    }

    res.json(posts)
  } catch (err) {
    console.error("Error getting similar posts:", err)
    res.status(500).json({
      message: "Failed to get similar posts",
      error: err.message,
    })
  }
}

// Лайк поста
export const likePost = async (req, res) => {
  try {
    const postId = req.params.id
    const userId = req.userId

    // Нормализуем структуру реакций
    const post = await ensureReactionStructure(postId)
    if (!post) {
      return res.status(404).json({ message: "Post not found" })
    }

    // Проверяем, не поставил ли пользователь уже лайк
    if (post.likes.users.some((user) => user.equals(userId))) {
      return res.status(400).json({ message: "You already liked this post" })
    }

    // Удаляем из дизлайков, если был там
    if (post.dislikes.users.some((user) => user.equals(userId))) {
      await PostModel.findByIdAndUpdate(postId, {
        $pull: { "dislikes.users": userId },
        $inc: { "dislikes.count": -1 },
      })
    }

    // Добавляем лайк
    const updatedPost = await PostModel.findByIdAndUpdate(
      postId,
      {
        $addToSet: { "likes.users": userId },
        $inc: { "likes.count": 1 },
      },
      { new: true },
    ).populate("user", "fullName avatarUrl profileUrl")

    // Логируем действие
    await UserModel.findByIdAndUpdate(userId, {
      $push: {
        activityLog: {
          action: "post_liked",
          details: { postId, title: post.title || "Untitled Post" },
        },
      },
    })

    res.json({
      success: true,
      post: updatedPost,
      likesCount: updatedPost.likes.count,
      dislikesCount: updatedPost.dislikes.count,
    })
  } catch (err) {
    console.error("Error liking post:", err)
    res.status(500).json({
      message: "Failed to like post",
      error: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    })
  }
}

// Дизлайк поста
export const dislikePost = async (req, res) => {
  try {
    const postId = req.params.id
    const userId = req.userId

    // Нормализуем структуру реакций
    const post = await ensureReactionStructure(postId)
    if (!post) {
      return res.status(404).json({ message: "Post not found" })
    }

    // Проверяем, не поставил ли пользователь уже дизлайк
    if (post.dislikes.users.some((user) => user.equals(userId))) {
      return res.status(400).json({ message: "You already disliked this post" })
    }

    // Удаляем из лайков, если был там
    if (post.likes.users.some((user) => user.equals(userId))) {
      await PostModel.findByIdAndUpdate(postId, {
        $pull: { "likes.users": userId },
        $inc: { "likes.count": -1 },
      })
    }

    // Добавляем дизлайк
    const updatedPost = await PostModel.findByIdAndUpdate(
      postId,
      {
        $addToSet: { "dislikes.users": userId },
        $inc: { "dislikes.count": 1 },
      },
      { new: true },
    ).populate("user", "fullName avatarUrl profileUrl")

    // Логируем действие
    await UserModel.findByIdAndUpdate(userId, {
      $push: {
        activityLog: {
          action: "post_disliked",
          details: { postId, title: post.title || "Untitled Post" },
        },
      },
    })

    res.json({
      success: true,
      post: updatedPost,
      likesCount: updatedPost.likes.count,
      dislikesCount: updatedPost.dislikes.count,
    })
  } catch (err) {
    console.error("Error disliking post:", err)
    res.status(500).json({
      message: "Failed to dislike post",
      error: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    })
  }
}

// Удаление реакции
export const removeReaction = async (req, res) => {
  try {
    const postId = req.params.id
    const userId = req.userId

    // Нормализуем структуру реакций
    const post = await ensureReactionStructure(postId)
    if (!post) {
      return res.status(404).json({ message: "Post not found" })
    }

    let update = {}
    let action = ""
    let reactionRemoved = false

    // Проверяем и удаляем лайк
    if (post.likes.users.some((user) => user.equals(userId))) {
      update = {
        $pull: { "likes.users": userId },
        $inc: { "likes.count": -1 },
      }
      action = "post_like_removed"
      reactionRemoved = true
    }
    // Проверяем и удаляем дизлайк
    else if (post.dislikes.users.some((user) => user.equals(userId))) {
      update = {
        $pull: { "dislikes.users": userId },
        $inc: { "dislikes.count": -1 },
      }
      action = "post_dislike_removed"
      reactionRemoved = true
    }

    if (!reactionRemoved) {
      return res.status(400).json({ message: "No reaction to remove" })
    }

    const updatedPost = await PostModel.findByIdAndUpdate(postId, update, { new: true }).populate(
      "user",
      "fullName avatarUrl profileUrl",
    )

    // Логируем действие
    await UserModel.findByIdAndUpdate(userId, {
      $push: {
        activityLog: {
          action,
          details: { postId, title: post.title || "Untitled Post" },
        },
      },
    })

    res.json({
      success: true,
      post: updatedPost,
      likesCount: updatedPost.likes.count,
      dislikesCount: updatedPost.dislikes.count,
    })
  } catch (err) {
    console.error("Error removing reaction:", err)
    res.status(500).json({
      message: "Failed to remove reaction",
      error: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    })
  }
}

// Проверка реакции пользователя
export const checkUserReaction = async (req, res) => {
  try {
    const postId = req.params.id
    const userId = req.userId

    // Нормализуем структуру реакций
    const post = await ensureReactionStructure(postId)
    if (!post) {
      return res.status(404).json({ message: "Post not found" })
    }

    let reaction = null
    if (post.likes.users.some((user) => user.equals(userId))) {
      reaction = "like"
    } else if (post.dislikes.users.some((user) => user.equals(userId))) {
      reaction = "dislike"
    }

    res.json({
      reaction,
      likesCount: post.likes.count,
      dislikesCount: post.dislikes.count,
    })
  } catch (err) {
    console.error("Error checking user reaction:", err)
    res.status(500).json({
      message: "Failed to check user reaction",
      error: err.message,
    })
  }
}
