"use client"

import { useState } from "react"
import { Loader2, Upload, Trash2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Header } from "@/components/header"
import { apiClient } from "@/utils/api-client"
import { verdictColors } from "@/lib/constants"
import { useToast } from "@/hooks/use-toast"

export default function ImageAuthenticity() {
  const { toast } = useToast()
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleImageSelect = (file: File) => {
    setImage(file)
    const reader = new FileReader()
    reader.onloadend = () => setPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleAnalyze = async () => {
    if (!image) {
      toast({ title: "Error", description: "Please select an image", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      const res = await apiClient.imageAuthenticity(image)
      if (res.status === "success") {
        setResult(res)
        toast({ title: "Success", description: "Image analyzed successfully" })
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
            <h1 className="text-4xl font-bold">Image Authenticity Analyzer</h1>
            <p className="text-muted-foreground">Detect manipulated or AI-generated images with forensic analysis</p>
          </div>

          {!result ? (
            <>
              {/* Upload Zone */}
              <Card className="border-border/50 bg-card/50">
                <CardHeader>
                  <CardTitle>Upload Image</CardTitle>
                  <CardDescription>Select an image to analyze for authenticity</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Image Preview */}
                  {preview ? (
                    <div className="relative group">
                      <img
                        src={preview || "/placeholder.svg"}
                        alt="Preview"
                        className="w-full rounded-lg max-h-96 object-contain"
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setImage(null)
                          setPreview("")
                        }}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 smooth-transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="border-2 border-dashed border-border/50 rounded-lg p-12 text-center hover:border-accent/50 smooth-transition cursor-pointer"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault()
                        const file = e.dataTransfer.files[0]
                        if (file?.type.startsWith("image/")) handleImageSelect(file)
                      }}
                      onClick={() => document.getElementById("image-input")?.click()}
                    >
                      <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-lg font-medium mb-2">Drag and drop your image</p>
                      <p className="text-sm text-muted-foreground">or click to browse</p>
                    </div>
                  )}
                  <input
                    id="image-input"
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleImageSelect(e.target.files[0])}
                    className="hidden"
                    disabled={loading}
                  />

                  <Button onClick={handleAnalyze} disabled={loading || !image} className="w-full smooth-transition">
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing image...
                      </>
                    ) : (
                      "Analyze Image"
                    )}
                  </Button>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              {/* Results */}
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
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className={getVerdictColor(result.verdict).text}>
                      {result.verdict === "LIKELY_AUTHENTIC" && "This image appears to be authentic"}
                      {result.verdict === "MANIPULATED" && "This image shows signs of manipulation"}
                      {result.verdict === "AI_GENERATED" && "This image appears to be AI-generated"}
                      {result.verdict === "UNCLEAR" && "The authenticity of this image is unclear"}
                    </AlertDescription>
                  </Alert>

                  {/* Confidence Meter */}
                  <div className="space-y-2">
                    <p className="font-medium">Confidence Score: {result.confidence_score}%</p>
                    <div className="relative w-full h-4 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-background/50 flex items-center justify-end pr-2"
                        style={{ width: `${100 - result.confidence_score}%` }}
                      >
                        <div className="w-1 h-6 bg-foreground/50 rounded" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{result.confidence_explanation}</p>
                  </div>

                  {/* Forensic Analysis */}
                  <div className="space-y-2">
                    <h3 className="font-semibold">Forensic Analysis</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{result.analysis}</p>
                  </div>

                  {/* Potential Implications */}
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <p className="font-medium mb-2">Potential Implications</p>
                      <p className="text-sm">{result.potential_implications}</p>
                    </AlertDescription>
                  </Alert>

                  {/* Actions */}
                  <Button
                    onClick={() => {
                      setResult(null)
                      setImage(null)
                      setPreview("")
                    }}
                    className="w-full smooth-transition"
                  >
                    Try Another Image
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
