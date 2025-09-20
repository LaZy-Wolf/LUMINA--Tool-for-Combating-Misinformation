const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000"

export async function factCheck(claim: string, image?: File | null, language = "en") {
  const formData = new FormData()
  formData.append("claim", claim)
  formData.append("preferred_language", language)

  if (image) {
    formData.append("image", image)
  }

  const response = await fetch(`${API_BASE_URL}/api/fact-check`, {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const data = await response.json()

  if (data.status === "error") {
    throw new Error(data.error || "Unknown error occurred")
  }

  return data
}

export async function imageAuthenticity(image: File) {
  const formData = new FormData()
  formData.append("image", image)

  const response = await fetch(`${API_BASE_URL}/api/image-authenticity`, {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const data = await response.json()

  if (data.status === "error") {
    throw new Error(data.error || "Unknown error occurred")
  }

  return data
}

export async function videoAuthenticity(video: File) {
  const formData = new FormData()
  formData.append("video", video)

  const response = await fetch(`${API_BASE_URL}/api/video-authenticity`, {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const data = await response.json()

  if (data.status === "error") {
    throw new Error(data.error || "Unknown error occurred")
  }

  return data
}

export async function urlSafety(url: string, useForm = false) {
  const endpoint = useForm ? "/api/url-safety-form" : "/api/url-safety"

  let body: FormData | string
  const headers: HeadersInit = {}

  if (useForm) {
    body = new FormData()
    body.append("url", url)
  } else {
    body = JSON.stringify({ url })
    headers["Content-Type"] = "application/json"
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers,
    body,
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const data = await response.json()

  if (data.status === "error") {
    throw new Error(data.error || "Unknown error occurred")
  }

  return data
}

export async function biasRadar(source: string) {
  const response = await fetch(`${API_BASE_URL}/api/bias-radar`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ source }),
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const data = await response.json()

  if (data.status === "error") {
    throw new Error(data.error || "Unknown error occurred")
  }

  return data
}

export async function neutralNews(articleUrl: string) {
  const response = await fetch(`${API_BASE_URL}/api/neutral-news`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ article_url: articleUrl }),
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const data = await response.json()

  if (data.status === "error") {
    throw new Error(data.error || "Unknown error occurred")
  }

  return data
}

export async function batchFactCheck(claims: string[]) {
  const response = await fetch(`${API_BASE_URL}/api/batch-fact-check`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ claims }),
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const data = await response.json()

  if (data.status === "error") {
    throw new Error(data.error || "Unknown error occurred")
  }

  return data
}

export async function search(query: string) {
  const response = await fetch(`${API_BASE_URL}/api/search?query=${encodeURIComponent(query)}`)

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const data = await response.json()

  if (data.status === "error") {
    throw new Error(data.error || "Unknown error occurred")
  }

  return data
}

export async function socialMediaContext(postUrl: string) {
  const response = await fetch(`${API_BASE_URL}/api/social-media-context`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ post_url: postUrl }),
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const data = await response.json()

  if (data.status === "error") {
    throw new Error(data.error || "Unknown error occurred")
  }

  return data
}
