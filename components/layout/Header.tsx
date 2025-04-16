"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/components/auth/AuthProvider"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bookmark, LogOut, Menu, MessageSquare, User } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-black/80 backdrop-blur-sm">
      <div className="container flex h-16 items-center justify-between px-4 max-w-5xl">
        <div className="flex items-center gap-2">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Меню</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-zinc-950 border-zinc-800 p-0">
              <div className="grid gap-2 py-6">
                <div className="px-6 mb-4">
                  <Link href="/" className="flex items-center gap-2 text-xl font-bold" onClick={() => setOpen(false)}>
                    <span className="text-red-600">Социальная</span>
                    <span>Сеть</span>
                  </Link>
                </div>
                <nav className="grid gap-1 px-2">
                  <Link
                    href="/"
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-zinc-800 ${
                      pathname === "/" ? "bg-zinc-800" : ""
                    }`}
                    onClick={() => setOpen(false)}
                  >
                    Главная
                  </Link>
                  {isAuthenticated ? (
                    <>
                      <Link
                        href={`/profile/${user?._id}`}
                        className={`flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-zinc-800 ${
                          pathname === `/profile/${user?._id}` ? "bg-zinc-800" : ""
                        }`}
                        onClick={() => setOpen(false)}
                      >
                        Мой профиль
                      </Link>
                      <Link
                        href="/chat"
                        className={`flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-zinc-800 ${
                          pathname === "/chat" ? "bg-zinc-800" : ""
                        }`}
                        onClick={() => setOpen(false)}
                      >
                        Сообщения
                      </Link>
                      <Link
                        href="/favorites"
                        className={`flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-zinc-800 ${
                          pathname === "/favorites" ? "bg-zinc-800" : ""
                        }`}
                        onClick={() => setOpen(false)}
                      >
                        Избранное
                      </Link>
                      <button
                        onClick={() => {
                          logout()
                          setOpen(false)
                        }}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-zinc-800 text-red-500"
                      >
                        Выйти
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/auth/login"
                        className={`flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-zinc-800 ${
                          pathname === "/auth/login" ? "bg-zinc-800" : ""
                        }`}
                        onClick={() => setOpen(false)}
                      >
                        Войти
                      </Link>
                      <Link
                        href="/auth/register"
                        className={`flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-zinc-800 ${
                          pathname === "/auth/register" ? "bg-zinc-800" : ""
                        }`}
                        onClick={() => setOpen(false)}
                      >
                        Регистрация
                      </Link>
                    </>
                  )}
                </nav>
              </div>
            </SheetContent>
          </Sheet>

          <Link href="/" className="flex items-center gap-2 text-xl font-bold">
            <span className="text-red-600">Социальная</span>
            <span className="hidden sm:inline">Сеть</span>
          </Link>
        </div>

        <nav className="hidden lg:flex items-center gap-6">
          <Link
            href="/"
            className={`text-sm font-medium ${pathname === "/" ? "text-white" : "text-zinc-400 hover:text-white"}`}
          >
            Главная
          </Link>
          {isAuthenticated && (
            <>
              <Link
                href="/chat"
                className={`text-sm font-medium ${
                  pathname === "/chat" ? "text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                Сообщения
              </Link>
              <Link
                href="/favorites"
                className={`text-sm font-medium ${
                  pathname === "/favorites" ? "text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                Избранное
              </Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <div className="hidden sm:flex items-center gap-2">
                <Link href="/chat">
                  <Button variant="ghost" size="icon" className="relative">
                    <MessageSquare className="h-5 w-5" />
                    <span className="sr-only">Сообщения</span>
                  </Button>
                </Link>
                <Link href="/favorites">
                  <Button variant="ghost" size="icon">
                    <Bookmark className="h-5 w-5" />
                    <span className="sr-only">Избранное</span>
                  </Button>
                </Link>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={user?.avatarUrl ? `https://demo.soon-night.lol${user.avatarUrl}` : undefined}
                        alt={user?.fullName}
                      />
                      <AvatarFallback>{user?.fullName?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-zinc-900 border-zinc-800">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user?.fullName}</p>
                      <p className="text-sm text-zinc-400">{user?.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="bg-zinc-800" />
                  <DropdownMenuItem asChild>
                    <Link href={`/profile/${user?._id}`} className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Мой профиль</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/favorites" className="cursor-pointer">
                      <Bookmark className="mr-2 h-4 w-4" />
                      <span>Избранное</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-zinc-800" />
                  <DropdownMenuItem onClick={logout} className="text-red-500 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Выйти</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/login" className="hidden sm:block">
                <Button variant="ghost">Войти</Button>
              </Link>
              <Link href="/auth/register">
                <Button className="bg-red-600 hover:bg-red-700">Регистрация</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
