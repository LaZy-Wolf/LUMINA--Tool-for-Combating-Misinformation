const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://lumina-backend-570707536671.europe-west1.run.app"

interface ApiResponse<T> {
  status: string
  error?: string
  [key: string]: any
}

export const apiClient = {
  async factCheck(claims: string, image?: File, preferredLanguage?: string): Promise<ApiResponse<any>> {
    const formData = new FormData()
    formData.append("claims", claims)
    if (image) formData.append("image", image)
    if (preferredLanguage) formData.append("preferred_language", preferredLanguage)

    const res = await fetch(`${API_BASE_URL}/api/fact-check`, {
      method: "POST",
      body: formData,
    })
    return res.json()
  },

  async imageAuthenticity(image: File): Promise<ApiResponse<any>> {
    const formData = new FormData()
    formData.append("image", image)

    const res = await fetch(`${API_BASE_URL}/api/image-authenticity`, {
      method: "POST",
      body: formData,
    })
    return res.json()
  },

  async videoAuthenticity(video: File): Promise<ApiResponse<any>> {
    const formData = new FormData()
    formData.append("video", video)

    const res = await fetch(`${API_BASE_URL}/api/video-authenticity`, {
      method: "POST",
      body: formData,
    })
    return res.json()
  },

  async urlSafety(url: string): Promise<ApiResponse<any>> {
    const res = await fetch(`${API_BASE_URL}/api/url-safety`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    })
    return res.json()
  },

  async mediaAnalysis(input: string): Promise<ApiResponse<any>> {
    const res = await fetch(`${API_BASE_URL}/api/media-analysis`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input }),
    })
    return res.json()
  },

  async socialMediaContext(postUrl: string): Promise<ApiResponse<any>> {
    const res = await fetch(`${API_BASE_URL}/api/social-media-context`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post_url: postUrl }),
    })
    return res.json()
  },
}
