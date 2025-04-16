"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/AuthProvider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft } from "lucide-react"
import { fetchFavorites } from "@/lib/api"
import PostCard from "@/components/posts/PostCard"

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login")
      return
    }

    const loadFavorites = async () => {
      try {
        setLoading(true)
        const data = await fetchFavorites()
        setFavorites(data.favorites)
      } catch (error) {
        console.error("Ошибка загрузки избранного:", error)
      } finally {
        setLoading(false)
      }
    }

    loadFavorites()
  }, [isAuthenticated, router])

  return (
    <div className="max-w-3xl mx-auto">
      <Button variant="ghost" className="mb-4" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Назад
      </Button>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-2xl">Избранное</CardTitle>
          <CardDescription>Посты, которые вы добавили в избранное</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 space-y-4">
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[150px]" />
                      <Skeleton className="h-3 w-[100px]" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-[200px] w-full rounded-md" />
                </div>
              ))}
            </div>
          ) : favorites.length > 0 ? (
            <div className="space-y-6">
              {favorites.map((post) => (
                <PostCard key={post._id} post={post} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-zinc-500 mb-4">У вас пока нет избранных постов</p>
              <Button
                variant="outline"
                className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                onClick={() => router.push("/")}
              >
                Перейти к ленте
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
