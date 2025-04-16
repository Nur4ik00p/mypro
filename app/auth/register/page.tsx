"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/AuthProvider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    about: "",
  })
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await register(formData)
      toast({
        title: "Регистрация успешна",
        description: "Добро пожаловать в нашу социальную сеть!",
      })
      router.push("/")
    } catch (error: any) {
      toast({
        title: "Ошибка регистрации",
        description: error.message || "Проверьте ваши данные и попробуйте снова",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex justify-center items-center py-8">
      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-2xl">Регистрация</CardTitle>
          <CardDescription>Создайте новый аккаунт для доступа к платформе</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Полное имя</Label>
              <Input
                id="fullName"
                name="fullName"
                placeholder="Иван Иванов"
                value={formData.fullName}
                onChange={handleChange}
                required
                className="bg-zinc-950 border-zinc-800"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="example@mail.ru"
                value={formData.email}
                onChange={handleChange}
                required
                className="bg-zinc-950 border-zinc-800"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={5}
                className="bg-zinc-950 border-zinc-800"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="about">О себе</Label>
              <Textarea
                id="about"
                name="about"
                placeholder="Расскажите немного о себе..."
                value={formData.about}
                onChange={handleChange}
                className="bg-zinc-950 border-zinc-800"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Зарегистрироваться
            </Button>
            <div className="text-center text-sm">
              Уже есть аккаунт?{" "}
              <Link href="/auth/login" className="text-red-500 hover:underline">
                Войти
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
