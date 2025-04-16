"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/AuthProvider"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Send } from "lucide-react"
import { fetchUserProfile } from "@/lib/api"
import { io, type Socket } from "socket.io-client"
import { formatTime } from "@/lib/utils"

interface Message {
  _id: string
  user: string
  text: string
  avatarColor: string
  createdAt: string
}

export default function ChatRoomPage() {
  const { id } = useParams<{ id: string }>()
  const [recipient, setRecipient] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login")
      return
    }

    // Загружаем данные получателя
    const loadRecipient = async () => {
      try {
        setLoading(true)
        const profileData = await fetchUserProfile(id as string)
        setRecipient(profileData.user)
      } catch (error) {
        console.error("Ошибка загрузки профиля:", error)
      } finally {
        setLoading(false)
      }
    }

    loadRecipient()

    // Подключаемся к сокету
    const socketInstance = io("https://demo.soon-night.lol", {
      withCredentials: true,
    })

    socketInstance.on("connect", () => {
      console.log("Connected to socket server")
      setConnected(true)
    })

    socketInstance.on("disconnect", () => {
      console.log("Disconnected from socket server")
      setConnected(false)
    })

    socketInstance.on("messageHistory", (history: Message[]) => {
      setMessages(history)
    })

    socketInstance.on("receiveMessage", (msg: Message) => {
      setMessages((prev) => [...prev, msg])
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [id, isAuthenticated, router])

  // Прокрутка вниз при получении новых сообщений
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !socket || !connected) return

    // Генерируем случайный цвет для аватара
    const colors = ["#FF5733", "#33FF57", "#3357FF", "#F033FF", "#FF33A8", "#33FFF6"]
    const randomColor = colors[Math.floor(Math.random() * colors.length)]

    socket.emit("sendMessage", {
      userName: user?.fullName || "Пользователь",
      text: message,
      avatarColor: randomColor,
    })

    setMessage("")
  }

  if (loading) {
    return <ChatSkeleton />
  }

  if (!recipient) {
    return (
      <div className="text-center py-10">
        <h1 className="text-2xl font-bold mb-4">Пользователь не найден</h1>
        <Button variant="outline" onClick={() => router.push("/chat")}>
          Вернуться к списку чатов
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Button variant="ghost" className="mb-4" onClick={() => router.push("/chat")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Назад к списку чатов
      </Button>

      <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
        <CardHeader className="p-4 border-b border-zinc-800 flex flex-row items-center gap-3">
          <Avatar>
            <AvatarImage
              src={recipient.avatarUrl ? `http://localhost:4001${recipient.avatarUrl}` : undefined}
              alt={recipient.fullName}
            />
            <AvatarFallback>{recipient.fullName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-lg font-medium">{recipient.fullName}</h2>
            <p className="text-sm text-zinc-400">{connected ? "В сети" : "Не в сети"}</p>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex flex-col h-[500px]">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length > 0 ? (
              messages.map((msg) => {
                const isCurrentUser = msg.user === user?.fullName

                return (
                  <div key={msg._id} className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                    <div className={`flex gap-2 max-w-[80%] ${isCurrentUser ? "flex-row-reverse" : ""}`}>
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                        style={{ backgroundColor: msg.avatarColor }}
                      >
                        {msg.user.charAt(0)}
                      </div>
                      <div
                        className={`rounded-lg p-3 ${
                          isCurrentUser ? "bg-red-600 text-white" : "bg-zinc-800 text-white"
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{isCurrentUser ? "Вы" : msg.user}</span>
                          <p>{msg.text}</p>
                          <span className="text-xs text-zinc-400 mt-1 self-end">{formatTime(msg.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-zinc-500">Начните общение прямо сейчас</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={sendMessage} className="p-4 border-t border-zinc-800 flex gap-2">
            <Input
              placeholder="Введите сообщение..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="bg-zinc-950 border-zinc-800"
            />
            <Button type="submit" className="bg-red-600 hover:bg-red-700" disabled={!connected || !message.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function ChatSkeleton() {
  return (
    <div className="max-w-3xl mx-auto">
      <Button variant="ghost" className="mb-4" disabled>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Назад к списку чатов
      </Button>

      <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
        <CardHeader className="p-4 border-b border-zinc-800 flex flex-row items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div>
            <Skeleton className="h-5 w-[150px] mb-1" />
            <Skeleton className="h-3 w-[100px]" />
          </div>
        </CardHeader>
        <CardContent className="p-0 flex flex-col h-[500px]">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
                <div className={`flex gap-2 max-w-[80%] ${i % 2 === 0 ? "flex-row-reverse" : ""}`}>
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-3 w-[100px]" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-zinc-800 flex gap-2">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-10" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
