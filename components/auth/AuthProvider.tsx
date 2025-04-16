"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { login as apiLogin, register as apiRegister, getMe } from "@/lib/api"

interface AuthContextType {
  user: any
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (userData: any) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token")
      if (token) {
        try {
          const userData = await getMe()
          setUser(userData)
          setIsAuthenticated(true)
        } catch (error) {
          console.error("Ошибка аутентификации:", error)
          localStorage.removeItem("token")
        }
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const { token, user } = await apiLogin(email, password)
      localStorage.setItem("token", token)
      setUser(user)
      setIsAuthenticated(true)
    } catch (error) {
      throw error
    }
  }

  const register = async (userData: any) => {
    try {
      const { token, ...user } = await apiRegister(userData)
      localStorage.setItem("token", token)
      setUser(user)
      setIsAuthenticated(true)
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem("token")
    setUser(null)
    setIsAuthenticated(false)
    router.push("/auth/login")
  }

  const refreshUser = async () => {
    try {
      const userData = await getMe()
      setUser(userData)
      return userData
    } catch (error) {
      console.error("Ошибка обновления данных пользователя:", error)
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
