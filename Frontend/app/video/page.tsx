"use client"

import type React from "react"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, Video, AlertTriangle } from "lucide-react"
import { toast } from "react-hot-toast"
import { ParsedAnalysis } from "@/components/parsed-analysis"
import { LoadingSpinner } from "@/components/loading-spinner"
import { videoAuthenticity } from "@/utils/api"

interface VideoResult {
  analysis: string
  confidence_score: number
  confidence_explanation: string
}

export default function VideoPage() {
  const [video, setVideo] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<VideoResult | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!video) {
      toast.error("Please select a video to analyze")
      return
    }

    if (video.size > 10 * 1024 * 1024) {
      toast.error("Video file must be less than 10MB")
      return
    }

    setLoading(true)
    try {
      const response = await videoAuthenticity(video)
      setResult(response)
      toast.success("Analysis complete!")
    } catch (error) {
      toast.error(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith("video/")) {
        toast.error("Please select a video file (MP4)")
        return
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error("Video file must be less than 10MB")
        return
      }

      setVideo(file)

      // Create preview
      const url = URL.createObjectURL(file)
      setVideoPreview(url)

      toast.success("Video uploaded")
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith("video/")) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Video file must be less than 10MB")
        return
      }

      setVideo(file)

      // Create preview
      const url = URL.createObjectURL(file)
      setVideoPreview(url)

      toast.success("Video uploaded")
    } else {
      toast.error("Please drop a video file (MP4)")
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
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
                <Video className="h-8 w-8 text-blue-500" />
                Video Authenticity
              </h1>
              <p className="text-muted-foreground">Detect deepfake videos and manipulated content</p>
            </div>

            <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Maximum file size: 10MB. Larger files may take longer to process.
                </p>
              </div>
            </div>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Upload Video for Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div
                    className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => document.getElementById("video-upload")?.click()}
                  >
                    <input
                      id="video-upload"
                      type="file"
                      accept="video/mp4,video/webm,video/ogg"
                      onChange={handleVideoChange}
                      className="hidden"
                    />

                    {videoPreview ? (
                      <div className="space-y-4">
                        <video
                          src={videoPreview}
                          controls
                          className="max-w-full max-h-64 mx-auto rounded-lg shadow-md"
                        />
                        <div className="text-sm text-muted-foreground">
                          <p>{video?.name}</p>
                          <p>{video && formatFileSize(video.size)}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Upload className="h-16 w-16 text-muted-foreground mx-auto" />
                        <div>
                          <p className="text-lg font-medium text-foreground">Drop video here or click to upload</p>
                          <p className="text-sm text-muted-foreground">Supports MP4, WebM, OGG formats (max 10MB)</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <Button type="submit" disabled={loading || !video} className="w-full">
                    {loading ? "Analyzing..." : "Analyze Video"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {result && (
              <Card>
                <CardHeader>
                  <CardTitle>Authenticity Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ParsedAnalysis analysis={result.analysis} />
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
      {loading && <LoadingSpinner message="Analyzing video authenticity..." />}
    </div>
  )
}
