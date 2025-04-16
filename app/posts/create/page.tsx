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
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, ImagePlus, Loader2, X } from "lucide-react"
import { createPost, uploadImage } from "@/lib/api"

export default function CreatePostPage() {
  const [formData, setFormData] = useState({
    title: "",
    text: "",
    tags: "",
  })
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  // Проверка авторизации
  if (!isAuthenticated) {
    router.push("/auth/login")
    return null
  }

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
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Загружаем изображение, если оно есть
      let imageUrl = null
      if (image) {
        const uploadResult = await uploadImage(image)
        imageUrl = uploadResult.url
      }

      // Преобразуем строку тегов в массив
      const tagsArray = formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)

      // Создаем пост
      await createPost({
        title: formData.title,
        text: formData.text,
        tags: tagsArray,
        imageUrl,
      })

      toast({
        title: "Успешно",
        description: "Пост успешно создан",
      })

      router.push("/")
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось создать пост",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Button variant="ghost" className="mb-4" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Назад
      </Button>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-2xl">Создание поста</CardTitle>
          <CardDescription>Поделитесь своими мыслями с сообществом</CardDescription>
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
                  Выбрать изображение
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
              Опубликовать
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
