"use client"

import { useEffect, useState } from "react"
import PostCard from "@/components/posts/PostCard"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/components/auth/AuthProvider"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import Link from "next/link"
import { fetchPosts, fetchTags } from "@/lib/api"
import TagCloud from "@/components/posts/TagCloud"
import { useRouter } from "next/navigation"

export default function Home() {
  const [posts, setPosts] = useState<any[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const postsData = await fetchPosts()
        const tagsData = await fetchTags()
        setPosts(postsData)
        setTags(tagsData)
      } catch (error) {
        console.error("Ошибка загрузки данных:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Лента</h1>
          {isAuthenticated && (
            <Button
              variant="outline"
              className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
              onClick={() => router.push("/posts/create")}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Создать пост
            </Button>
          )}
        </div>

        <Tabs defaultValue="new" className="mb-6">
          <TabsList className="bg-zinc-900 border border-zinc-800">
            <TabsTrigger value="new">Новые</TabsTrigger>
            <TabsTrigger value="popular">Популярные</TabsTrigger>
            {isAuthenticated && <TabsTrigger value="subscriptions">Подписки</TabsTrigger>}
          </TabsList>
          <TabsContent value="new" className="mt-4">
            {loading ? (
              <PostsLoadingSkeleton />
            ) : posts.length > 0 ? (
              <div className="space-y-6">
                {posts.map((post) => (
                  <PostCard key={post._id} post={post} />
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-zinc-500">Постов пока нет</p>
              </div>
            )}
          </TabsContent>
          <TabsContent value="popular" className="mt-4">
            {loading ? (
              <PostsLoadingSkeleton />
            ) : posts.length > 0 ? (
              <div className="space-y-6">
                {[...posts]
                  .sort((a, b) => b.viewsCount - a.viewsCount)
                  .map((post) => (
                    <PostCard key={post._id} post={post} />
                  ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-zinc-500">Постов пока нет</p>
              </div>
            )}
          </TabsContent>
          {isAuthenticated && (
            <TabsContent value="subscriptions" className="mt-4">
              {loading ? (
                <PostsLoadingSkeleton />
              ) : posts.length > 0 ? (
                <div className="space-y-6">
                  {posts
                    .filter((post) => user?.subscriptions?.some((sub: any) => sub._id === post.user._id))
                    .map((post) => (
                      <PostCard key={post._id} post={post} />
                    ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-zinc-500">Постов пока нет</p>
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>

      <div className="space-y-6">
        {!isAuthenticated && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <h2 className="text-lg font-medium mb-4">Присоединяйтесь к нам</h2>
            <div className="space-y-2">
              <Link href="/auth/login">
                <Button className="w-full bg-red-600 hover:bg-red-700">Войти</Button>
              </Link>
              <Link href="/auth/register">
                <Button
                  variant="outline"
                  className="w-full border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                >
                  Регистрация
                </Button>
              </Link>
            </div>
          </div>
        )}

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <h2 className="text-lg font-medium mb-4">Популярные теги</h2>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
          ) : (
            <TagCloud tags={tags} />
          )}
        </div>
      </div>
    </div>
  )
}

function PostsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-4">
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
  )
}
