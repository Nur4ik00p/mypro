import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface TagCloudProps {
  tags: string[]
}

export default function TagCloud({ tags }: TagCloudProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <Link href={`/?tag=${tag}`} key={tag}>
          <Badge variant="outline" className="bg-zinc-800 hover:bg-zinc-700">
            #{tag}
          </Badge>
        </Link>
      ))}
      {tags.length === 0 && <p className="text-zinc-500">Теги не найдены</p>}
    </div>
  )
}
