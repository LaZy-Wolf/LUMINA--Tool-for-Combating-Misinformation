"use client"

import type React from "react"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SearchIcon, ExternalLink } from "lucide-react"
import { toast } from "react-hot-toast"
import { LoadingSpinner } from "@/components/loading-spinner"
import { search } from "@/utils/api"

interface SearchResult {
  query: string
  results: Array<{
    title: string
    url: string
    content: string
  }>
}

export default function SearchPage() {
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SearchResult | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) {
      toast.error("Please enter a search query")
      return
    }

    setLoading(true)
    try {
      const response = await search(query.trim())
      setResult(response)
      toast.success("Search complete!")
    } catch (error) {
      toast.error(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setLoading(false)
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
                <SearchIcon className="h-8 w-8 text-blue-500" />
                Search
              </h1>
              <p className="text-muted-foreground">Search for fact-checked information and verified sources</p>
            </div>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Search Query</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter your search query..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="flex-1"
                    />
                    <Button type="submit" disabled={loading}>
                      {loading ? "Searching..." : "Search"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {result && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-foreground">Search Results</h2>
                  <p className="text-sm text-muted-foreground">
                    {result.results.length} results for "{result.query}"
                  </p>
                </div>

                {result.results.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <p className="text-muted-foreground">No results found for your query.</p>
                    </CardContent>
                  </Card>
                ) : (
                  result.results.map((item, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle className="flex items-start justify-between gap-4">
                          <span className="text-left">{item.title}</span>
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-600 flex-shrink-0"
                          >
                            <ExternalLink className="h-5 w-5" />
                          </a>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-blue-600 mb-2">{item.url}</p>
                        <p className="text-muted-foreground">{item.content}</p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </div>
        </main>
      </div>
      {loading && <LoadingSpinner message="Searching..." />}
    </div>
  )
}
