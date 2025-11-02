"use client"

import { useState } from "react"
import { Loader2, Upload, Trash2, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Header } from "@/components/header"
import { apiClient } from "@/utils/api-client"
import { verdictColors } from "@/lib/constants"
import { useToast } from "@/hooks/use-toast"

export default function FactChecker() {
  const { toast } = useToast()
  const [claims, setClaims] = useState("")
  const [image, setImage] = useState<File | null>(null)
  const [language, setLanguage] = useState("en")
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [expandedSources, setExpandedSources] = useState<number[]>([])

  const handleAnalyze = async () => {
    if (!claims.trim() && !image) {
      toast({ title: "Error", description: "Please enter claims or upload an image", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      const res = await apiClient.factCheck(claims, image || undefined, language)
      if (res.status === "success") {
        setResults(res.results || [])
        toast({ title: "Success", description: "Claims analyzed successfully" })
      } else {
        toast({ title: "Error", description: res.error || "Analysis failed", variant: "destructive" })
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
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-foreground">AI Fact Checker</h1>
            <p className="text-muted-foreground">Verify claims with advanced AI analysis and trusted sources</p>
          </div>

          {/* Input Section */}
          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle className="text-foreground">Analyze Claims</CardTitle>
              <CardDescription>Enter multiple claims (one per line) or upload an image for OCR</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Claims Textarea */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Text Claims</label>
                <Textarea
                  placeholder="Enter claims to verify, one per line..."
                  value={claims}
                  onChange={(e) => setClaims(e.target.value)}
                  rows={6}
                  className="resize-none bg-background text-foreground"
                  disabled={loading}
                />
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Image Upload (Optional)</label>
                <div
                  className="border-2 border-dashed border-border/50 rounded-lg p-8 text-center hover:border-accent/50 smooth-transition cursor-pointer bg-muted/20"
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => document.getElementById("image-input")?.click()}
                >
                  {image ? (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground">{image.name}</p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          setImage(null)
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Drag and drop an image or click to browse</p>
                    </div>
                  )}
                </div>
                <input
                  id="image-input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImage(e.target.files?.[0] || null)}
                  className="hidden"
                  disabled={loading}
                />
              </div>

              {/* Language & Analyze */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Preferred Language</label>
                  <Select value={language} onValueChange={setLanguage} disabled={loading}>
                    <SelectTrigger className="bg-background text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="zh">Chinese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleAnalyze} disabled={loading} className="w-full smooth-transition">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing claims...
                    </>
                  ) : (
                    "Analyze Claims"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {results.length > 0 && (
            <div className="space-y-4 fade-in">
              <h2 className="text-2xl font-bold text-foreground">Results</h2>
              {results.map((result, idx) => {
                const colors = getVerdictColor(result.verdict)
                return (
                  <Card key={idx} className={`border-l-4 ${colors.bg} border-border/50`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <p className="font-medium text-foreground">{result.claim}</p>
                          <Badge className={colors.badge}>{result.verdict.replace("_", " ")}</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Confidence Score */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-medium text-foreground">Confidence Score</span>
                          <span className="text-foreground">{result.confidence_score}%</span>
                        </div>
                        <Progress value={result.confidence_score} className="h-2" />
                        <p className="text-xs text-muted-foreground">{result.confidence_explanation}</p>
                      </div>

                      {/* Analysis */}
                      <div className="space-y-2">
                        <p className="font-medium text-sm text-foreground">Analysis</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">{result.analysis}</p>
                      </div>

                      {/* Sources */}
                      {result.sources && result.sources.length > 0 && (
                        <div className="space-y-2">
                          <button
                            onClick={() =>
                              setExpandedSources((exp) =>
                                exp.includes(idx) ? exp.filter((i) => i !== idx) : [...exp, idx],
                              )
                            }
                            className="text-sm font-medium text-foreground hover:text-accent smooth-transition"
                          >
                            {expandedSources.includes(idx) ? "▼" : "▶"} Sources ({result.sources.length})
                          </button>
                          {expandedSources.includes(idx) && (
                            <div className="space-y-2 pl-4">
                              {result.sources.map((source: any, sidx: number) => (
                                <a
                                  key={sidx}
                                  href={source.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-sm text-accent hover:text-primary smooth-transition break-all"
                                >
                                  {source.title}
                                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
