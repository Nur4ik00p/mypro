import axios from "axios"

// Изменяем базовый URL API с localhost на ваш домен
const API_URL = "https://demo.soon-night.lol"

// Создаем экземпляр axios с базовым URL
const api = axios.create({
  baseURL: API_URL,
})

// Добавляем перехватчик запросов для добавления токена авторизации
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Обработка ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token")
      window.location.href = "/auth/login"
    }
    return Promise.reject(error)
  },
)

// Аутентификация
export const login = async (email: string, password: string) => {
  try {
    const response = await api.post("/auth/login", { email, password })
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Ошибка входа")
  }
}

export const register = async (userData: any) => {
  try {
    const response = await api.post("/auth/register", userData)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Ошибка регистрации")
  }
}

export const getMe = async () => {
  try {
    const response = await api.get("/auth/me")
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Ошибка получения данных пользователя")
  }
}

// Посты
export const fetchPosts = async () => {
  try {
    const response = await api.get("/posts")
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Ошибка получения постов")
  }
}

export const fetchPost = async (id: string) => {
  try {
    const response = await api.get(`/posts/${id}`)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Ошибка получения поста")
  }
}

export const createPost = async (postData: any) => {
  try {
    const response = await api.post("/posts", postData)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Ошибка создания поста")
  }
}

export const updatePost = async (id: string, postData: any) => {
  try {
    const response = await api.patch(`/posts/${id}`, postData)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Ошибка обновления поста")
  }
}

export const deletePost = async (id: string) => {
  try {
    const response = await api.delete(`/posts/${id}`)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Ошибка удаления поста")
  }
}

export const likePost = async (id: string) => {
  try {
    const response = await api.post(`/posts/like/${id}`)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Ошибка при лайке поста")
  }
}

export const dislikePost = async (id: string) => {
  try {
    const response = await api.post(`/posts/dislike/${id}`)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Ошибка при дизлайке поста")
  }
}

export const removeReaction = async (id: string) => {
  try {
    const response = await api.delete(`/posts/reaction/${id}`)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Ошибка при удалении реакции")
  }
}

export const fetchTags = async () => {
  try {
    const response = await api.get("/tags")
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Ошибка получения тегов")
  }
}

// Пользователи
export const fetchUserProfile = async (id: string) => {
  try {
    const response = await api.get(`/users/${id}`)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Ошибка получения профиля пользователя")
  }
}

export const fetchUserPosts = async (userId: string) => {
  try {
    const response = await api.get(`/posts/user/${userId}`)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Ошибка получения постов пользователя")
  }
}

export const updateProfile = async (id: string, userData: FormData) => {
  try {
    const response = await api.patch(`/users/${id}`, userData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Ошибка обновления профиля")
  }
}

export const uploadImage = async (file: File) => {
  try {
    const formData = new FormData()
    formData.append("image", file)

    const response = await api.post("/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Ошибка загрузки изображения")
  }
}

export const subscribe = async (userId: string) => {
  try {
    const response = await api.post(`/users/subscribe/${userId}`)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Ошибка при подписке")
  }
}

export const unsubscribe = async (userId: string) => {
  try {
    const response = await api.delete(`/users/unsubscribe/${userId}`)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Ошибка при отписке")
  }
}

export const fetchUserSubscriptions = async () => {
  try {
    const userData = await getMe()
    return userData.subscriptions || []
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Ошибка получения подписок")
  }
}

// Избранное
export const addToFavorites = async (postId: string) => {
  try {
    const response = await api.post("/users/favorites", { postId })
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Ошибка добавления в избранное")
  }
}

export const removeFromFavorites = async (postId: string) => {
  try {
    const response = await api.delete(`/users/favorites/${postId}`)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Ошибка удаления из избранного")
  }
}

export const fetchFavorites = async () => {
  try {
    const response = await api.get("/users/favorites")
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Ошибка получения избранного")
  }
}
