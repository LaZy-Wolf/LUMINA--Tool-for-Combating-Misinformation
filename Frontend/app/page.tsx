import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { QuickFactCheck } from "@/components/quick-fact-check"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="md:ml-64">
        <Header />
        <main className="p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-500 bg-clip-text text-transparent mb-2">
                LUMINA Truth Detection
              </h1>
              <p className="text-muted-foreground">
                Advanced AI-powered misinformation detection and fact-checking. Illuminating truth through intelligent
                analysis.
              </p>
            </div>

            <QuickFactCheck />
          </div>
        </main>
      </div>
    </div>
  )
}
