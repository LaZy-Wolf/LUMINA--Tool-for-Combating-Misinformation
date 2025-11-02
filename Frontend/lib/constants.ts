import { CheckCircle2, ImageIcon, Video, Globe, BarChart3, MessageCircle } from "lucide-react"

export const features = [
  {
    id: "fact-checker",
    name: "Fact Checker",
    description: "Verify claims with AI",
    icon: CheckCircle2,
    path: "/fact-checker",
    color: "from-blue-600 to-cyan-600",
  },
  {
    id: "image-authenticity",
    name: "Image Authenticity",
    description: "Detect AI-generated images",
    icon: ImageIcon,
    path: "/image-authenticity",
    color: "from-purple-600 to-pink-600",
  },
  {
    id: "video-deepfake",
    name: "Video Deepfake",
    description: "Identify deepfakes",
    icon: Video,
    path: "/video-deepfake",
    color: "from-orange-600 to-red-600",
  },
  {
    id: "url-safety",
    name: "URL Safety",
    description: "Check website safety",
    icon: Globe,
    path: "/url-safety",
    color: "from-green-600 to-emerald-600",
  },
  {
    id: "media-bias",
    name: "Media Bias Radar",
    description: "Analyze news bias",
    icon: BarChart3,
    path: "/media-bias",
    color: "from-indigo-600 to-blue-600",
  },
  {
    id: "social-media",
    name: "Social Media",
    description: "Verify posts & claims",
    icon: MessageCircle,
    path: "/social-media-context",
    color: "from-pink-600 to-purple-600",
  },
]

export const verdictColors = {
  TRUE: {
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-700 dark:text-green-400",
    badge: "bg-green-500/20 text-green-700 dark:text-green-300",
  },
  FALSE: {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-700 dark:text-red-400",
    badge: "bg-red-500/20 text-red-700 dark:text-red-300",
  },
  MISLEADING: {
    bg: "bg-orange-100 dark:bg-orange-900/30",
    text: "text-orange-700 dark:text-orange-400",
    badge: "bg-orange-500/20 text-orange-700 dark:text-orange-300",
  },
  PARTIALLY_TRUE: {
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    text: "text-yellow-700 dark:text-yellow-400",
    badge: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300",
  },
  UNVERIFIABLE: {
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-700 dark:text-gray-400",
    badge: "bg-gray-500/20 text-gray-700 dark:text-gray-300",
  },
  LIKELY_AUTHENTIC: {
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-700 dark:text-green-400",
    badge: "bg-green-500/20 text-green-700 dark:text-green-300",
  },
  MANIPULATED: {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-700 dark:text-red-400",
    badge: "bg-red-500/20 text-red-700 dark:text-red-300",
  },
  AI_GENERATED: {
    bg: "bg-purple-100 dark:bg-purple-900/30",
    text: "text-purple-700 dark:text-purple-400",
    badge: "bg-purple-500/20 text-purple-700 dark:text-purple-300",
  },
  UNCLEAR: {
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-700 dark:text-gray-400",
    badge: "bg-gray-500/20 text-gray-700 dark:text-gray-300",
  },
  SAFE: {
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-700 dark:text-green-400",
    badge: "bg-green-500/20 text-green-700 dark:text-green-300",
  },
  RISKY: {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-700 dark:text-red-400",
    badge: "bg-red-500/20 text-red-700 dark:text-red-300",
  },
  REQUIRES_CAUTION: {
    bg: "bg-orange-100 dark:bg-orange-900/30",
    text: "text-orange-700 dark:text-orange-400",
    badge: "bg-orange-500/20 text-orange-700 dark:text-orange-300",
  },
  DEEPFAKE: {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-700 dark:text-red-400",
    badge: "bg-red-500/20 text-red-700 dark:text-red-300",
  },
}
