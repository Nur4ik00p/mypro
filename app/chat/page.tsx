"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/AuthProvider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Search } from "lucide-react"
import Link from "next/link"
import { fetchUserSubscriptions } from "@/lib/api"

export default function ChatPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login")
      return
    }

    const loadUsers = async () => {
      try {
        setLoading(true)
        // Загружаем подписки пользователя
        const subscriptions = await fetchUserSubscriptions()
        setUsers(subscriptions)
      } catch (error) {
        console.error("Ошибка загрузки пользователей:", error)
      } finally {
        setLoading(false)
      }
    }

    loadUsers()
  }, [isAuthenticated, router])

  const filteredUsers = users.filter((user) => user.fullName.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-2xl">Сообщения</CardTitle>
          <CardDescription>Общайтесь с пользователями, на которых вы подписаны</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
              <Input
                placeholder="Поиск пользователей..."
                className="pl-10 bg-zinc-950 border-zinc-800"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[150px]" />
                    <Skeleton className="h-3 w-[100px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="space-y-1">
              {filteredUsers.map((user) => (
                <Link
                  key={user._id}
                  href={`/chat/${user._id}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  <Avatar>
                    <AvatarImage
                      src={user.avatarUrl ? `https://demo.soon-night.lol${user.avatarUrl}` : undefined}
                      alt={user.fullName}
                    />
                    <AvatarFallback>{user.fullName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{user.fullName}</p>
                    <p className="text-sm text-zinc-400">
                      {user.verified === "verified" ? "Подтвержденный аккаунт" : "Пользователь"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-zinc-500 mb-4">
                {searchQuery
                  ? "Пользователи не найдены"
                  : "У вас пока нет подписок. Подпишитесь на пользователей, чтобы начать общение."}
              </p>
              {!searchQuery && (
                <Button
                  variant="outline"
                  className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                  onClick={() => router.push("/")}
                >
                  Найти пользователей
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
