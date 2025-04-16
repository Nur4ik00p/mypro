"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/AuthProvider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, ImagePlus, Loader2, X } from "lucide-react"
import { updateProfile } from "@/lib/api"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function EditProfilePage() {
  const [formData, setFormData] = useState({
    fullName: "",
    about: "",
    theme: "dark",
    socialMedia: {
      website: "",
      twitter: "",
      instagram: "",
      facebook: "",
      telegram: "",
      vk: "",
    },
  })
  const [avatar, setAvatar] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [cover, setCover] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { user, isAuthenticated, refreshUser } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login")
      return
    }

    if (user) {
      setFormData({
        fullName: user.fullName || "",
        about: user.about || "",
        theme: user.theme || "dark",
        socialMedia: {
          website: user.socialMedia?.website || "",
          twitter: user.socialMedia?.twitter || "",
          instagram: user.socialMedia?.instagram || "",
          facebook: user.socialMedia?.facebook || "",
          telegram: user.socialMedia?.telegram || "",
          vk: user.socialMedia?.vk || "",
        },
      })

      if (user.avatarUrl) {
        setAvatarPreview(`https://demo.soon-night.lol${user.avatarUrl}`)
      }

      if (user.coverUrl) {
        setCoverPreview(`https://demo.soon-night.lol${user.coverUrl}`)
      }
    }
  }, [user, isAuthenticated, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSocialMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      socialMedia: {
        ...prev.socialMedia,
        [name]: value,
      },
    }))
  }

  const handleThemeChange = (value: string) => {
    setFormData((prev) => ({ ...prev, theme: value }))
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setAvatar(file)

      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setCover(file)

      const reader = new FileReader()
      reader.onloadend = () => {
        setCoverPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeAvatar = () => {
    setAvatar(null)
    setAvatarPreview(null)
  }

  const removeCover = () => {
    setCover(null)
    setCoverPreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append("fullName", formData.fullName)
      formDataToSend.append("about", formData.about)
      formDataToSend.append("theme", formData.theme)
      formDataToSend.append("socialMedia", JSON.stringify(formData.socialMedia))

      if (avatar) {
        formDataToSend.append("avatar", avatar)
      }

      if (cover) {
        formDataToSend.append("cover", cover)
      }

      await updateProfile(user?._id as string, formDataToSend)

      // Обновляем данные пользователя
      await refreshUser()

      toast({
        title: "Успешно",
        description: "Профиль успешно обновлен",
      })

      router.push(`/profile/${user?._id}`)
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обновить профиль",
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
          <CardTitle className="text-2xl">Редактирование профиля</CardTitle>
          <CardDescription>Обновите информацию о себе</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="avatar">Аватар</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-dashed border-zinc-700"
                    onClick={() => document.getElementById("avatar")?.click()}
                  >
                    <ImagePlus className="mr-2 h-4 w-4" />
                    {avatarPreview ? "Изменить аватар" : "Выбрать аватар"}
                  </Button>
                  <Input id="avatar" type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                </div>

                {avatarPreview && (
                  <div className="relative mt-4">
                    <img
                      src={avatarPreview || "/placeholder.svg"}
                      alt="Avatar Preview"
                      className="h-32 w-32 rounded-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-0 right-0 h-8 w-8 rounded-full"
                      onClick={removeAvatar}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cover">Обложка профиля</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-dashed border-zinc-700"
                    onClick={() => document.getElementById("cover")?.click()}
                  >
                    <ImagePlus className="mr-2 h-4 w-4" />
                    {coverPreview ? "Изменить обложку" : "Выбрать обложку"}
                  </Button>
                  <Input id="cover" type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
                </div>

                {coverPreview && (
                  <div className="relative mt-4">
                    <img
                      src={coverPreview || "/placeholder.svg"}
                      alt="Cover Preview"
                      className="h-32 w-full rounded-lg object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8 rounded-full"
                      onClick={removeCover}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

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
              <Label htmlFor="about">О себе</Label>
              <Textarea
                id="about"
                name="about"
                placeholder="Расскажите немного о себе..."
                value={formData.about}
                onChange={handleChange}
                className="bg-zinc-950 border-zinc-800"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="theme">Тема профиля</Label>
              <Select value={formData.theme} onValueChange={handleThemeChange}>
                <SelectTrigger className="bg-zinc-950 border-zinc-800">
                  <SelectValue placeholder="Выберите тему" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  <SelectItem value="light">Светлая</SelectItem>
                  <SelectItem value="dark">Темная</SelectItem>
                  <SelectItem value="blue">Синяя</SelectItem>
                  <SelectItem value="green">Зеленая</SelectItem>
                  <SelectItem value="purple">Фиолетовая</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Социальные сети</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="website">Веб-сайт</Label>
                  <Input
                    id="website"
                    name="website"
                    placeholder="https://example.com"
                    value={formData.socialMedia.website}
                    onChange={handleSocialMediaChange}
                    className="bg-zinc-950 border-zinc-800"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="twitter">Twitter</Label>
                  <Input
                    id="twitter"
                    name="twitter"
                    placeholder="https://twitter.com/username"
                    value={formData.socialMedia.twitter}
                    onChange={handleSocialMediaChange}
                    className="bg-zinc-950 border-zinc-800"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input
                    id="instagram"
                    name="instagram"
                    placeholder="https://instagram.com/username"
                    value={formData.socialMedia.instagram}
                    onChange={handleSocialMediaChange}
                    className="bg-zinc-950 border-zinc-800"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="facebook">Facebook</Label>
                  <Input
                    id="facebook"
                    name="facebook"
                    placeholder="https://facebook.com/username"
                    value={formData.socialMedia.facebook}
                    onChange={handleSocialMediaChange}
                    className="bg-zinc-950 border-zinc-800"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telegram">Telegram</Label>
                  <Input
                    id="telegram"
                    name="telegram"
                    placeholder="username"
                    value={formData.socialMedia.telegram}
                    onChange={handleSocialMediaChange}
                    className="bg-zinc-950 border-zinc-800"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vk">ВКонтакте</Label>
                  <Input
                    id="vk"
                    name="vk"
                    placeholder="https://vk.com/username"
                    value={formData.socialMedia.vk}
                    onChange={handleSocialMediaChange}
                    className="bg-zinc-950 border-zinc-800"
                  />
                </div>
              </div>
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
