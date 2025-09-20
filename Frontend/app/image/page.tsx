"use client"

import type React from "react"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, ImageIcon } from "lucide-react"
import { toast } from "react-hot-toast"
import { ParsedAnalysis } from "@/components/parsed-analysis"
import { LoadingSpinner } from "@/components/loading-spinner"
import { imageAuthenticity } from "@/utils/api"

interface ImageResult {
  analysis: string
  confidence_score: number
  confidence_explanation: string
}

export default function ImagePage() {
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImageResult | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!image) {
      toast.error("Please select an image to analyze")
      return
    }

    setLoading(true)
    try {
      const response = await imageAuthenticity(image)
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
        toast.error("Please select an image file (JPG, PNG)")
        return
      }
      setImage(file)

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => setImagePreview(e.target?.result as string)
      reader.readAsDataURL(file)

      toast.success("Image uploaded")
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith("image/")) {
      setImage(file)

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => setImagePreview(e.target?.result as string)
      reader.readAsDataURL(file)

      toast.success("Image uploaded")
    } else {
      toast.error("Please drop an image file (JPG, PNG)")
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
                <ImageIcon className="h-8 w-8 text-blue-500" />
                Image Authenticity
              </h1>
              <p className="text-muted-foreground">Detect manipulated, deepfake, or AI-generated images</p>
            </div>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Upload Image for Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div
                    className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => document.getElementById("image-upload")?.click()}
                  >
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/jpeg,image/png,image/jpg"
                      onChange={handleImageChange}
                      className="hidden"
                    />

                    {imagePreview ? (
                      <div className="space-y-4">
                        <img
                          src={imagePreview || "/placeholder.svg"}
                          alt="Preview"
                          className="max-w-full max-h-64 mx-auto rounded-lg shadow-md"
                        />
                        <p className="text-sm text-muted-foreground">{image?.name}</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Upload className="h-16 w-16 text-muted-foreground mx-auto" />
                        <div>
                          <p className="text-lg font-medium text-foreground">Drop image here or click to upload</p>
                          <p className="text-sm text-muted-foreground">Supports JPG, PNG formats</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <Button type="submit" disabled={loading || !image} className="w-full">
                    {loading ? "Analyzing..." : "Analyze Image"}
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
      {loading && <LoadingSpinner message="Analyzing image authenticity..." />}
    </div>
  )
}
