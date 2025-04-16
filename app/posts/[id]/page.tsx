"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { fetchPost, likePost, dislikePost, removeReaction, addToFavorites, removeFromFavorites } from "@/lib/api"
import { useAuth } from "@/components/auth/AuthProvider"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { formatDate } from "@/lib/utils"
import Link from "next/link"
import { ArrowLeft, Bookmark, Edit, Heart, MessageSquare, ThumbsDown, Trash } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { deletePost } from "@/lib/api"

export default function PostPage() {
  const { id } = useParams<{ id: string }>()
  const [post, setPost] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const loadPost = async () => {
      try {
        setLoading(true)
        const data = await fetchPost(id as string)
        setPost(data)
      } catch (error) {
        console.error("Ошибка загрузки поста:", error)
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить пост",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      loadPost()
    }
  }, [id, toast])

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Требуется авторизация",
        description: "Войдите или зарегистрируйтесь, чтобы оценивать посты",
        variant: "destructive",
      })
      return
    }

    try {
      if (post.userReaction === "like") {
        const response = await removeReaction(post._id)
        setPost({ ...post, userReaction: null, likesCount: response.likesCount, dislikesCount: response.dislikesCount })
      } else {
        const response = await likePost(post._id)
        setPost({
          ...post,
          userReaction: "like",
          likesCount: response.likesCount,
          dislikesCount: response.dislikesCount,
        })
      }
    } catch (error) {
      console.error("Ошибка при лайке:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось выполнить действие",
        variant: "destructive",
      })
    }
  }

  const handleDislike = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Требуется авторизация",
        description: "Войдите или зарегистрируйтесь, чтобы оценивать посты",
        variant: "destructive",
      })
      return
    }

    try {
      if (post.userReaction === "dislike") {
        const response = await removeReaction(post._id)
        setPost({ ...post, userReaction: null, likesCount: response.likesCount, dislikesCount: response.dislikesCount })
      } else {
        const response = await dislikePost(post._id)
        setPost({
          ...post,
          userReaction: "dislike",
          likesCount: response.likesCount,
          dislikesCount: response.dislikesCount,
        })
      }
    } catch (error) {
      console.error("Ошибка при дизлайке:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось выполнить действие",
        variant: "destructive",
      })
    }
  }

  const handleFavorite = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Требуется авторизация",
        description: "Войдите или зарегистрируйтесь, чтобы добавлять в избранное",
        variant: "destructive",
      })
      return
    }

    try {
      if (post.isFavorite) {
        await removeFromFavorites(post._id)
        setPost({ ...post, isFavorite: false })
        toast({
          title: "Успешно",
          description: "Пост удален из избранного",
        })
      } else {
        await addToFavorites(post._id)
        setPost({ ...post, isFavorite: true })
        toast({
          title: "Успешно",
          description: "Пост добавлен в избранное",
        })
      }
    } catch (error) {
      console.error("Ошибка при работе с избранным:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось выполнить действие",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async () => {
    try {
      await deletePost(post._id)
      toast({
        title: "Успешно",
        description: "Пост удален",
      })
      router.push("/")
    } catch (error) {
      console.error("Ошибка при удалении поста:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось удалить пост",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <PostSkeleton />
  }

  if (!post) {
    return (
      <div className="text-center py-10">
        <h1 className="text-2xl font-bold mb-4">Пост не найден</h1>
        <Button variant="outline" onClick={() => router.push("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Вернуться на главную
        </Button>
      </div>
    )
  }

  const isAuthor = isAuthenticated && user?._id === post.user?._id

  return (
    <div className="max-w-3xl mx-auto">
      <Button variant="ghost" className="mb-4" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Назад
      </Button>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <Link href={`/profile/${post.user?._id}`} className="flex items-center gap-2">
              <Avatar>
                <AvatarImage
                  src={post.user?.avatarUrl ? `https://demo.soon-night.lol${post.user.avatarUrl}` : undefined}
                  alt={post.user?.fullName}
                />
                <AvatarFallback>{post.user?.fullName?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{post.user?.fullName}</p>
                <p className="text-sm text-zinc-400">{formatDate(post.createdAt)}</p>
              </div>
            </Link>

            {isAuthor && (
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => router.push(`/posts/edit/${post._id}`)}>
                  <Edit className="h-4 w-4" />
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Trash className="h-4 w-4 text-red-500" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-zinc-900 border-zinc-800">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Удалить пост?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Это действие нельзя отменить. Пост будет навсегда удален.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-zinc-800 hover:bg-zinc-700">Отмена</AlertDialogCancel>
                      <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDelete}>
                        Удалить
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>

          <h1 className="text-2xl font-bold mb-4">{post.title}</h1>

          {post.imageUrl && (
            <div className="mb-6 relative rounded-lg overflow-hidden">
              <img
                src={`https://demo.soon-night.lol${post.imageUrl}`}
                alt={post.title}
                className="w-full object-cover rounded-lg"
              />
            </div>
          )}

          <div className="mb-6 whitespace-pre-wrap">{post.text}</div>

          <div className="flex flex-wrap gap-2 mb-6">
            {post.tags?.map((tag: string) => (
              <Badge key={tag} variant="outline" className="bg-zinc-800 hover:bg-zinc-700">
                #{tag}
              </Badge>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className={`flex items-center gap-1 ${post.userReaction === "like" ? "text-red-500" : ""}`}
                onClick={handleLike}
              >
                <Heart className="h-4 w-4" fill={post.userReaction === "like" ? "currentColor" : "none"} />
                <span>{post.likesCount || 0}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className={`flex items-center gap-1 ${post.userReaction === "dislike" ? "text-blue-500" : ""}`}
                onClick={handleDislike}
              >
                <ThumbsDown className="h-4 w-4" fill={post.userReaction === "dislike" ? "currentColor" : "none"} />
                <span>{post.dislikesCount || 0}</span>
              </Button>

              <Button variant="ghost" size="sm" className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                <span>{post.commentsCount || 0}</span>
              </Button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className={`flex items-center gap-1 ${post.isFavorite ? "text-yellow-500" : ""}`}
              onClick={handleFavorite}
            >
              <Bookmark className="h-4 w-4" fill={post.isFavorite ? "currentColor" : "none"} />
              <span>В избранное</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function PostSkeleton() {
  return (
    <div className="max-w-3xl mx-auto">
      <Button variant="ghost" className="mb-4" disabled>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Назад
      </Button>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div>
                <Skeleton className="h-4 w-[150px] mb-2" />
                <Skeleton className="h-3 w-[100px]" />
              </div>
            </div>
          </div>

          <Skeleton className="h-8 w-3/4 mb-4" />
          <Skeleton className="h-[300px] w-full mb-6 rounded-lg" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3 mb-6" />

          <div className="flex flex-wrap gap-2 mb-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-6 w-16 rounded-full" />
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
            </div>
            <Skeleton className="h-8 w-24" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
