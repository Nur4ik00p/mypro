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

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await login(email, password)
      router.push("/")
    } catch (error: any) {
      toast({
        title: "Ошибка входа",
        description: error.message || "Проверьте ваши данные и попробуйте снова",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex justify-center items-center min-h-[80vh]">
      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-2xl">Вход в аккаунт</CardTitle>
          <CardDescription>Введите ваш email и пароль для входа</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@mail.ru"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-zinc-950 border-zinc-800"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-zinc-950 border-zinc-800"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Войти
            </Button>
            <div className="text-center text-sm">
              Нет аккаунта?{" "}
              <Link href="/auth/register" className="text-red-500 hover:underline">
                Зарегистрироваться
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
