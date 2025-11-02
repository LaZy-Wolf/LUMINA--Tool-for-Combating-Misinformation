"use client"

import { useState } from "react"
import { Loader2, Upload, Trash2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Header } from "@/components/header"
import { apiClient } from "@/utils/api-client"
import { verdictColors } from "@/lib/constants"
import { useToast } from "@/hooks/use-toast"

export default function VideoDeepfake() {
  const { toast } = useToast()
  const [video, setVideo] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleAnalyze = async () => {
    if (!video) {
      toast({ title: "Error", description: "Please select a video", variant: "destructive" })
      return
    }

    if (video.size > 15 * 1024 * 1024) {
      toast({ title: "Error", description: "Video must be less than 15MB", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      const res = await apiClient.videoAuthenticity(video)
      if (res.status === "success") {
        setResult(res)
        toast({ title: "Success", description: "Video analyzed successfully" })
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
    return verdictColors[verdict as keyof typeof verdictColors] || verdictColors.UNCLEAR
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">Deepfake Video Detector</h1>
            <p className="text-muted-foreground">Identify deepfakes and manipulated videos with AI analysis</p>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Video analysis may take 30-60 seconds. Maximum file size: 15MB (MP4, MOV, AVI, WEBM)
            </AlertDescription>
          </Alert>

          {!result ? (
            <Card className="border-border/50 bg-card/50">
              <CardHeader>
                <CardTitle>Upload Video</CardTitle>
                <CardDescription>Select a video file to analyze for deepfakes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div
                  className="border-2 border-dashed border-border/50 rounded-lg p-12 text-center hover:border-accent/50 smooth-transition cursor-pointer"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    const file = e.dataTransfer.files[0]
                    if (file?.type.startsWith("video/")) setVideo(file)
                  }}
                  onClick={() => document.getElementById("video-input")?.click()}
                >
                  {video ? (
                    <div className="space-y-2">
                      <p className="text-lg font-medium">{video.name}</p>
                      <p className="text-sm text-muted-foreground">{(video.size / 1024 / 1024).toFixed(2)} MB</p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          setVideo(null)
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                      <p className="text-lg font-medium">Drag and drop your video</p>
                      <p className="text-sm text-muted-foreground">or click to browse</p>
                    </div>
                  )}
                </div>
                <input
                  id="video-input"
                  type="file"
                  accept="video/*"
                  onChange={(e) => e.target.files?.[0] && setVideo(e.target.files[0])}
                  className="hidden"
                  disabled={loading}
                />

                <Button onClick={handleAnalyze} disabled={loading || !video} className="w-full smooth-transition">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing video...
                    </>
                  ) : (
                    "Analyze Video"
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border/50 bg-card/50 fade-in">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Analysis Results</CardTitle>
                  <Badge className={getVerdictColor(result.verdict).badge}>{result.verdict.replace("_", " ")}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Verdict Banner */}
                <Alert className={`border-2 ${getVerdictColor(result.verdict).bg}`}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className={getVerdictColor(result.verdict).text}>
                    {result.verdict === "LIKELY_AUTHENTIC" && "This video appears to be authentic"}
                    {result.verdict === "MANIPULATED" && "This video shows signs of manipulation"}
                    {result.verdict === "DEEPFAKE" && "This video is likely a deepfake"}
                    {result.verdict === "UNCLEAR" && "The authenticity of this video is unclear"}
                  </AlertDescription>
                </Alert>

                {/* Confidence Gauge */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="font-medium">Confidence Score</p>
                    <p className="text-2xl font-bold">{result.confidence_score}%</p>
                  </div>
                  <Progress value={result.confidence_score} className="h-3" />
                </div>

                {/* Analysis */}
                <div className="space-y-2">
                  <h3 className="font-semibold">Video Analysis Report</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{result.analysis}</p>
                </div>

                {/* Implications */}
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-medium mb-2">Implications</p>
                    <p className="text-sm">{result.potential_implications}</p>
                  </AlertDescription>
                </Alert>

                {/* Confidence Explanation */}
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm">
                    <span className="font-medium">Analysis Note:</span> {result.confidence_explanation}
                  </p>
                </div>

                {/* Actions */}
                <Button
                  onClick={() => {
                    setResult(null)
                    setVideo(null)
                  }}
                  className="w-full smooth-transition"
                >
                  Analyze Another Video
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
