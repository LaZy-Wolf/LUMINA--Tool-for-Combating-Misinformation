"use client"

import { useState } from "react"
import { Loader2, AlertTriangle, Share2, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Header } from "@/components/header"
import { apiClient } from "@/utils/api-client"
import { verdictColors } from "@/lib/constants"
import { useToast } from "@/hooks/use-toast"

export default function SocialMediaContext() {
  const { toast } = useToast()
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleVerify = async () => {
    if (!url.trim()) {
      toast({ title: "Error", description: "Please enter a post URL", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      const res = await apiClient.socialMediaContext(url)
      if (res.status === "success") {
        setResult(res)
        toast({ title: "Success", description: "Post verified successfully" })
      } else {
        toast({ title: "Error", description: res.error || "Verification failed", variant: "destructive" })
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const getVerdictColor = (verdict: string) => {
    return verdictColors[verdict as keyof typeof verdictColors] || verdictColors.UNVERIFIABLE
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">Social Media Post Verifier</h1>
            <p className="text-muted-foreground">Verify social media posts and fact-check embedded claims</p>
          </div>

          {/* Input Section */}
          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle>Enter Post URL</CardTitle>
              <CardDescription>Paste a URL from X (Twitter), Facebook, Reddit, or Instagram</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="https://x.com/username/status/123456789"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={loading}
                  onKeyPress={(e) => e.key === "Enter" && handleVerify()}
                />
                <Button onClick={handleVerify} disabled={loading} className="smooth-transition">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {result && (
            <div className="space-y-4 fade-in">
              {/* Context Analysis */}
              <Card className="border-border/50 bg-card/50">
                <CardHeader>
                  <CardTitle>Context & Credibility Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">{result.context_analysis}</p>
                </CardContent>
              </Card>

              {/* Fact Check Result */}
              {result.fact_check_result && (
                <Card
                  className={`border-l-4 ${result.fact_check_result.verdict ? getVerdictColor(result.fact_check_result.verdict).bg : ""}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <CardTitle>Extracted Claim</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {result.fact_check_result.claim || "No specific claim detected"}
                        </p>
                      </div>
                      {result.fact_check_result.verdict && (
                        <Badge className={getVerdictColor(result.fact_check_result.verdict).badge}>
                          {result.fact_check_result.verdict.replace("_", " ")}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  {result.fact_check_result.verdict && (
                    <CardContent className="space-y-4">
                      {/* Confidence */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-medium">Confidence</span>
                          <span>{result.fact_check_result.confidence_score}%</span>
                        </div>
                        <Progress value={result.fact_check_result.confidence_score} className="h-2" />
                      </div>

                      {/* Analysis */}
                      <div className="space-y-2">
                        <p className="font-medium text-sm">Analysis</p>
                        <p className="text-sm text-muted-foreground">{result.fact_check_result.analysis}</p>
                      </div>

                      {/* Sources */}
                      {result.fact_check_result.sources?.length > 0 && (
                        <div className="space-y-2">
                          <p className="font-medium text-sm">Sources</p>
                          <div className="space-y-1">
                            {result.fact_check_result.sources.map((source: any, idx: number) => (
                              <a
                                key={idx}
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-accent hover:text-primary flex items-center gap-1 smooth-transition break-all"
                              >
                                {source.title}
                                <ExternalLink className="w-3 h-3 flex-shrink-0" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              )}

              {/* Warning if Misleading */}
              {result.fact_check_result?.verdict === "FALSE" && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    ⚠️ This post may contain misleading information. Please share with caution.
                  </AlertDescription>
                </Alert>
              )}

              {!result.fact_check_result?.verdict && (
                <Alert>
                  <AlertDescription>ℹ️ No specific factual claim detected in this post.</AlertDescription>
                </Alert>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 smooth-transition bg-transparent">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Verification
                </Button>
                <Button
                  onClick={() => {
                    setResult(null)
                    setUrl("")
                  }}
                  variant="outline"
                  className="flex-1 smooth-transition"
                >
                  Verify Another Post
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
