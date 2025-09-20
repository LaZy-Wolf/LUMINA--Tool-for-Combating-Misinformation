"use client"

import type React from "react"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, CheckCircle } from "lucide-react"
import { toast } from "react-hot-toast"
import { ParsedAnalysis } from "@/components/parsed-analysis"
import { SourcesList } from "@/components/sources-list"
import { LoadingSpinner } from "@/components/loading-spinner"
import { factCheck } from "@/utils/api"

interface FactCheckResult {
  analysis: string
  sources: Array<{ title: string; url: string }>
  confidence_score: number
  confidence_explanation: string
}

export default function FactCheckPage() {
  const [claim, setClaim] = useState("")
  const [image, setImage] = useState<File | null>(null)
  const [language, setLanguage] = useState("en")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<FactCheckResult | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!claim.trim()) {
      toast.error("Please enter a claim to fact-check")
      return
    }

    setLoading(true)
    try {
      const response = await factCheck(claim, image, language)
      setResult(response)
      toast.success("Analysis complete!")
    } catch (error) {
      toast.error(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file")
        return
      }
      setImage(file)
      toast.success("Image uploaded")
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith("image/")) {
      setImage(file)
      toast.success("Image uploaded")
    } else {
      toast.error("Please drop an image file")
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
                <CheckCircle className="h-8 w-8 text-blue-500" />
                Fact Check
              </h1>
              <p className="text-muted-foreground">Verify claims and detect misinformation with AI-powered analysis</p>
            </div>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Submit Claim for Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Claim to Fact-Check</label>
                    <Textarea
                      placeholder="Enter the claim you want to fact-check..."
                      value={claim}
                      onChange={(e) => setClaim(e.target.value)}
                      className="min-h-[120px]"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Language</label>
                      <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Spanish</SelectItem>
                          <SelectItem value="fr">French</SelectItem>
                          <SelectItem value="de">German</SelectItem>
                          <SelectItem value="it">Italian</SelectItem>
                          <SelectItem value="pt">Portuguese</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Supporting Image (Optional)
                      </label>
                      <div
                        className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 transition-colors"
                        onDrop={handleDrop}
                        onDragOver={(e) => e.preventDefault()}
                        onClick={() => document.getElementById("image-upload")?.click()}
                      >
                        <input
                          id="image-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          {image ? image.name : "Drop image here or click to upload"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? "Analyzing..." : "Fact Check"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {result && (
              <Card>
                <CardHeader>
                  <CardTitle>Analysis Results</CardTitle>
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
      {loading && <LoadingSpinner message="Analyzing claim..." />}
    </div>
  )
}
