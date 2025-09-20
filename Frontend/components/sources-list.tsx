import { ExternalLink } from "lucide-react"

interface Source {
  title: string
  url: string
}

interface SourcesListProps {
  sources: Source[]
}

export function SourcesList({ sources }: SourcesListProps) {
  if (!sources || sources.length === 0) return null

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-foreground">Sources</h3>
      <div className="space-y-2">
        {sources.map((source, index) => (
          <a
            key={index}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors group"
          >
            <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-blue-500" />
            <span className="text-sm text-foreground group-hover:text-blue-500 truncate">{source.title}</span>
          </a>
        ))}
      </div>
    </div>
  )
}
