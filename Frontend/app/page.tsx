"use client"

import Link from "next/link"
import { ArrowRight, Shield, Zap, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { features } from "@/lib/constants"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-purple-600/5 to-cyan-600/5 animate-gradient-shift" />
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />

        {/* Animated gradient orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-96 h-96 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8 slide-in-up">
            <div className="inline-block px-4 py-2 bg-blue-500/10 rounded-full border border-blue-500/20 animate-pulse">
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Welcome to LUMINA</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
              <span
                style={{
                  background: "linear-gradient(to right, #2563eb, #9333ea, #06b6d4)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Your AI-Powered
              </span>
              <br />
              <span className="text-foreground">Truth Guardian</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Detect misinformation, verify content, and stay informed with advanced AI analysis. From fact-checking to
              deepfake detection, LUMINA has you covered.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" asChild className="smooth-transition hover:scale-105">
                <Link href="/fact-checker">
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="smooth-transition hover:bg-muted bg-transparent">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 text-foreground">Powerful Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <Link key={feature.id} href={feature.path}>
                <Card className="h-full card-hover cursor-pointer bg-card/50 backdrop-blur border-border/50 hover:border-accent/50">
                  <CardHeader>
                    <div
                      className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-lg p-2.5 mb-4 flex items-center justify-center`}
                    >
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-foreground">{feature.name}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="ghost"
                      className="w-full justify-start -ml-2 smooth-transition group text-foreground"
                    >
                      Try Now
                      <ArrowRight className="w-3 h-3 ml-2 group-hover:translate-x-1 smooth-transition" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 text-foreground">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Upload", desc: "Submit content - text, image, video, or URL" },
              { step: "02", title: "AI Analysis", desc: "Advanced algorithms analyze for authenticity" },
              { step: "03", title: "Get Results", desc: "Receive detailed reports with confidence scores" },
            ].map((item, idx) => (
              <div key={idx} className="text-center space-y-4 slide-in-up" style={{ animationDelay: `${idx * 100}ms` }}>
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full text-white font-bold text-xl">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-foreground">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 text-foreground">Why Trust LUMINA</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Shield, title: "Secure", desc: "Enterprise-grade security" },
              { icon: Zap, title: "Fast", desc: "Real-time analysis" },
              { icon: CheckCircle2, title: "Accurate", desc: "AI-powered verification" },
              { icon: Zap, title: "Reliable", desc: "99.9% uptime guaranteed" },
            ].map((item, idx) => (
              <Card key={idx} className="card-hover bg-card/50 border-border/50">
                <CardHeader>
                  <item.icon className="w-8 h-8 text-accent mb-2" />
                  <CardTitle className="text-lg text-foreground">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-muted/20 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-50"></div>
                  <span className="text-white font-black text-xs relative z-10">L</span>
                </div>
                <span
                  className="text-sm font-bold"
                  style={{
                    background: "linear-gradient(to right, #2563eb, #9333ea)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  LUMINA
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Your AI-Powered Truth Guardian</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-foreground">Features</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>Fact Checking</li>
                <li>Image Analysis</li>
                <li>Deepfake Detection</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-foreground">Legal</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
                <li>Contact</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border pt-8 text-center text-xs text-muted-foreground">
            <p className="mb-2">&copy; 2025 LUMINA. All rights reserved.</p>
            <p>
              Made with <span className="text-red-500">❤</span> by{" "}
              <span className="font-semibold text-foreground">Enigma's Team</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
