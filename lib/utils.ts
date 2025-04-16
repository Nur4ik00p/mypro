import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string): string {
  if (!dateString) return ""

  const date = new Date(dateString)

  // Проверка на валидность даты
  if (isNaN(date.getTime())) return ""

  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  // Меньше минуты
  if (diffInSeconds < 60) {
    return "только что"
  }

  // Меньше часа
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes} ${pluralize(minutes, "минуту", "минуты", "минут")} назад`
  }

  // Меньше суток
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours} ${pluralize(hours, "час", "часа", "часов")} назад`
  }

  // Меньше недели
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days} ${pluralize(days, "день", "дня", "дней")} назад`
  }

  // Форматирование даты
  const day = date.getDate()
  const month = date.toLocaleString("ru-RU", { month: "long" })
  const year = date.getFullYear()
  const currentYear = now.getFullYear()

  // Если текущий год, то год не показываем
  if (year === currentYear) {
    return `${day} ${month}`
  }

  return `${day} ${month} ${year}`
}

export function formatTime(dateString: string): string {
  if (!dateString) return ""

  const date = new Date(dateString)

  // Проверка на валидность даты
  if (isNaN(date.getTime())) return ""

  const hours = date.getHours().toString().padStart(2, "0")
  const minutes = date.getMinutes().toString().padStart(2, "0")

  return `${hours}:${minutes}`
}

// Функция для правильного склонения слов
function pluralize(count: number, one: string, few: string, many: string): string {
  if (count % 10 === 1 && count % 100 !== 11) {
    return one
  } else if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) {
    return few
  } else {
    return many
  }
}
