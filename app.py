# main.py - Complete Fixed FastAPI backend for AI Misinformation Detector with Added Features

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import base64
import io
import requests
from bs4 import BeautifulSoup
import logging
from functools import lru_cache
from typing import Optional, List
import json
from PIL import Image
import time
from dotenv import load_dotenv
import tempfile

# LangChain imports
from langchain_groq import ChatGroq
from langchain_community.utilities.tavily_search import TavilySearchAPIWrapper
from langchain_core.prompts import PromptTemplate
from langchain_core.messages import HumanMessage

# Mistral OCR
from mistralai import Mistral
import google.generativeai as genai

# Load environment variables
load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")
MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

# Validate API keys
required_keys = {
    "GROQ_API_KEY": GROQ_API_KEY,
    "TAVILY_API_KEY": TAVILY_API_KEY,
    "MISTRAL_API_KEY": MISTRAL_API_KEY,
    "GOOGLE_API_KEY": GOOGLE_API_KEY
}
missing_keys = [key for key, value in required_keys.items() if not value]
if missing_keys:
    raise ValueError(f"Missing API keys: {', '.join(missing_keys)}")

os.environ["TAVILY_API_KEY"] = TAVILY_API_KEY
genai.configure(api_key=GOOGLE_API_KEY)

# Initialize clients
search = TavilySearchAPIWrapper()
llm = ChatGroq(api_key=GROQ_API_KEY, temperature=0, model="gemma2-9b-it")
mistral_client = Mistral(api_key=MISTRAL_API_KEY)
gemini_model = genai.GenerativeModel("gemini-2.5-flash")  
# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="AI Misinformation Detector API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cache for expensive operations
@lru_cache(maxsize=50)
def cached_search(query):
    try:
        return search.results(query, max_results=5)
    except Exception as e:
        logger.error(f"Search failed for query '{query}': {e}")
        return []

# ==================== Pydantic Models ====================
class FactCheckResponse(BaseModel):
    analysis: str
    sources: List[dict]
    confidence_score: int
    confidence_explanation: str
    status: str
    error: Optional[str] = None

class ImageAuthenticityResponse(BaseModel):
    analysis: str
    confidence_score: int
    confidence_explanation: str
    status: str
    error: Optional[str] = None

class VideoAuthenticityResponse(BaseModel):
    analysis: str
    confidence_score: int
    confidence_explanation: str
    status: str
    error: Optional[str] = None

class URLSafetyRequest(BaseModel):
    url: str

class URLSafetyResponse(BaseModel):
    analysis: str
    sources: List[dict]
    status: str
    error: Optional[str] = None

class BiasRadarRequest(BaseModel):
    source: str  # Can be a URL or source name

class BiasRadarResponse(BaseModel):
    analysis: str
    balance_score: str
    tips: str
    sources: List[dict]
    status: str
    error: Optional[str] = None

class NeutralNewsRequest(BaseModel):
    article_url: str  # Can be URL or direct article text/claim

class NeutralNewsResponse(BaseModel):
    neutral_analysis: str
    alternative_sources: List[dict]
    status: str
    error: Optional[str] = None

class BatchFactCheckRequest(BaseModel):
    claims: List[str]

class BatchFactCheckResponse(BaseModel):
    results: List[dict]
    status: str
    error: Optional[str] = None

class SocialMediaContextRequest(BaseModel):
    post_url: str

class SocialMediaContextResponse(BaseModel):
    context_analysis: str
    fact_check_result: Optional[dict]
    status: str
    error: Optional[str] = None

# ==================== Prompts ====================
fact_check_prompt = PromptTemplate(
    input_variables=["claim", "sources"],
    template="""
You are a fact-checking expert. Analyze the following claim in detail for potential misinformation.

Claim: {claim}

Sources from trusted websites:
{sources}

Provide a comprehensive response in this format:
- Verdict: [true, false, misleading, or partially true]
- Analysis: [Detailed explanation with 3-5 specific reasons supported by evidence from the sources, correcting inaccuracies, discussing source credibility, biases, logical fallacies, or lack of evidence]
- Confidence Score: [0-100, based on source agreement and evidence clarity]
- Confidence Explanation: [Plain-language explanation of the score, e.g., 'High confidence due to consistent sources']

Be objective, detailed, and evidence-based.
"""
)

image_prompt = PromptTemplate(
    input_variables=[],
    template="""
You are a forensic image analyst. Provide a detailed analysis of this image for authenticity.

Examine the image closely for signs of manipulation, AI generation, or faking. Consider elements like lighting inconsistencies, shadow anomalies, edge artifacts, unnatural proportions, blending errors, metadata clues, or contextual mismatches.

Output a comprehensive report in this format:
- Verdict: [likely authentic, manipulated, AI-generated, or unclear]
- Analysis: [List 4-6 specific observations from the image that support your verdict, with explanations]
- Potential Implications: [Discuss what this means for the image's use in media or claims]
- Confidence Score: [0-100, based on clarity of evidence and analysis certainty]
- Confidence Explanation: [Plain-language explanation, e.g., 'Medium confidence due to subtle artifacts']

Be thorough and evidence-driven.
"""
)

video_prompt = PromptTemplate(
    input_variables=[],
    template="""
You are a forensic video analyst. Provide a detailed analysis of this video for authenticity, focusing on signs of deepfake or manipulation.

Examine the video for inconsistencies in motion, facial expressions, lighting, audio-sync (if present), unnatural artifacts, or contextual mismatches across frames.

Output a comprehensive report in this format:
- Verdict: [likely authentic, manipulated, deepfake, or unclear]
- Analysis: [List 4-6 specific observations from the video that support your verdict, with explanations]
- Potential Implications: [Discuss what this means for the video's use in media or claims]
- Confidence Score: [0-100, based on clarity of evidence and analysis certainty]
- Confidence Explanation: [Plain-language explanation, e.g., 'Low confidence due to limited frame data']

Be thorough and evidence-driven. Limit analysis to short clips.
"""
)

url_safety_prompt = PromptTemplate(
    input_variables=["url", "sources", "content"],
    template="""
You are a web safety expert. Provide a detailed safety assessment of this URL/website.

URL: {url}

External sources checked:
{sources}

Scraped content from the site (preview):
{content}

Deliver a comprehensive natural language report:
- Overall Safety Verdict: [safe, risky, or requires caution]
- Detailed Risk Analysis: [Break down 4-6 potential risks (e.g., phishing indicators, malware signs, scam patterns, poor security) with specific evidence]
- Content Breakdown: [Analyze key elements of the scraped content for red flags]
- Recommendations: [Advise on whether to visit, with reasons]
- Confidence: [Rate your assessment (high, medium, low) and explain]

Be precise, evidence-based, and thorough.
"""
)

bias_radar_prompt = PromptTemplate(
    input_variables=["source", "sources"],
    template="""
You are a media bias expert. Rate the political or ideological bias of this news source.

Source: {source}

Bias information from databases:
{sources}

Provide a report:
- Bias Rating: [Left, Center-Left, Center, Center-Right, Right, or Neutral]
- Balance Score: [1-10, 10 being most balanced]
- Detailed Analysis: [Explain based on evidence from sources]
- Tips: [Suggestions for balancing views, e.g., pair with opposing sources]

Be objective and evidence-based.
"""
)

neutral_news_prompt = PromptTemplate(
    input_variables=["article_content", "sources"],
    template="""
You are a neutral news summarizer. Provide a bias-free summary and alternative perspectives for the given content, treating it as an article even if it's short or a claim. Always generate the output regardless of content length.

Article Content: {article_content}

Alternative sources:
{sources}

Output exactly in this format:
- Neutral Summary: [A balanced, factual recap without bias.]
- Alternative Views: [List 3-5 sources with differing perspectives, e.g., 1. Title (URL): Brief description of view.]
- Education: [Tips on identifying bias in the original content.]

Be objective and strictly follow the output format.
"""
)

social_media_context_prompt = PromptTemplate(
    input_variables=["post_url", "metadata", "claim", "fact_check"],
    template="""
You are a social media misinformation analyst. Analyze the context of this social media post.

Post URL: {post_url}
Metadata: {metadata}
Extracted Claim: {claim}
Fact-Check Result: {fact_check}

Provide a report in this format:
- Context Analysis: [Analyze the poster's credibility, engagement level (e.g., likes, shares), and potential misinformation campaign signs]
- Fact-Check Summary: [Summarize the fact-check result or state 'No claim extracted' if none]
- Recommendations: [Advise users on interpreting the post, e.g., 'Check primary sources due to high virality']

Be objective and evidence-based.
"""
)

# ==================== Helper Functions ====================
def detect_language(text: str) -> str:
    try:
        messages = [HumanMessage(content=f"Detect the language of this text and return only the ISO 639-1 code (e.g., 'en' for English): {text}")]
        lang = llm.invoke(messages).content.strip().lower()
        return lang if len(lang) == 2 else "en"
    except Exception as e:
        logger.error(f"Language detection error: {str(e)}")
        return "en"

def translate_text(text: str, target_lang: str) -> str:
    if target_lang == "en":
        return text
    try:
        messages = [HumanMessage(content=f"Translate this text to {target_lang}: {text}")]
        translated = llm.invoke(messages).content.strip()
        return translated
    except Exception as e:
        logger.error(f"Translation error: {str(e)}")
        return text

def extract_text_with_mistral(image_file):
    if not image_file:
        return ""
    try:
        image_file.file.seek(0)
        img_bytes = image_file.file.read()
        if len(img_bytes) == 0:
            return ""
        mime = image_file.content_type or "image/jpeg"
        img_b64 = base64.b64encode(img_bytes).decode("utf-8")
        data_uri = f"data:{mime};base64,{img_b64}"

        ocr_response = mistral_client.ocr.process(
            model="mistral-ocr-latest",
            document={"type": "image_url", "image_url": data_uri},
            include_image_base64=False
        )

        text = ""
        for page in ocr_response.pages:
            text += page.markdown + "\n\n"
        return text.strip()
    except Exception as e:
        logger.error(f"OCR Error: {str(e)}")
        return ""

def check_image_authenticity(image_bytes):
    try:
        image = Image.open(io.BytesIO(image_bytes))
        prompt_text = image_prompt.format()
        response = gemini_model.generate_content([prompt_text, image])
        analysis = response.text

        # Extract confidence score and explanation (simplified parsing)
        confidence_score = 50  # Default
        confidence_explanation = "Default confidence due to lack of explicit scoring."
        lines = analysis.split("\n")
        for i, line in enumerate(lines):
            if line.startswith("- Confidence Score:"):
                try:
                    confidence_score = int(line.split(":")[1].strip().split()[0])
                except:
                    pass
            if line.startswith("- Confidence Explanation:"):
                confidence_explanation = line.split(":", 1)[1].strip()
                break

        return analysis, confidence_score, confidence_explanation
    except Exception as e:
        logger.error(f"Image analysis error: {str(e)}")
        return f"Error analyzing image: {str(e)}", 0, f"Error: {str(e)}"

def check_video_authenticity(video_bytes, content_type):
    try:
        with tempfile.NamedTemporaryFile(delete=False) as tmp:
            tmp.write(video_bytes)
            tmp.flush()
            video_file = genai.upload_file(path=tmp.name, mime_type=content_type)

        start_time = time.time()
        while video_file.state.name == "PROCESSING":
            if time.time() - start_time > 60:
                raise Exception("Video processing timeout")
            time.sleep(2)
            video_file = genai.get_file(video_file.name)

        if video_file.state.name != "ACTIVE":
            raise Exception("Video processing failed")

        prompt_text = video_prompt.format()
        response = gemini_model.generate_content([prompt_text, video_file])
        analysis = response.text

        confidence_score = 50
        confidence_explanation = "Default confidence due to lack of explicit scoring."
        lines = analysis.split("\n")
        for i, line in enumerate(lines):
            if line.startswith("- Confidence Score:"):
                try:
                    confidence_score = int(line.split(":")[1].strip().split()[0])
                except:
                    pass
            if line.startswith("- Confidence Explanation:"):
                confidence_explanation = line.split(":", 1)[1].strip()
                break

        return analysis, confidence_score, confidence_explanation
    except Exception as e:
        logger.error(f"Video analysis error: {str(e)}")
        return f"Error analyzing video: {str(e)}", 0, f"Error: {str(e)}"
    finally:
        os.unlink(tmp.name)

def fact_check(claim: str, lang: str = "en"):
    try:
        search_claim = translate_text(claim, "en") if lang != "en" else claim
        results = cached_search(search_claim)
        sources_text = "\n".join([f"- {r['title']} ({r['url']})" for r in results])
        
        messages = [
            HumanMessage(content=fact_check_prompt.format(claim=claim, sources=sources_text))
        ]
        analysis = llm.invoke(messages).content

        # Extract confidence score and explanation
        confidence_score = 50
        confidence_explanation = "Default confidence due to lack of explicit scoring."
        lines = analysis.split("\n")
        for i, line in enumerate(lines):
            if line.startswith("- Confidence Score:"):
                try:
                    confidence_score = int(line.split(":")[1].strip().split()[0])
                except:
                    pass
            if line.startswith("- Confidence Explanation:"):
                confidence_explanation = line.split(":", 1)[1].strip()
                break

        return analysis, results, confidence_score, confidence_explanation
    except Exception as e:
        logger.error(f"Fact-check error: {str(e)}")
        return f"Fact-check error: {str(e)}", [], 0, f"Error: {str(e)}"

def check_url_safety(url: str, lang: str = "en"):
    try:
        content = ""
        try:
            headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                content = soup.get_text(separator=' ', strip=True)[:5000]
            else:
                content = f"Failed to fetch content (status code: {response.status_code})"
        except Exception as scrape_e:
            content = f"Error scraping content: {str(scrape_e)}"
        
        query = translate_text(f"is {url} safe to visit? site safety review malware phishing", "en") if lang != "en" else f"is {url} safe to visit? site safety review malware phishing"
        results = cached_search(query)
        sources_text = "\n".join([f"- {r['title']} ({r['url']})" for r in results])
        
        messages = [
            HumanMessage(content=url_safety_prompt.format(url=url, sources=sources_text, content=content))
        ]
        analysis = llm.invoke(messages).content
        
        return analysis, results
    except Exception as e:
        logger.error(f"URL safety error: {str(e)}")
        return f"URL safety check error: {str(e)}", []

def check_bias(source: str):
    try:
        query = f"media bias rating for {source} allsides mediabiasfactcheck"
        results = cached_search(query)
        sources_text = "\n".join([f"- {r['title']} ({r['url']})" for r in results])
        
        messages = [
            HumanMessage(content=bias_radar_prompt.format(source=source, sources=sources_text))
        ]
        analysis = llm.invoke(messages).content
        
        balance_score = "N/A"
        tips = "N/A"
        return analysis, balance_score, tips, results
    except Exception as e:
        logger.error(f"Bias check error: {str(e)}")
        return f"Bias check error: {str(e)}", "N/A", "N/A", []

def get_neutral_news(article_url: str):
    try:
        content = ""
        is_url = article_url.startswith(('http://', 'https://'))
        if is_url:
            try:
                headers = {'User-Agent': 'Mozilla/5.0'}
                response = requests.get(article_url, headers=headers, timeout=10)
                if response.status_code == 200:
                    soup = BeautifulSoup(response.text, 'html.parser')
                    content = soup.get_text(separator=' ', strip=True)[:2000]
                else:
                    content = f"Failed to fetch content (status code: {response.status_code})"
            except Exception as e:
                content = f"Error scraping content: {str(e)}"
        else:
            content = article_url[:2000]

        if not content or "Failed to fetch" in content or "Error scraping" in content:
            raise ValueError("Unable to retrieve valid article content. Please provide a valid URL or direct article text.")

        topic_messages = [HumanMessage(content=f"Extract the main topic from this article content in one sentence: {content}")]
        topic = llm.invoke(topic_messages).content.strip()

        query = f"balanced neutral views on {topic}"
        results = cached_search(query)
        sources_text = "\n".join([f"- {r['title']} ({r['url']})" for r in results])
        
        messages = [
            HumanMessage(content=neutral_news_prompt.format(article_content=content, sources=sources_text))
        ]
        neutral_analysis = llm.invoke(messages).content
        
        return neutral_analysis, results
    except ValueError as ve:
        logger.error(f"Neutral news value error: {str(ve)}")
        return str(ve), []
    except Exception as e:
        logger.error(f"Neutral news error: {str(e)}")
        return f"Neutral news error: {str(e)}", []

def analyze_social_media_context(post_url: str):
    try:
        # Validate URL
        if not post_url.startswith(('http://', 'https://')):
            post_url = f"https://{post_url}"
        
        # Scrape metadata
        metadata = {}
        content = ""
        try:
            headers = {'User-Agent': 'Mozilla/5.0'}
            response = requests.get(post_url, headers=headers, timeout=10)
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                content = soup.get_text(separator=' ', strip=True)[:2000]
                
                # Extract basic metadata (platform-specific)
                if "x.com" in post_url.lower() or "twitter.com" in post_url.lower():
                    metadata["platform"] = "X"
                    metadata["poster"] = soup.find("meta", property="og:title") or "Unknown"
                    metadata["engagement"] = "Unknown (e.g., retweets, likes not directly scrapable)"
                elif "reddit.com" in post_url.lower():
                    metadata["platform"] = "Reddit"
                    metadata["poster"] = soup.find("meta", property="og:title") or "Unknown"
                    metadata["engagement"] = "Unknown (e.g., upvotes not directly scrapable)"
                else:
                    metadata["platform"] = "Unknown"
                    metadata["poster"] = "Unknown"
                    metadata["engagement"] = "Unknown"
            else:
                content = f"Failed to fetch content (status code: {response.status_code})"
        except Exception as e:
            content = f"Error scraping content: {str(e)}"
            metadata = {"platform": "Unknown", "poster": "Unknown", "engagement": "Unknown"}

        # Extract claim for fact-checking
        claim = ""
        try:
            claim_messages = [HumanMessage(content=f"Extract the main claim or statement from this social media post content in one sentence: {content}")]
            claim = llm.invoke(claim_messages).content.strip()
        except Exception as e:
            logger.error(f"Claim extraction error: {str(e)}")
            claim = ""

        # Fact-check the claim if extracted
        fact_check_result = None
        if claim and claim != "No clear claim identified.":
            analysis, sources, confidence_score, confidence_explanation = fact_check(claim)
            fact_check_result = {
                "claim": claim,
                "analysis": analysis,
                "sources": [{"title": s.get("title", ""), "url": s.get("url", "")} for s in sources],
                "confidence_score": confidence_score,
                "confidence_explanation": confidence_explanation
            }
        else:
            fact_check_result = {"claim": "", "analysis": "No claim extracted", "sources": [], "confidence_score": 0, "confidence_explanation": "No claim to analyze"}

        # Analyze context
        metadata_text = "\n".join([f"{k}: {v}" for k, v in metadata.items()])
        messages = [
            HumanMessage(content=social_media_context_prompt.format(
                post_url=post_url,
                metadata=metadata_text,
                claim=claim,
                fact_check=fact_check_result["analysis"] if fact_check_result else "No claim extracted"
            ))
        ]
        context_analysis = llm.invoke(messages).content

        return context_analysis, fact_check_result
    except Exception as e:
        logger.error(f"Social media context error: {str(e)}")
        return f"Error analyzing social media post: {str(e)}", None

# ==================== API Endpoints ====================

@app.get("/")
async def root():
    return {"message": "AI Misinformation Detector API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": time.time()}

@app.post("/api/fact-check", response_model=FactCheckResponse)
async def fact_check_endpoint(
    claim: str = Form(...),
    image: Optional[UploadFile] = File(None),
    preferred_language: Optional[str] = Form(None)
):
    try:
        logger.info(f"Fact-check request for claim: {claim[:100]}...")
        
        extracted_text = ""
        full_claim = claim.strip()
        
        if image:
            logger.info("Processing uploaded image for OCR...")
            extracted_text = extract_text_with_mistral(image)
            if extracted_text:
                full_claim = extracted_text
                logger.info(f"Extracted text from image: {extracted_text[:100]}...")
        
        if not full_claim:
            raise HTTPException(status_code=400, detail="No valid claim provided")
        
        input_lang = detect_language(full_claim)
        output_lang = preferred_language or input_lang
        
        process_claim = translate_text(full_claim, "en") if input_lang != "en" else full_claim
        
        analysis, sources, confidence_score, confidence_explanation = fact_check(process_claim)
        
        analysis = translate_text(analysis, output_lang) if output_lang != "en" else analysis
        confidence_explanation = translate_text(confidence_explanation, output_lang) if output_lang != "en" else confidence_explanation
        
        return FactCheckResponse(
            analysis=str(analysis),
            sources=[{"title": s.get("title", ""), "url": s.get("url", "")} for s in sources],
            confidence_score=confidence_score,
            confidence_explanation=confidence_explanation,
            status="success"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Fact-check endpoint error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/api/image-authenticity", response_model=ImageAuthenticityResponse)
async def image_authenticity_endpoint(image: UploadFile = File(...)):
    try:
        if not image.content_type or not image.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image (jpg, png, etc.)")
        
        logger.info(f"Image authenticity check for: {image.filename}")
        
        image_bytes = await image.read()
        if len(image_bytes) == 0:
            raise HTTPException(status_code=400, detail="Empty image file")
        
        analysis, confidence_score, confidence_explanation = check_image_authenticity(image_bytes)
        
        return ImageAuthenticityResponse(
            analysis=str(analysis),
            confidence_score=confidence_score,
            confidence_explanation=confidence_explanation,
            status="success"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Image authenticity endpoint error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/api/video-authenticity", response_model=VideoAuthenticityResponse)
async def video_authenticity_endpoint(video: UploadFile = File(...)):
    try:
        if not video.content_type or not video.content_type.startswith('video/'):
            raise HTTPException(status_code=400, detail="File must be a video (mp4, etc.)")
        
        logger.info(f"Video authenticity check for: {video.filename}")
        
        video_bytes = await video.read()
        if len(video_bytes) == 0:
            raise HTTPException(status_code=400, detail="Empty video file")
        if len(video_bytes) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Video too large; limit to short clips (~10 seconds)")
        
        analysis, confidence_score, confidence_explanation = check_video_authenticity(video_bytes, video.content_type)
        
        return VideoAuthenticityResponse(
            analysis=str(analysis),
            confidence_score=confidence_score,
            confidence_explanation=confidence_explanation,
            status="success"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Video authenticity endpoint error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/api/url-safety", response_model=URLSafetyResponse)
async def url_safety_endpoint(request: URLSafetyRequest):
    try:
        url = request.url.strip()
        if not url:
            raise HTTPException(status_code=400, detail="URL cannot be empty")
        
        if not url.startswith(('http://', 'https://')):
            url = f"https://{url}"
        
        logger.info(f"URL safety check for: {url}")
        
        analysis, sources = check_url_safety(url)
        
        return URLSafetyResponse(
            analysis=str(analysis),
            sources=[{"title": s.get("title", ""), "url": s.get("url", "")} for s in sources],
            status="success"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"URL safety endpoint error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/api/url-safety-form")
async def url_safety_form_endpoint(url: str = Form(...)):
    try:
        url = url.strip()
        if not url:
            raise HTTPException(status_code=400, detail="URL cannot be empty")
        
        if not url.startswith(('http://', 'https://')):
            url = f"https://{url}"
        
        logger.info(f"URL safety form check for: {url}")
        
        analysis, sources = check_url_safety(url)
        
        return {
            "analysis": str(analysis),
            "sources": [{"title": s.get("title", ""), "url": s.get("url", "")} for s in sources],
            "status": "success"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"URL safety form endpoint error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/api/bias-radar", response_model=BiasRadarResponse)
async def bias_radar_endpoint(request: BiasRadarRequest):
    try:
        source = request.source.strip()
        if not source:
            raise HTTPException(status_code=400, detail="Source cannot be empty")
        
        logger.info(f"Bias radar for: {source}")
        
        analysis, balance_score, tips, sources = check_bias(source)
        
        return BiasRadarResponse(
            analysis=analysis,
            balance_score=balance_score,
            tips=tips,
            sources=[{"title": s.get("title", ""), "url": s.get("url", "")} for s in sources],
            status="success"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Bias radar error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/neutral-news", response_model=NeutralNewsResponse)
async def neutral_news_endpoint(request: NeutralNewsRequest):
    try:
        article_url = request.article_url.strip()
        if not article_url:
            raise HTTPException(status_code=400, detail="Article input cannot be empty")
        
        logger.info(f"Neutral news for input: {article_url[:100]}...")
        
        neutral_analysis, alternative_sources = get_neutral_news(article_url)
        
        return NeutralNewsResponse(
            neutral_analysis=neutral_analysis,
            alternative_sources=[{"title": s.get("title", ""), "url": s.get("url", "")} for s in alternative_sources],
            status="success"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Neutral news error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/social-media-context", response_model=SocialMediaContextResponse)
async def social_media_context_endpoint(request: SocialMediaContextRequest):
    try:
        post_url = request.post_url.strip()
        if not post_url:
            raise HTTPException(status_code=400, detail="Post URL cannot be empty")
        
        logger.info(f"Social media context analysis for: {post_url}")
        
        context_analysis, fact_check_result = analyze_social_media_context(post_url)
        
        return SocialMediaContextResponse(
            context_analysis=context_analysis,
            fact_check_result=fact_check_result,
            status="success"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Social media context error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/search")
async def search_endpoint(query: str):
    try:
        if not query.strip():
            raise HTTPException(status_code=400, detail="Query cannot be empty")
        
        results = cached_search(query)
        return {
            "query": query,
            "results": [{"title": r.get("title", ""), "url": r.get("url", ""), "content": r.get("content", "")} for r in results],
            "status": "success"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Search endpoint error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/batch-fact-check", response_model=BatchFactCheckResponse)
async def batch_fact_check_endpoint(request: BatchFactCheckRequest):
    try:
        claims = request.claims
        if not claims:
            raise HTTPException(status_code=400, detail="No claims provided")
        
        if len(claims) > 5:
            claims = claims[:5]
            logger.warning(f"Limiting batch to 5 claims from {len(request.claims)}")
        
        results = []
        for claim in claims:
            if claim and claim.strip():
                input_lang = detect_language(claim)
                analysis, sources, confidence_score, confidence_explanation = fact_check(claim.strip(), lang=input_lang)
                results.append({
                    "claim": claim.strip(),
                    "analysis": str(analysis),
                    "sources": [{"title": s.get("title", ""), "url": s.get("url", "")} for s in sources],
                    "confidence_score": confidence_score,
                    "confidence_explanation": confidence_explanation
                })
            else:
                results.append({
                    "claim": claim or "",
                    "analysis": "Empty claim - skipped analysis",
                    "sources": [],
                    "confidence_score": 0,
                    "confidence_explanation": "No analysis performed"
                })
        
        return BatchFactCheckResponse(
            results=results,
            status="success"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Batch fact-check error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
