"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/AuthProvider"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { fetchUserProfile, fetchUserPosts, subscribe, unsubscribe } from "@/lib/api"
import { formatDate } from "@/lib/utils"
import { Edit, MessageSquare, Users } from "lucide-react"
import PostCard from "@/components/posts/PostCard"

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>()
  const [profile, setProfile] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const isOwnProfile = isAuthenticated && user?._id === id

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true)
        const profileData = await fetchUserProfile(id as string)
        const postsData = await fetchUserPosts(id as string)
        setProfile(profileData)
        setPosts(postsData)
      } catch (error) {
        console.error("Ошибка загрузки профиля:", error)
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить профиль пользователя",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      loadProfile()
    }
  }, [id, toast])

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Требуется авторизация",
        description: "Войдите или зарегистрируйтесь, чтобы подписаться",
        variant: "destructive",
      })
      return
    }

    try {
      if (profile.isSubscribed) {
        await unsubscribe(id as string)
        setProfile({
          ...profile,
          isSubscribed: false,
          followersCount: profile.followersCount - 1,
        })
        toast({
          title: "Успешно",
          description: "Вы отписались от пользователя",
        })
      } else {
        await subscribe(id as string)
        setProfile({
          ...profile,
          isSubscribed: true,
          followersCount: profile.followersCount + 1,
        })
        toast({
          title: "Успешно",
          description: "Вы подписались на пользователя",
        })
      }
    } catch (error) {
      console.error("Ошибка при подписке/отписке:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось выполнить действие",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <ProfileSkeleton />
  }

  if (!profile) {
    return (
      <div className="text-center py-10">
        <h1 className="text-2xl font-bold mb-4">Пользователь не найден</h1>
        <Button variant="outline" onClick={() => router.push("/")}>
          Вернуться на главную
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="bg-zinc-900 border-zinc-800 overflow-hidden mb-6">
        {profile.user?.coverUrl && (
          <div className="h-48 w-full relative">
            <img
              src={`https://demo.soon-night.lol${profile.user.coverUrl}`}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <CardContent className={`p-6 ${profile.user?.coverUrl ? "-mt-16" : ""}`}>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
            <Avatar className="h-32 w-32 border-4 border-zinc-900">
              <AvatarImage
                src={profile.user?.avatarUrl ? `https://demo.soon-night.lol${profile.user.avatarUrl}` : undefined}
                alt={profile.user?.fullName}
              />
              <AvatarFallback className="text-4xl">{profile.user?.fullName?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <h1 className="text-2xl font-bold">{profile.user?.fullName}</h1>
              <p className="text-zinc-400">На сайте с {formatDate(profile.user?.createdAt)}</p>
            </div>

            <div className="flex gap-2 mt-4 md:mt-0">
              {isOwnProfile ? (
                <Button
                  variant="outline"
                  className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                  onClick={() => router.push("/profile/edit")}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Редактировать
                </Button>
              ) : (
                <>
                  <Button
                    variant={profile.isSubscribed ? "outline" : "default"}
                    className={
                      profile.isSubscribed
                        ? "border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                        : "bg-red-600 hover:bg-red-700"
                    }
                    onClick={handleSubscribe}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    {profile.isSubscribed ? "Отписаться" : "Подписаться"}
                  </Button>

                  <Button
                    variant="outline"
                    className="border-zinc-700 hover:bg-zinc-800"
                    onClick={() => router.push(`/chat/${id}`)}
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Сообщение
                  </Button>
                </>
              )}
            </div>
          </div>

          {profile.user?.about && (
            <div className="mt-6">
              <h2 className="text-lg font-medium mb-2">О себе</h2>
              <p className="text-zinc-300">{profile.user.about}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-4 mt-6">
            <div className="bg-zinc-800 px-4 py-2 rounded-lg">
              <p className="text-sm text-zinc-400">Подписчики</p>
              <p className="text-xl font-bold">{profile.followersCount || 0}</p>
            </div>
            <div className="bg-zinc-800 px-4 py-2 rounded-lg">
              <p className="text-sm text-zinc-400">Подписки</p>
              <p className="text-xl font-bold">{profile.subscriptionsCount || 0}</p>
            </div>
            <div className="bg-zinc-800 px-4 py-2 rounded-lg">
              <p className="text-sm text-zinc-400">Публикации</p>
              <p className="text-xl font-bold">{posts.length || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="posts" className="mb-6">
        <TabsList className="bg-zinc-900 border border-zinc-800">
          <TabsTrigger value="posts">Публикации</TabsTrigger>
          <TabsTrigger value="about">Информация</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-4">
          {posts.length > 0 ? (
            <div className="space-y-6">
              {posts.map((post) => (
                <PostCard key={post._id} post={post} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-zinc-900 border border-zinc-800 rounded-lg">
              <p className="text-zinc-500">У пользователя пока нет публикаций</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="about" className="mt-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6 space-y-6">
              <div>
                <h2 className="text-lg font-medium mb-2">Контактная информация</h2>
                <p className="text-zinc-300">Email: {profile.user?.email}</p>
              </div>

              {profile.user?.socialMedia &&
                Object.keys(profile.user.socialMedia).some((key) => !!profile.user.socialMedia[key]) && (
                  <div>
                    <h2 className="text-lg font-medium mb-2">Социальные сети</h2>
                    <div className="space-y-2">
                      {profile.user.socialMedia.website && (
                        <p className="text-zinc-300">
                          Сайт:{" "}
                          <a
                            href={profile.user.socialMedia.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-red-500 hover:underline"
                          >
                            {profile.user.socialMedia.website}
                          </a>
                        </p>
                      )}
                      {profile.user.socialMedia.twitter && (
                        <p className="text-zinc-300">
                          Twitter:{" "}
                          <a
                            href={profile.user.socialMedia.twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-red-500 hover:underline"
                          >
                            {profile.user.socialMedia.twitter}
                          </a>
                        </p>
                      )}
                      {profile.user.socialMedia.instagram && (
                        <p className="text-zinc-300">
                          Instagram:{" "}
                          <a
                            href={profile.user.socialMedia.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-red-500 hover:underline"
                          >
                            {profile.user.socialMedia.instagram}
                          </a>
                        </p>
                      )}
                      {profile.user.socialMedia.facebook && (
                        <p className="text-zinc-300">
                          Facebook:{" "}
                          <a
                            href={profile.user.socialMedia.facebook}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-red-500 hover:underline"
                          >
                            {profile.user.socialMedia.facebook}
                          </a>
                        </p>
                      )}
                      {profile.user.socialMedia.telegram && (
                        <p className="text-zinc-300">
                          Telegram:{" "}
                          <a
                            href={`https://t.me/${profile.user.socialMedia.telegram}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-red-500 hover:underline"
                          >
                            {profile.user.socialMedia.telegram}
                          </a>
                        </p>
                      )}
                      {profile.user.socialMedia.vk && (
                        <p className="text-zinc-300">
                          VK:{" "}
                          <a
                            href={profile.user.socialMedia.vk}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-red-500 hover:underline"
                          >
                            {profile.user.socialMedia.vk}
                          </a>
                        </p>
                      )}
                    </div>
                  </div>
                )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="max-w-4xl mx-auto">
      <Card className="bg-zinc-900 border-zinc-800 overflow-hidden mb-6">
        <Skeleton className="h-48 w-full" />

        <CardContent className="p-6 -mt-16">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
            <Skeleton className="h-32 w-32 rounded-full" />

            <div className="flex-1">
              <Skeleton className="h-8 w-[200px] mb-2" />
              <Skeleton className="h-4 w-[150px]" />
            </div>

            <div className="flex gap-2 mt-4 md:mt-0">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>

          <div className="mt-6">
            <Skeleton className="h-6 w-[100px] mb-2" />
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-2/3" />
          </div>

          <div className="flex flex-wrap gap-4 mt-6">
            <Skeleton className="h-16 w-32" />
            <Skeleton className="h-16 w-32" />
            <Skeleton className="h-16 w-32" />
          </div>
        </CardContent>
      </Card>

      <div className="mb-6">
        <Skeleton className="h-10 w-[200px] mb-4" />

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
      </div>
    </div>
  )
}
