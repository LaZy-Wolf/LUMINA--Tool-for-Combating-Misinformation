interface ParsedAnalysisProps {
  analysis: string
}

export function ParsedAnalysis({ analysis }: ParsedAnalysisProps) {
  const parseAnalysis = (text: string) => {
    const sections: { [key: string]: string } = {}

    // Split by lines that start with "- **" or "**"
    const lines = text.split("\n")
    let currentSection = ""
    let currentContent = ""

    for (const line of lines) {
      const sectionMatch = line.match(/^-?\s*\*\*([^*]+)\*\*:?\s*(.*)/)
      if (sectionMatch) {
        // Save previous section
        if (currentSection && currentContent) {
          sections[currentSection] = currentContent.trim()
        }
        // Start new section
        currentSection = sectionMatch[1].trim()
        currentContent = sectionMatch[2] || ""
      } else if (currentSection && line.trim()) {
        currentContent += "\n" + line
      }
    }

    // Save last section
    if (currentSection && currentContent) {
      sections[currentSection] = currentContent.trim()
    }

    return sections
  }

  const sections = parseAnalysis(analysis)

  if (Object.keys(sections).length === 0) {
    return (
      <div className="prose prose-sm max-w-none">
        <p className="text-foreground whitespace-pre-wrap">{analysis}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {Object.entries(sections).map(([title, content]) => (
        <div key={title} className="border-l-4 border-blue-500 pl-4">
          <h3 className="font-semibold text-foreground mb-2">{title}</h3>
          <div className="prose prose-sm max-w-none">
            <p className="text-muted-foreground whitespace-pre-wrap">{content}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
