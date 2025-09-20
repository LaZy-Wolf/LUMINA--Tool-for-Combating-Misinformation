"use client"

import type React from "react"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, ExternalLink } from "lucide-react"
import { toast } from "react-hot-toast"
import { ParsedAnalysis } from "@/components/parsed-analysis"
import { SourcesList } from "@/components/sources-list"
import { LoadingSpinner } from "@/components/loading-spinner"
import { urlSafety } from "@/utils/api"

interface URLSafetyResult {
  analysis: string
  sources: Array<{ title: string; url: string }>
}

export default function URLSafetyPage() {
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<URLSafetyResult | null>(null)

  const normalizeUrl = (inputUrl: string) => {
    if (!inputUrl.startsWith("http://") && !inputUrl.startsWith("https://")) {
      return `https://${inputUrl}`
    }
    return inputUrl
  }

  const handleSubmit = async (e: React.FormEvent, useForm = false) => {
    e.preventDefault()
    if (!url.trim()) {
      toast.error("Please enter a URL to check")
      return
    }

    const normalizedUrl = normalizeUrl(url.trim())
    setLoading(true)
    try {
      const response = await urlSafety(normalizedUrl, useForm)
      setResult(response)
      toast.success("Analysis complete!")
    } catch (error) {
      toast.error(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }

  const getRiskBadge = (risk: string) => {
    const lowerRisk = risk.toLowerCase()
    if (lowerRisk.includes("high") || lowerRisk.includes("dangerous")) {
      return <Badge variant="destructive">{risk}</Badge>
    }
    if (lowerRisk.includes("medium") || lowerRisk.includes("moderate")) {
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          {risk}
        </Badge>
      )
    }
    if (lowerRisk.includes("low") || lowerRisk.includes("safe")) {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          {risk}
        </Badge>
      )
    }
    return <Badge variant="outline">{risk}</Badge>
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
                <Shield className="h-8 w-8 text-blue-500" />
                URL Safety Check
              </h1>
              <p className="text-muted-foreground">Analyze websites for safety, phishing, malware, and credibility</p>
            </div>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Enter URL to Analyze</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-5 w-5 text-muted-foreground" />
                    <Input
                      type="url"
                      placeholder="https://example.com"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="flex-1"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={loading} className="flex-1">
                      {loading ? "Analyzing..." : "Check Safety (JSON)"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={loading}
                      onClick={(e) => handleSubmit(e, true)}
                      className="flex-1"
                    >
                      Check Safety (Form)
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {result && (
              <Card>
                <CardHeader>
                  <CardTitle>Safety Analysis</CardTitle>
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
      {loading && <LoadingSpinner message="Analyzing URL safety..." />}
    </div>
  )
}
