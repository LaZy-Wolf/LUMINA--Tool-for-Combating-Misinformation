"use client"

import { useState } from "react"
import { Loader2, Radio, Link2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Header } from "@/components/header"
import { apiClient } from "@/utils/api-client"
import { useToast } from "@/hooks/use-toast"

export default function MediaBias() {
  const { toast } = useToast()
  const [inputMode, setInputMode] = useState<"source" | "url">("source")
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleAnalyze = async () => {
    if (!input.trim()) {
      toast({ title: "Error", description: "Please enter a source or URL", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      const res = await apiClient.mediaAnalysis(input)
      if (res.status === "success") {
        setResult(res)
        toast({ title: "Success", description: "Analysis complete" })
      } else {
        toast({ title: "Error", description: res.error || "Analysis failed", variant: "destructive" })
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const biasSpectrum = [
    { label: "Far Left", value: 0 },
    { label: "Left", value: 25 },
    { label: "Center-Left", value: 37 },
    { label: "Center", value: 50 },
    { label: "Center-Right", value: 63 },
    { label: "Right", value: 75 },
    { label: "Far Right", value: 100 },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">Media Bias Radar</h1>
            <p className="text-muted-foreground">Analyze news sources and articles for political bias</p>
          </div>

          {/* Input Section */}
          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle>Analyze Media</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Mode Selection */}
              <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as "source" | "url")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="source" className="flex items-center gap-2">
                    <Radio className="w-4 h-4" />
                    News Source
                  </TabsTrigger>
                  <TabsTrigger value="url" className="flex items-center gap-2">
                    <Link2 className="w-4 h-4" />
                    Article URL
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="source" className="space-y-4 mt-4">
                  <Input
                    placeholder="e.g., CNN, BBC, Fox News"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={loading}
                    onKeyPress={(e) => e.key === "Enter" && handleAnalyze()}
                  />
                </TabsContent>

                <TabsContent value="url" className="space-y-4 mt-4">
                  <Input
                    placeholder="https://example.com/article"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={loading}
                    onKeyPress={(e) => e.key === "Enter" && handleAnalyze()}
                  />
                </TabsContent>
              </Tabs>

              <Button onClick={handleAnalyze} disabled={loading} className="w-full smooth-transition">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  "Analyze Bias"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          {result && result.analysis_type === "bias_rating" && (
            <Card className="border-border/50 bg-card/50 fade-in">
              <CardHeader>
                <CardTitle>Bias Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Bias Spectrum */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Political Leaning</h3>
                  <div className="space-y-2">
                    <div className="h-3 bg-gradient-to-r from-red-600 via-yellow-500 to-blue-600 rounded-full relative">
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-2 h-5 bg-foreground rounded-sm shadow-lg"
                        style={{
                          left: `${(Number.parseInt(result.balance_score || "50") / 10) * 10}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Left</span>
                      <span>Center</span>
                      <span>Right</span>
                    </div>
                  </div>
                  <Badge className="w-fit">{result.bias_rating}</Badge>
                </div>

                {/* Balance Score */}
                <div className="space-y-2">
                  <p className="font-medium">Balance Score: {result.balance_score}/10</p>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-orange-500 to-green-500 h-full"
                      style={{ width: `${(Number.parseInt(result.balance_score || "0") / 10) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Analysis */}
                <div className="space-y-2">
                  <h3 className="font-semibold">Detailed Analysis</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{result.bias_analysis}</p>
                </div>

                {/* Tips */}
                <Alert>
                  <AlertDescription>
                    <p className="font-medium mb-2">Tips for Balanced Media Consumption</p>
                    <p className="text-sm">{result.tips}</p>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}

          {result && result.analysis_type === "neutral_summary" && (
            <Card className="border-border/50 bg-card/50 fade-in">
              <CardHeader>
                <CardTitle>Neutral Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Neutral Summary */}
                <div className="space-y-2">
                  <h3 className="font-semibold">Balanced Summary</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{result.neutral_summary}</p>
                </div>

                {/* Alternative Views */}
                <div className="space-y-3">
                  <h3 className="font-semibold">Other Perspectives</h3>
                  <div className="space-y-2">
                    {result.alternative_views
                      ?.split("\n")
                      .filter((v: string) => v.trim())
                      .map((view: string, idx: number) => (
                        <div key={idx} className="text-sm text-muted-foreground flex gap-2">
                          <span>•</span>
                          <span>{view.trim()}</span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Tips */}
                <Alert>
                  <AlertDescription>
                    <p className="font-medium mb-2">How to Spot Bias</p>
                    <p className="text-sm whitespace-pre-wrap">{result.education_tips}</p>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}

          {result && (
            <Button
              onClick={() => {
                setResult(null)
                setInput("")
              }}
              variant="outline"
              className="w-full"
            >
              Analyze Another Source
            </Button>
          )}
        </div>
      </main>
    </div>
  )
}
