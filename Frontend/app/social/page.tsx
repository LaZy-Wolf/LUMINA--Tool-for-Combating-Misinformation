"use client"

import type React from "react"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare } from "lucide-react"
import { toast } from "react-hot-toast"
import { ParsedAnalysis } from "@/components/parsed-analysis"
import { SourcesList } from "@/components/sources-list"
import { LoadingSpinner } from "@/components/loading-spinner"
import { socialMediaContext } from "@/utils/api"

interface SocialMediaResult {
  context_analysis: string
  fact_check_result?: {
    claim: string
    analysis: string
    sources: Array<{ title: string; url: string }>
    confidence_score: number
    confidence_explanation: string
  }
}

export default function SocialPage() {
  const [postUrl, setPostUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SocialMediaResult | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!postUrl.trim()) {
      toast.error("Please enter a social media post URL")
      return
    }

    setLoading(true)
    try {
      const response = await socialMediaContext(postUrl.trim())
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
                <MessageSquare className="h-8 w-8 text-blue-500" />
                Social Media Context
              </h1>
              <p className="text-muted-foreground">Analyze social media posts for context and fact-check claims</p>
            </div>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Enter Social Media Post URL</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    placeholder="https://twitter.com/user/status/... or https://reddit.com/r/..."
                    value={postUrl}
                    onChange={(e) => setPostUrl(e.target.value)}
                  />

                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? "Analyzing..." : "Analyze Post"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {result && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Context Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ParsedAnalysis analysis={result.context_analysis} />
                  </CardContent>
                </Card>

                {result.fact_check_result && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Fact-Check Results</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <h4 className="font-medium text-foreground mb-2">Claim:</h4>
                        <p className="text-muted-foreground">{result.fact_check_result.claim}</p>
                      </div>

                      <ParsedAnalysis analysis={result.fact_check_result.analysis} />

                      {result.fact_check_result.sources && result.fact_check_result.sources.length > 0 && (
                        <SourcesList sources={result.fact_check_result.sources} />
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
      {loading && <LoadingSpinner message="Analyzing social media post..." />}
    </div>
  )
}
