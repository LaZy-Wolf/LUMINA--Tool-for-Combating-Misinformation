"use client"

import type React from "react"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Newspaper } from "lucide-react"
import { toast } from "react-hot-toast"
import { ParsedAnalysis } from "@/components/parsed-analysis"
import { SourcesList } from "@/components/sources-list"
import { LoadingSpinner } from "@/components/loading-spinner"
import { neutralNews } from "@/utils/api"

interface NeutralNewsResult {
  neutral_analysis: string
  alternative_sources: Array<{ title: string; url: string }>
}

export default function NeutralNewsPage() {
  const [articleInput, setArticleInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<NeutralNewsResult | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!articleInput.trim()) {
      toast.error("Please enter an article URL or paste article text")
      return
    }

    setLoading(true)
    try {
      const response = await neutralNews(articleInput.trim())
      setResult(response)
      toast.success("Analysis complete!")
    } catch (error) {
      toast.error(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="md:ml-64">
        <Header />
        <main className="p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
                <Newspaper className="h-8 w-8 text-blue-500" />
                Neutral News
              </h1>
              <p className="text-muted-foreground">
                Get balanced perspectives and alternative viewpoints on news articles
              </p>
            </div>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Enter Article URL or Text</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Textarea
                    placeholder="Paste article URL or full article text here..."
                    value={articleInput}
                    onChange={(e) => setArticleInput(e.target.value)}
                    className="min-h-[120px]"
                  />

                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? "Analyzing..." : "Get Neutral Analysis"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {result && (
              <Card>
                <CardHeader>
                  <CardTitle>Neutral Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ParsedAnalysis analysis={result.neutral_analysis} />

                  {result.alternative_sources && result.alternative_sources.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-foreground mb-3">Alternative Sources</h3>
                      <SourcesList sources={result.alternative_sources} />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
      {loading && <LoadingSpinner message="Generating neutral analysis..." />}
    </div>
  )
}
