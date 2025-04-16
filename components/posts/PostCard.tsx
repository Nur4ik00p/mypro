"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/AuthProvider"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { formatDate } from "@/lib/utils"
import { Bookmark, Heart, MessageSquare, ThumbsDown } from "lucide-react"
import { likePost, dislikePost, removeReaction, addToFavorites, removeFromFavorites } from "@/lib/api"

interface PostCardProps {
  post: any
}

export default function PostCard({ post }: PostCardProps) {
  const [postState, setPostState] = useState(post)
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) {
      toast({
        title: "Требуется авторизация",
        description: "Войдите или зарегистрируйтесь, чтобы оценивать посты",
        variant: "destructive",
      })
      return
    }

    try {
      if (postState.userReaction === "like") {
        const response = await removeReaction(postState._id)
        setPostState({
          ...postState,
          userReaction: null,
          likesCount: response.likesCount,
          dislikesCount: response.dislikesCount,
        })
      } else {
        const response = await likePost(postState._id)
        setPostState({
          ...postState,
          userReaction: "like",
          likesCount: response.likesCount,
          dislikesCount: response.dislikesCount,
        })
      }
    } catch (error) {
      console.error("Ошибка при лайке:", error)
    }
  }

  const handleDislike = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) {
      toast({
        title: "Требуется авторизация",
        description: "Войдите или зарегистрируйтесь, чтобы оценивать посты",
        variant: "destructive",
      })
      return
    }

    try {
      if (postState.userReaction === "dislike") {
        const response = await removeReaction(postState._id)
        setPostState({
          ...postState,
          userReaction: null,
          likesCount: response.likesCount,
          dislikesCount: response.dislikesCount,
        })
      } else {
        const response = await dislikePost(postState._id)
        setPostState({
          ...postState,
          userReaction: "dislike",
          likesCount: response.likesCount,
          dislikesCount: response.dislikesCount,
        })
      }
    } catch (error) {
      console.error("Ошибка при дизлайке:", error)
    }
  }

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) {
      toast({
        title: "Требуется авторизация",
        description: "Войдите или зарегистрируйтесь, чтобы добавлять в избранное",
        variant: "destructive",
      })
      return
    }

    try {
      if (postState.isFavorite) {
        await removeFromFavorites(postState._id)
        setPostState({ ...postState, isFavorite: false })
      } else {
        await addToFavorites(postState._id)
        setPostState({ ...postState, isFavorite: true })
      }
    } catch (error) {
      console.error("Ошибка при работе с избранным:", error)
    }
  }

  return (
    <Link href={`/posts/${postState._id}`}>
      <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Link href={`/profile/${postState.user?._id}`} onClick={(e) => e.stopPropagation()}>
              <Avatar>
                <AvatarImage
                  src={postState.user?.avatarUrl ? `https://demo.soon-night.lol${postState.user.avatarUrl}` : undefined}
                  alt={postState.user?.fullName}
                />
                <AvatarFallback>{postState.user?.fullName?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
            </Link>
            <div>
              <Link
                href={`/profile/${postState.user?._id}`}
                className="font-medium hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {postState.user?.fullName}
              </Link>
              <p className="text-xs text-zinc-400">{formatDate(postState.createdAt)}</p>
            </div>
          </div>

          <h2 className="text-xl font-bold mb-2">{postState.title}</h2>

          {postState.imageUrl && (
            <div className="mb-4 rounded-lg overflow-hidden">
              <img
                src={`https://demo.soon-night.lol${postState.imageUrl}`}
                alt={postState.title}
                className="w-full object-cover max-h-[300px]"
              />
            </div>
          )}

          <p className="mb-4 line-clamp-3">{postState.text}</p>

          {postState.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {postState.tags.map((tag: string) => (
                <Badge key={tag} variant="outline" className="bg-zinc-800 hover:bg-zinc-700">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex items-center justify-between p-4 border-t border-zinc-800">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className={`flex items-center gap-1 ${postState.userReaction === "like" ? "text-red-500" : ""}`}
              onClick={handleLike}
            >
              <Heart className="h-4 w-4" fill={postState.userReaction === "like" ? "currentColor" : "none"} />
              <span>{postState.likesCount || 0}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className={`flex items-center gap-1 ${postState.userReaction === "dislike" ? "text-blue-500" : ""}`}
              onClick={handleDislike}
            >
              <ThumbsDown className="h-4 w-4" fill={postState.userReaction === "dislike" ? "currentColor" : "none"} />
              <span>{postState.dislikesCount || 0}</span>
            </Button>

            <Button variant="ghost" size="sm" className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              <span>{postState.commentsCount || 0}</span>
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className={`flex items-center gap-1 ${postState.isFavorite ? "text-yellow-500" : ""}`}
            onClick={handleFavorite}
          >
            <Bookmark className="h-4 w-4" fill={postState.isFavorite ? "currentColor" : "none"} />
          </Button>
        </CardFooter>
      </Card>
    </Link>
  )
}
