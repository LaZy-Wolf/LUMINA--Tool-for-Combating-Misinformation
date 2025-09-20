"use client"

import type React from "react"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Radar, Star } from "lucide-react"
import { toast } from "react-hot-toast"
import { ParsedAnalysis } from "@/components/parsed-analysis"
import { SourcesList } from "@/components/sources-list"
import { LoadingSpinner } from "@/components/loading-spinner"
import { biasRadar } from "@/utils/api"

interface BiasRadarResult {
  analysis: string
  sources: Array<{ title: string; url: string }>
}

export default function BiasRadarPage() {
  const [source, setSource] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<BiasRadarResult | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!source.trim()) {
      toast.error("Please enter a source to analyze")
      return
    }

    setLoading(true)
    try {
      const response = await biasRadar(source.trim())
      setResult(response)
      toast.success("Analysis complete!")
    } catch (error) {
      toast.error(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }

  const getBiasBadge = (bias: string) => {
    const lowerBias = bias.toLowerCase()
    if (lowerBias.includes("left") || lowerBias.includes("liberal")) {
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          {bias}
        </Badge>
      )
    }
    if (lowerBias.includes("right") || lowerBias.includes("conservative")) {
      return (
        <Badge variant="secondary" className="bg-red-100 text-red-800">
          {bias}
        </Badge>
      )
    }
    if (lowerBias.includes("center") || lowerBias.includes("neutral")) {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          {bias}
        </Badge>
      )
    }
    return <Badge variant="outline">{bias}</Badge>
  }

  const renderStars = (score: number) => {
    return Array.from({ length: 10 }, (_, i) => (
      <Star key={i} className={`h-4 w-4 ${i < score ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
    ))
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
                <Radar className="h-8 w-8 text-blue-500" />
                Bias Radar
              </h1>
              <p className="text-muted-foreground">Analyze media sources for political bias and credibility</p>
            </div>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Enter Source to Analyze</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    placeholder="Enter news source URL or name (e.g., CNN, Fox News, bbc.com)"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                  />

                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? "Analyzing..." : "Analyze Bias"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {result && (
              <Card>
                <CardHeader>
                  <CardTitle>Bias Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ParsedAnalysis analysis={result.analysis} />

                  {result.sources && result.sources.length > 0 && <SourcesList sources={result.sources} />}
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
      {loading && <LoadingSpinner message="Analyzing source bias..." />}
    </div>
  )
}
