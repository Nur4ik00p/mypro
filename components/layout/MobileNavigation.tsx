"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/components/auth/AuthProvider"
import { Bookmark, Home, MessageSquare, PlusCircle, User } from "lucide-react"

export default function MobileNavigation() {
  const { user, isAuthenticated } = useAuth()
  const pathname = usePathname()

  if (!isAuthenticated) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-t border-zinc-800 lg:hidden">
      <div className="flex items-center justify-around h-16">
        <Link
          href="/"
          className={`flex flex-col items-center justify-center w-full h-full ${
            pathname === "/" ? "text-red-500" : "text-zinc-400"
          }`}
        >
          <Home className="h-5 w-5" />
          <span className="text-xs mt-1">Главная</span>
        </Link>
        <Link
          href="/chat"
          className={`flex flex-col items-center justify-center w-full h-full ${
            pathname.startsWith("/chat") ? "text-red-500" : "text-zinc-400"
          }`}
        >
          <MessageSquare className="h-5 w-5" />
          <span className="text-xs mt-1">Чаты</span>
        </Link>
        <Link
          href="/posts/create"
          className={`flex flex-col items-center justify-center w-full h-full ${
            pathname === "/posts/create" ? "text-red-500" : "text-zinc-400"
          }`}
        >
          <PlusCircle className="h-5 w-5" />
          <span className="text-xs mt-1">Создать</span>
        </Link>
        <Link
          href="/favorites"
          className={`flex flex-col items-center justify-center w-full h-full ${
            pathname === "/favorites" ? "text-red-500" : "text-zinc-400"
          }`}
        >
          <Bookmark className="h-5 w-5" />
          <span className="text-xs mt-1">Избранное</span>
        </Link>
        <Link
          href={`/profile/${user?._id}`}
          className={`flex flex-col items-center justify-center w-full h-full ${
            pathname === `/profile/${user?._id}` ? "text-red-500" : "text-zinc-400"
          }`}
        >
          <User className="h-5 w-5" />
          <span className="text-xs mt-1">Профиль</span>
        </Link>
      </div>
    </div>
  )
}
