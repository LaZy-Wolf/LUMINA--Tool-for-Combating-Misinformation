"use client"

import type React from "react"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { FileText, ChevronDown, ChevronRight, AlertTriangle } from "lucide-react"
import { toast } from "react-hot-toast"
import { ParsedAnalysis } from "@/components/parsed-analysis"
import { SourcesList } from "@/components/sources-list"
import { LoadingSpinner } from "@/components/loading-spinner"
import { batchFactCheck } from "@/utils/api"

interface BatchResult {
  results: Array<{
    claim: string
    analysis: string
    sources: Array<{ title: string; url: string }>
    confidence_score: number
    confidence_explanation: string
  }>
}

export default function BatchPage() {
  const [claimsText, setClaimsText] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<BatchResult | null>(null)
  const [openItems, setOpenItems] = useState<Set<number>>(new Set())

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!claimsText.trim()) {
      toast.error("Please enter claims to fact-check")
      return
    }

    const claims = claimsText
      .split(",")
      .map((claim) => claim.trim())
      .filter((claim) => claim.length > 0)

    if (claims.length === 0) {
      toast.error("Please enter at least one claim")
      return
    }

    if (claims.length > 5) {
      toast.error("Maximum 5 claims allowed per batch")
      return
    }

    setLoading(true)
    try {
      const response = await batchFactCheck(claims)
      setResult(response)
      toast.success("Batch analysis complete!")
    } catch (error) {
      toast.error(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }

  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems)
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index)
    } else {
      newOpenItems.add(index)
    }
    setOpenItems(newOpenItems)
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
                <FileText className="h-8 w-8 text-blue-500" />
                Batch Fact Check
              </h1>
              <p className="text-muted-foreground">Fact-check multiple claims simultaneously</p>
            </div>

            <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Maximum 5 claims per batch. Separate claims with commas.
                </p>
              </div>
            </div>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Enter Claims to Fact-Check</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Textarea
                    placeholder="Enter claims separated by commas (e.g., The Earth is flat, Vaccines cause autism, Climate change is a hoax)"
                    value={claimsText}
                    onChange={(e) => setClaimsText(e.target.value)}
                    className="min-h-[120px]"
                  />

                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? "Analyzing..." : "Batch Fact Check"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {result && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground">Batch Results</h2>
                {result.results.map((item, index) => (
                  <Card key={index}>
                    <Collapsible open={openItems.has(index)} onOpenChange={() => toggleItem(index)}>
                      <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                          <CardTitle className="flex items-center justify-between">
                            <span className="text-left">{item.claim}</span>
                            {openItems.has(index) ? (
                              <ChevronDown className="h-5 w-5" />
                            ) : (
                              <ChevronRight className="h-5 w-5" />
                            )}
                          </CardTitle>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="space-y-6">
                          <ParsedAnalysis analysis={item.analysis} />

                          {item.sources && item.sources.length > 0 && <SourcesList sources={item.sources} />}
                        </CardContent>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
      {loading && <LoadingSpinner message="Analyzing batch claims..." />}
    </div>
  )
}
