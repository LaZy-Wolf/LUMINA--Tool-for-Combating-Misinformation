"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, Search } from "lucide-react"
import { toast } from "react-hot-toast"
import { ParsedAnalysis } from "@/components/parsed-analysis"
import { SourcesList } from "@/components/sources-list"
import { factCheck } from "@/utils/api"

interface FactCheckResult {
  analysis: string
  sources: Array<{ title: string; url: string }>
  confidence_score: number
  confidence_explanation: string
}

export function QuickFactCheck() {
  const [claim, setClaim] = useState("")
  const [image, setImage] = useState<File | null>(null)
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
      const response = await factCheck(claim, image)
      console.log("[v0] API Response:", response)
      console.log("[v0] Confidence Score:", response.confidence_score)
      console.log("[v0] Confidence Explanation:", response.confidence_explanation)
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-blue-500" />
            Quick Fact Check
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Textarea
                placeholder="Enter a claim to fact-check..."
                value={claim}
                onChange={(e) => setClaim(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  <Button type="button" variant="outline" size="sm" className="w-full bg-transparent">
                    <Upload className="h-4 w-4 mr-2" />
                    {image ? image.name : "Upload Image (Optional)"}
                  </Button>
                </label>
              </div>

              <Button type="submit" disabled={loading} className="px-8">
                {loading ? "Analyzing..." : "Fact Check"}
              </Button>
            </div>
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
  )
}

export default QuickFactCheck
