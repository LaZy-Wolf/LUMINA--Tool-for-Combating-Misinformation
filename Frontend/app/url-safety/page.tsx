"use client"

import { useState } from "react"
import { Loader2, AlertCircle, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/header"
import { apiClient } from "@/utils/api-client"
import { verdictColors } from "@/lib/constants"
import { useToast } from "@/hooks/use-toast"

export default function URLSafety() {
  const { toast } = useToast()
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [history, setHistory] = useState<string[]>([])

  const handleScan = async (scanUrl: string = url) => {
    if (!scanUrl.trim()) {
      toast({ title: "Error", description: "Please enter a URL", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      const res = await apiClient.urlSafety(scanUrl)
      if (res.status === "success") {
        setResult(res)
        setHistory((prev) => {
          const updated = [scanUrl, ...prev.filter((h) => h !== scanUrl)].slice(0, 5)
          localStorage.setItem("urlHistory", JSON.stringify(updated))
          return updated
        })
        toast({ title: "Success", description: "URL scanned successfully" })
      } else {
        toast({ title: "Error", description: res.error || "Scan failed", variant: "destructive" })
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const getVerdictColor = (verdict: string) => {
    return verdictColors[verdict as keyof typeof verdictColors] || verdictColors.UNCLEAR
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">URL Safety Scanner</h1>
            <p className="text-muted-foreground">Check website credibility and identify potential threats</p>
          </div>

          {/* Scan Input */}
          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle>Scan URL</CardTitle>
              <CardDescription>Enter a website URL to check for security risks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={loading}
                  onKeyPress={(e) => e.key === "Enter" && handleScan()}
                />
                <Button onClick={() => handleScan()} disabled={loading} className="smooth-transition">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Scan"}
                </Button>
              </div>

              {/* Recent Scans */}
              {history.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Recent Scans</p>
                  <div className="flex flex-wrap gap-2">
                    {history.map((h, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleScan(h)}
                        className="text-xs px-2 py-1 rounded bg-muted hover:bg-muted/80 smooth-transition truncate max-w-xs"
                        title={h}
                      >
                        {new URL(h).hostname}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results */}
          {result && (
            <div className="space-y-4 fade-in">
              <Card className={`border-border/50 ${getVerdictColor(result.verdict).bg}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Scan Results</CardTitle>
                      <CardDescription>
                        {result.verdict === "SAFE" ? "✓ Website appears safe" : "⚠ Potential risks detected"}
                      </CardDescription>
                    </div>
                    <Badge className={getVerdictColor(result.verdict).badge}>{result.verdict}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Risk Assessment */}
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Risk Assessment
                    </h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{result.risk_analysis}</p>
                  </div>

                  {/* Recommendations */}
                  <div className="space-y-3">
                    <h3 className="font-semibold">Safety Recommendations</h3>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      {result.recommendations?.split("\n").map((rec: string, idx: number) => (
                        <li key={idx} className="flex gap-2">
                          <span>•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Confidence */}
                  <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                    <span className="text-sm font-medium">Confidence Level</span>
                    <Badge variant="outline">{result.confidence}</Badge>
                  </div>

                  {/* Sources */}
                  {result.sources && result.sources.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Sources Consulted</p>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {result.sources.map((source: any, idx: number) => (
                          <a
                            key={idx}
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-accent hover:text-primary flex items-center gap-1 smooth-transition break-all"
                          >
                            {source.title}
                            <ExternalLink className="w-2 h-2 flex-shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Button
                onClick={() => {
                  setResult(null)
                  setUrl("")
                }}
                variant="outline"
                className="w-full"
              >
                Scan Another URL
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
