"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/AuthProvider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, ImagePlus, Loader2, X } from "lucide-react"
import { fetchPost, updatePost, uploadImage } from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"

export default function EditPostPage() {
  const { id } = useParams<{ id: string }>()
  const [formData, setFormData] = useState({
    title: "",
    text: "",
    tags: "",
    imageUrl: "",
  })
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const loadPost = async () => {
      try {
        setInitialLoading(true)
        const post = await fetchPost(id as string)

        // Проверяем, является ли пользователь автором поста
        if (post.user._id !== user?._id) {
          toast({
            title: "Доступ запрещен",
            description: "Вы не можете редактировать этот пост",
            variant: "destructive",
          })
          router.push(`/posts/${id}`)
          return
        }

        setFormData({
          title: post.title,
          text: post.text,
          tags: post.tags?.join(", ") || "",
          imageUrl: post.imageUrl || "",
        })

        // Изменяем пути к изображениям
        if (post.imageUrl) {
          setImagePreview(`https://demo.soon-night.lol${post.imageUrl}`)
        }
      } catch (error) {
        console.error("Ошибка загрузки поста:", error)
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить пост",
          variant: "destructive",
        })
        router.push("/")
      } finally {
        setInitialLoading(false)
      }
    }

    if (id && isAuthenticated) {
      loadPost()
    } else if (!isAuthenticated) {
      router.push("/auth/login")
    }
  }, [id, user, isAuthenticated, router, toast])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImage(file)

      // Создаем превью изображения
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImage(null)
    setImagePreview(null)
    setFormData((prev) => ({ ...prev, imageUrl: "" }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Загружаем изображение, если оно есть
      let imageUrl = formData.imageUrl
      if (image) {
        const uploadResult = await uploadImage(image)
        imageUrl = uploadResult.url
      }

      // Преобразуем строку тегов в массив
      const tagsArray = formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)

      // Обновляем пост
      await updatePost(id as string, {
        title: formData.title,
        text: formData.text,
        tags: tagsArray,
        imageUrl,
      })

      toast({
        title: "Успешно",
        description: "Пост успешно обновлен",
      })

      router.push(`/posts/${id}`)
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обновить пост",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" className="mb-4" disabled>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад
        </Button>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <Skeleton className="h-8 w-[200px] mb-2" />
            <Skeleton className="h-4 w-[300px]" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-32 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-10 w-[200px]" />
            </div>
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Button variant="ghost" className="mb-4" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Назад
      </Button>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-2xl">Редактирование поста</CardTitle>
          <CardDescription>Внесите изменения в свой пост</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Заголовок</Label>
              <Input
                id="title"
                name="title"
                placeholder="Введите заголовок поста"
                value={formData.title}
                onChange={handleChange}
                required
                minLength={10}
                className="bg-zinc-950 border-zinc-800"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="text">Текст</Label>
              <Textarea
                id="text"
                name="text"
                placeholder="Введите текст поста"
                value={formData.text}
                onChange={handleChange}
                required
                minLength={5}
                rows={8}
                className="bg-zinc-950 border-zinc-800"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Теги</Label>
              <Input
                id="tags"
                name="tags"
                placeholder="Введите теги через запятую"
                value={formData.tags}
                onChange={handleChange}
                className="bg-zinc-950 border-zinc-800"
              />
              <p className="text-xs text-zinc-400">Например: технологии, новости, обсуждение</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Изображение</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="border-dashed border-zinc-700"
                  onClick={() => document.getElementById("image")?.click()}
                >
                  <ImagePlus className="mr-2 h-4 w-4" />
                  {imagePreview ? "Изменить изображение" : "Выбрать изображение"}
                </Button>
                <Input id="image" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </div>

              {imagePreview && (
                <div className="relative mt-4">
                  <img
                    src={imagePreview || "/placeholder.svg"}
                    alt="Preview"
                    className="max-h-[300px] rounded-lg object-contain"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 rounded-full"
                    onClick={removeImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Сохранить изменения
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
