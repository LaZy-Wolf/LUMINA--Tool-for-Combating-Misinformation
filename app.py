from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
import os
import base64
import io
import requests
from bs4 import BeautifulSoup
import logging
from functools import lru_cache
from typing import Optional, List, Dict, Any, Union
import json
from PIL import Image
import time
from dotenv import load_dotenv
import tempfile
import asyncio
from urllib.parse import urlparse
import re

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

search = TavilySearchAPIWrapper()
llm = ChatGroq(api_key=GROQ_API_KEY, temperature=0, model="llama-3.3-70b-versatile")
mistral_client = Mistral(api_key=MISTRAL_API_KEY)
gemini_model = genai.GenerativeModel("gemini-2.0-flash-exp")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="LUMINA - AI Misinformation Detector", version="2.0.1")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== Custom Dependency for Optional Image ====================
async def get_optional_image(image: Union[UploadFile, str, None] = File(default=None)) -> Optional[UploadFile]:
    """Custom dependency to handle optional file uploads, filtering out empty strings."""
    # Handle empty string or None
    if image is None or image == "" or isinstance(image, str):
        return None
    
    # Handle UploadFile
    if isinstance(image, UploadFile):
        # Check if it has a filename and content
        if image.filename and image.filename.strip():
            # Peek at file content without consuming it
            try:
                content = await image.read()
                await image.seek(0)  # Reset file pointer after reading
                if len(content) > 0:
                    return image
            except Exception as e:
                logger.warning(f"Error reading image file: {str(e)}")
                return None
    
    return None

# ==================== Pydantic Models ====================
class ClaimResult(BaseModel):
    claim: str
    verdict: str
    analysis: str
    confidence_score: int
    confidence_explanation: str
    sources: List[Dict[str, str]]

class FactCheckResponse(BaseModel):
    results: List[ClaimResult]
    status: str
    processing_time: float
    error: Optional[str] = None

class ImageAuthenticityResponse(BaseModel):
    verdict: str
    analysis: str
    confidence_score: int
    confidence_explanation: str
    potential_implications: str
    status: str
    error: Optional[str] = None

class VideoAuthenticityResponse(BaseModel):
    verdict: str
    analysis: str
    confidence_score: int
    confidence_explanation: str
    potential_implications: str
    status: str
    error: Optional[str] = None

class URLSafetyRequest(BaseModel):
    url: str

class URLSafetyResponse(BaseModel):
    verdict: str
    risk_analysis: str
    recommendations: str
    confidence: str
    sources: List[Dict[str, str]]
    status: str
    error: Optional[str] = None

class MediaAnalysisRequest(BaseModel):
    input: str
    
    @field_validator('input')  
    @classmethod
    def validate_input(cls, v):
        if not v or not v.strip():
            raise ValueError("Input cannot be empty")
        return v.strip()

class MediaAnalysisResponse(BaseModel):
    analysis_type: str
    bias_rating: Optional[str] = None
    balance_score: Optional[str] = None
    bias_analysis: Optional[str] = None
    neutral_summary: Optional[str] = None
    alternative_views: Optional[str] = None
    education_tips: Optional[str] = None
    sources: List[Dict[str, str]]
    status: str
    error: Optional[str] = None

class SocialMediaContextRequest(BaseModel):
    post_url: str

class SocialMediaContextResponse(BaseModel):
    context_analysis: str
    fact_check_result: Optional[Dict[str, Any]]
    status: str
    error: Optional[str] = None

# ==================== Prompts ====================
fact_check_prompt_json = PromptTemplate(
    input_variables=["claim", "sources"],
    template="""
You are an expert fact-checker. Analyze this claim for misinformation.

Claim: {claim}

Trusted Sources:
{sources}

Respond with a valid JSON object:
{{
    "verdict": "true or false or misleading or partially_true or unverifiable",
    "analysis": "Detailed explanation with 3-5 specific evidence-based reasons",
    "confidence_score": 85,
    "confidence_explanation": "Plain explanation of the confidence score"
}}

Respond ONLY with valid JSON, no extra text.
"""
)

image_prompt = """
You are a forensic image analyst. Analyze this image for authenticity signs.

Examine for: manipulation, AI generation, lighting inconsistencies, shadows, edges, proportions.

Respond with valid JSON only:
{
    "verdict": "likely_authentic or manipulated or ai_generated or unclear",
    "analysis": "Detailed 4-6 sentence analysis with specific observations from the image",
    "potential_implications": "Discussion of implications in 2-3 sentences",
    "confidence_score": 75,
    "confidence_explanation": "Plain explanation in one sentence"
}

IMPORTANT: All fields must be single strings, not arrays. Respond ONLY with valid JSON.
"""

video_prompt = """
You are a forensic video analyst. Analyze this video for deepfake or manipulation signs.

Examine for: motion inconsistencies, facial expressions, lighting, audio-sync, artifacts.

Respond with valid JSON only:
{
    "verdict": "likely_authentic or manipulated or deepfake or unclear",
    "analysis": "Detailed 4-6 sentence analysis with specific observations from the video",
    "potential_implications": "Discussion of implications in 2-3 sentences",
    "confidence_score": 70,
    "confidence_explanation": "Plain explanation in one sentence about the VIDEO analysis confidence"
}

IMPORTANT: All fields must be single strings, not arrays. Your confidence explanation should refer to VIDEO, not image. Respond ONLY with valid JSON.
"""

url_safety_prompt_json = PromptTemplate(
    input_variables=["url", "sources", "content"],
    template="""
You are a web safety expert. Assess this URL/website.

URL: {url}
External Sources: {sources}
Content Preview: {content}

Respond with valid JSON only:
{{
    "verdict": "safe or risky or requires_caution",
    "risk_analysis": "4-6 potential risks with specific evidence",
    "recommendations": "Specific advice",
    "confidence": "high or medium or low"
}}

Respond ONLY with valid JSON.
"""
)

bias_radar_prompt_json = PromptTemplate(
    input_variables=["source", "sources"],
    template="""
You are a media bias expert. Rate the bias of this source.

Source: {source}
Bias Information: {sources}

Respond with valid JSON only:
{{
    "bias_rating": "Left or Center-Left or Center or Center-Right or Right or Neutral",
    "balance_score": "7",
    "analysis": "Detailed explanation based on evidence",
    "tips": "Suggestions for balancing views"
}}

Respond ONLY with valid JSON.
"""
)

neutral_news_prompt_json = PromptTemplate(
    input_variables=["article_content", "sources"],
    template="""
You are a neutral news summarizer. Provide bias-free summary.

Article: {article_content}
Alternative Sources: {sources}

Respond with valid JSON only:
{{
    "neutral_summary": "Balanced factual recap",
    "alternative_views": "List of 3-5 sources with different perspectives",
    "education_tips": "Tips on identifying bias"
}}

Respond ONLY with valid JSON.
"""
)

social_media_context_prompt_json = PromptTemplate(
    input_variables=["post_url", "metadata", "claim", "fact_check"],
    template="""
Analyze this social media post context.

Post URL: {post_url}
Metadata: {metadata}
Claim: {claim}
Fact-Check: {fact_check}

Respond with valid JSON only:
{{
    "context_analysis": "Analyze credibility and engagement",
    "fact_check_summary": "Summarize fact-check",
    "recommendations": "Advise users"
}}

Respond ONLY with valid JSON.
"""
)

# ==================== Helper Functions ====================
def is_url(text: str) -> bool:
    try:
        result = urlparse(text)
        return all([result.scheme, result.netloc]) and result.scheme in ['http', 'https']
    except:
        return False

def detect_language(text: str) -> str:
    try:
        messages = [HumanMessage(content=f"Detect the language of this text and return ONLY the ISO 639-1 code (e.g., 'en'): {text[:500]}")]
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
        return llm.invoke(messages).content.strip()
    except Exception as e:
        logger.error(f"Translation error: {str(e)}")
        return text

def parse_json_response(response: str) -> dict:
    """Enhanced JSON parsing with better list handling"""
    try:
        # Remove markdown code blocks
        response = re.sub(r'```json\s*', '', response)
        response = re.sub(r'```\s*$', '', response)
        response = response.strip()
        
        parsed = json.loads(response)
        
        # Convert lists to strings for all fields
        for key, value in parsed.items():
            if isinstance(value, list):
                parsed[key] = " ".join(str(v) for v in value if v)
        
        return parsed
    except json.JSONDecodeError as e:
        logger.error(f"JSON parse error: {str(e)}. Response: {response[:200]}")
        return {"error": "Failed to parse response", "raw_response": response[:500]}

@lru_cache(maxsize=100)
def cached_search(query: str, max_results: int = 5):
    try:
        return search.results(query, max_results=max_results)
    except Exception as e:
        logger.error(f"Search failed for '{query}': {e}")
        return []

async def extract_text_with_mistral(image_file: UploadFile) -> str:
    if not image_file:
        return ""
    try:
        # Seek to beginning and read the file
        await image_file.seek(0)
        img_bytes = await image_file.read()
        if len(img_bytes) == 0:
            logger.warning("Image file is empty")
            return ""
        
        mime = image_file.content_type or "image/jpeg"
        img_b64 = base64.b64encode(img_bytes).decode("utf-8")
        data_uri = f"data:{mime};base64,{img_b64}"

        ocr_response = mistral_client.ocr.process(
            model="pixtral-12b-latest",
            document={"type": "image_url", "image_url": data_uri},
            include_image_base64=False
        )

        text = ""
        for page in ocr_response.pages:
            text += page.markdown + "\n\n"
        
        extracted = text.strip()
        logger.info(f"OCR extracted {len(extracted)} characters from image")
        return extracted
    except Exception as e:
        logger.error(f"OCR Error: {str(e)}")
        return ""

async def fact_check_single(claim: str, lang: str = "en") -> Dict[str, Any]:
    try:
        search_claim = translate_text(claim, "en") if lang != "en" else claim
        results = cached_search(search_claim, max_results=5)
        sources_text = "\n".join([f"- {r['title']} ({r['url']})" for r in results])
        
        messages = [HumanMessage(content=fact_check_prompt_json.format(claim=claim, sources=sources_text))]
        response = llm.invoke(messages).content
        parsed = parse_json_response(response)
        
        if "error" in parsed:
            return {
                "claim": claim,
                "verdict": "error",
                "analysis": f"Analysis failed: {parsed.get('error', 'Unknown error')}",
                "confidence_score": 0,
                "confidence_explanation": "Could not complete analysis",
                "sources": [{"title": s.get("title", ""), "url": s.get("url", "")} for s in results]
            }
        
        return {
            "claim": claim,
            "verdict": parsed.get("verdict", "unverifiable"),
            "analysis": parsed.get("analysis", "No analysis available"),
            "confidence_score": int(parsed.get("confidence_score", 0)),
            "confidence_explanation": parsed.get("confidence_explanation", "No explanation"),
            "sources": [{"title": s.get("title", ""), "url": s.get("url", "")} for s in results]
        }
    except Exception as e:
        logger.error(f"Fact-check error: {str(e)}")
        return {
            "claim": claim,
            "verdict": "error",
            "analysis": f"Error: {str(e)}",
            "confidence_score": 0,
            "confidence_explanation": f"Error: {str(e)}",
            "sources": []
        }

def check_image_authenticity(image_bytes):
    """Enhanced error handling with list-to-string conversion"""
    try:
        image = Image.open(io.BytesIO(image_bytes))
        response = gemini_model.generate_content([image_prompt, image])
        parsed = parse_json_response(response.text)
        
        if "error" in parsed:
            raise Exception(parsed["error"])
        
        return {
            "verdict": str(parsed.get("verdict", "unclear")),
            "analysis": str(parsed.get("analysis", "No analysis available")),
            "potential_implications": str(parsed.get("potential_implications", "Unknown")),
            "confidence_score": int(parsed.get("confidence_score", 50)),
            "confidence_explanation": str(parsed.get("confidence_explanation", "No explanation"))
        }
    except Exception as e:
        logger.error(f"Image analysis error: {str(e)}")
        return {
            "verdict": "error",
            "analysis": f"Error analyzing image: {str(e)}",
            "potential_implications": "Could not complete analysis",
            "confidence_score": 0,
            "confidence_explanation": f"Error: {str(e)}"
        }

def check_video_authenticity(video_bytes, content_type):
    """Enhanced error handling with proper video reference"""
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as tmp:
            tmp.write(video_bytes)
            tmp.flush()
            tmp_path = tmp.name
            video_file = genai.upload_file(path=tmp_path, mime_type=content_type)

        start_time = time.time()
        while video_file.state.name == "PROCESSING":
            if time.time() - start_time > 60:
                raise Exception("Video processing timeout")
            time.sleep(2)
            video_file = genai.get_file(video_file.name)

        if video_file.state.name != "ACTIVE":
            raise Exception("Video processing failed")

        response = gemini_model.generate_content([video_prompt, video_file])
        parsed = parse_json_response(response.text)
        
        if "error" in parsed:
            raise Exception(parsed["error"])
        
        # Ensure confidence_explanation mentions "video" not "image"
        conf_exp = str(parsed.get("confidence_explanation", "No explanation"))
        if "image" in conf_exp.lower() and "video" not in conf_exp.lower():
            conf_exp = conf_exp.replace("image", "video").replace("Image", "Video")
        
        return {
            "verdict": str(parsed.get("verdict", "unclear")),
            "analysis": str(parsed.get("analysis", "No analysis available")),
            "potential_implications": str(parsed.get("potential_implications", "Unknown")),
            "confidence_score": int(parsed.get("confidence_score", 50)),
            "confidence_explanation": conf_exp
        }
    except Exception as e:
        logger.error(f"Video analysis error: {str(e)}")
        return {
            "verdict": "error",
            "analysis": f"Error analyzing video: {str(e)}",
            "potential_implications": "Could not complete analysis",
            "confidence_score": 0,
            "confidence_explanation": f"Error: {str(e)}"
        }
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
            except:
                pass

def check_url_safety(url: str):
    try:
        content = ""
        try:
            headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                content = soup.get_text(separator=' ', strip=True)[:5000]
            else:
                content = f"Failed to fetch (status: {response.status_code})"
        except Exception as e:
            content = f"Error: {str(e)}"
        
        query = f"is {url} safe malware phishing scam review"
        results = cached_search(query, max_results=5)
        sources_text = "\n".join([f"- {r['title']} ({r['url']})" for r in results])
        
        messages = [HumanMessage(content=url_safety_prompt_json.format(url=url, sources=sources_text, content=content))]
        response = llm.invoke(messages).content
        parsed = parse_json_response(response)
        
        if "error" in parsed:
            parsed = {
                "verdict": "unclear",
                "risk_analysis": f"Analysis failed: {parsed.get('error')}",
                "recommendations": "Exercise caution",
                "confidence": "low"
            }
        
        parsed["sources"] = [{"title": s.get("title", ""), "url": s.get("url", "")} for s in results]
        return parsed
    except Exception as e:
        logger.error(f"URL safety error: {str(e)}")
        return {
            "verdict": "error",
            "risk_analysis": f"Error: {str(e)}",
            "recommendations": "Could not complete analysis",
            "confidence": "none",
            "sources": []
        }

def analyze_media(input_text: str) -> Dict[str, Any]:
    try:
        if is_url(input_text):
            return analyze_neutral_news(input_text)
        else:
            return analyze_bias(input_text)
    except Exception as e:
        logger.error(f"Media analysis error: {str(e)}")
        return {
            "analysis_type": "error",
            "error": str(e),
            "sources": []
        }

def analyze_bias(source: str) -> Dict[str, Any]:
    try:
        query = f"media bias rating {source} allsides mediabiasfactcheck"
        results = cached_search(query, max_results=5)
        sources_text = "\n".join([f"- {r['title']} ({r['url']})" for r in results])
        
        messages = [HumanMessage(content=bias_radar_prompt_json.format(source=source, sources=sources_text))]
        response = llm.invoke(messages).content
        parsed = parse_json_response(response)
        
        if "error" in parsed:
            raise Exception(parsed["error"])
        
        return {
            "analysis_type": "bias_rating",
            "bias_rating": parsed.get("bias_rating", "Unknown"),
            "balance_score": parsed.get("balance_score", "N/A"),
            "bias_analysis": parsed.get("analysis", "No analysis available"),
            "sources": [{"title": s.get("title", ""), "url": s.get("url", "")} for s in results]
        }
    except Exception as e:
        logger.error(f"Bias analysis error: {str(e)}")
        return {
            "analysis_type": "error",
            "error": f"Bias analysis failed: {str(e)}",
            "sources": []
        }

def analyze_neutral_news(article_input: str) -> Dict[str, Any]:
    try:
        content = ""
        if is_url(article_input):
            try:
                headers = {'User-Agent': 'Mozilla/5.0'}
                response = requests.get(article_input, headers=headers, timeout=10)
                if response.status_code == 200:
                    soup = BeautifulSoup(response.text, 'html.parser')
                    content = soup.get_text(separator=' ', strip=True)[:3000]
                else:
                    content = f"Failed to fetch (status: {response.status_code})"
            except Exception as e:
                content = f"Error: {str(e)}"
        else:
            content = article_input[:3000]

        if not content or "Failed to fetch" in content or "Error" in content:
            raise ValueError("Unable to retrieve article content")

        topic_messages = [HumanMessage(content=f"Extract the main topic in 5-10 words: {content[:500]}")]
        topic = llm.invoke(topic_messages).content.strip()

        query = f"balanced news {topic} multiple sources"
        results = cached_search(query, max_results=7)
        sources_text = "\n".join([f"- {r['title']} ({r['url']})" for r in results])
        
        messages = [HumanMessage(content=neutral_news_prompt_json.format(article_content=content, sources=sources_text))]
        response = llm.invoke(messages).content
        parsed = parse_json_response(response)
        
        if "error" in parsed:
            raise Exception(parsed["error"])
        
        return {
            "analysis_type": "neutral_summary",
            "neutral_summary": parsed.get("neutral_summary", "No summary available"),
            "alternative_views": parsed.get("alternative_views", "No alternative views found"),
            "education_tips": parsed.get("education_tips", "No tips available"),
            "sources": [{"title": s.get("title", ""), "url": s.get("url", "")} for s in results]
        }
    except Exception as e:
        logger.error(f"Neutral news error: {str(e)}")
        return {
            "analysis_type": "error",
            "error": f"Neutral news analysis failed: {str(e)}",
            "sources": []
        }

async def analyze_social_media_context(post_url: str):
    """FIXED: Removed asyncio.run() - already in async context"""
    try:
        if not is_url(post_url):
            post_url = f"https://{post_url}"
        
        metadata = {}
        content = ""
        try:
            headers = {'User-Agent': 'Mozilla/5.0'}
            response = requests.get(post_url, headers=headers, timeout=10)
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                content = soup.get_text(separator=' ', strip=True)[:2000]
                
                if any(x in post_url.lower() for x in ["x.com", "twitter.com"]):
                    metadata["platform"] = "X/Twitter"
                elif "reddit.com" in post_url.lower():
                    metadata["platform"] = "Reddit"
                elif "facebook.com" in post_url.lower():
                    metadata["platform"] = "Facebook"
                elif "instagram.com" in post_url.lower():
                    metadata["platform"] = "Instagram"
                else:
                    metadata["platform"] = "Unknown"
                
                metadata["poster"] = "See post URL"
                metadata["engagement"] = "Not directly scrapable"
            else:
                content = f"Failed to fetch (status: {response.status_code})"
        except Exception as e:
            content = f"Error: {str(e)}"
            metadata = {"platform": "Unknown", "poster": "Unknown", "engagement": "Unknown"}

        claim = ""
        try:
            claim_messages = [HumanMessage(content=f"Extract the main claim in one sentence: {content[:500]}")]
            claim = llm.invoke(claim_messages).content.strip()
        except:
            claim = "No clear claim"

        fact_check_result = None
        if claim and claim != "No clear claim":
            fc_result = await fact_check_single(claim)
            fact_check_result = fc_result
        else:
            fact_check_result = {"claim": "", "analysis": "No claim extracted", "confidence_score": 0}

        metadata_text = "\n".join([f"{k}: {v}" for k, v in metadata.items()])
        messages = [HumanMessage(content=social_media_context_prompt_json.format(
            post_url=post_url,
            metadata=metadata_text,
            claim=claim,
            fact_check=fact_check_result.get("analysis", "No analysis")
        ))]
        response = llm.invoke(messages).content
        parsed = parse_json_response(response)
        
        context_analysis = parsed.get("context_analysis", "Analysis failed") if "error" not in parsed else f"Error: {parsed['error']}"
        
        return context_analysis, fact_check_result
    except Exception as e:
        logger.error(f"Social media context error: {str(e)}")
        return f"Error: {str(e)}", None

# ==================== API Endpoints ====================

@app.get("/")
async def root():
    return {
        "name": "LUMINA - AI Misinformation Detector",
        "version": "2.0.1",
        "status": "operational",
        "endpoints": [
            "/api/fact-check",
            "/api/image-authenticity",
            "/api/video-authenticity",
            "/api/url-safety",
            "/api/media-analysis",
            "/api/social-media-context"
        ]
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": time.time()}

@app.post("/api/fact-check", response_model=FactCheckResponse)
async def fact_check_endpoint(
    claims: Optional[str] = Form(None),
    image: Optional[UploadFile] = Depends(get_optional_image),
    preferred_language: Optional[str] = Form(None)
):
    """Fact-check claims with optional image upload for OCR text extraction."""
    start_time = time.time()
    try:
        all_claims = []
        
        # Handle claims - can be single claim or multiple separated by newlines/semicolons
        if claims and claims.strip():
            # Split by newlines or semicolons
            claim_list = [c.strip() for c in re.split(r'[;\n]+', claims) if c.strip()]
            all_claims.extend(claim_list)
        
        # Handle image OCR (optional) - dependency already filtered it
        if image:
            logger.info(f"Processing image for OCR: {image.filename}")
            try:
                extracted_text = await extract_text_with_mistral(image)
                if extracted_text:
                    logger.info(f"Successfully extracted text from image: {len(extracted_text)} chars")
                    all_claims.append(extracted_text)
                else:
                    logger.warning("No text extracted from image")
            except Exception as e:
                logger.error(f"OCR failed: {str(e)}")
        
        if not all_claims:
            raise HTTPException(status_code=400, detail="No valid claims provided. Please provide text claims or upload an image with text.")
        
        if len(all_claims) > 10:
            all_claims = all_claims[:10]
        
        input_lang = detect_language(all_claims[0])
        output_lang = preferred_language or input_lang
        
        tasks = [fact_check_single(claim, lang=input_lang) for claim in all_claims]
        results = await asyncio.gather(*tasks)
        
        if output_lang != "en":
            for result in results:
                result["analysis"] = translate_text(result["analysis"], output_lang)
                result["confidence_explanation"] = translate_text(result["confidence_explanation"], output_lang)
        
        processing_time = time.time() - start_time
        
        return FactCheckResponse(
            results=[ClaimResult(**r) for r in results],
            status="success",
            processing_time=round(processing_time, 2)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Fact-check endpoint error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")

@app.post("/api/image-authenticity", response_model=ImageAuthenticityResponse)
async def image_authenticity_endpoint(image: UploadFile = File(...)):
    try:
        if not image.content_type or not image.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        logger.info(f"Checking image authenticity: {image.filename}")
        
        image_bytes = await image.read()
        if len(image_bytes) == 0:
            raise HTTPException(status_code=400, detail="Empty image file")
        
        result = check_image_authenticity(image_bytes)
        
        return ImageAuthenticityResponse(
            verdict=result.get("verdict", "error"),
            analysis=result.get("analysis", "No analysis"),
            confidence_score=result.get("confidence_score", 0),
            confidence_explanation=result.get("confidence_explanation", "No explanation"),
            potential_implications=result.get("potential_implications", "Unknown"),
            status="success" if result.get("verdict") != "error" else "error"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Image authenticity error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/video-authenticity", response_model=VideoAuthenticityResponse)
async def video_authenticity_endpoint(video: UploadFile = File(...)):
    try:
        if not video.content_type or not video.content_type.startswith('video/'):
            raise HTTPException(status_code=400, detail="File must be a video")
        
        logger.info(f"Checking video authenticity: {video.filename}")
        
        video_bytes = await video.read()
        if len(video_bytes) == 0:
            raise HTTPException(status_code=400, detail="Empty video file")
        if len(video_bytes) > 15 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Video too large (max 15MB)")
        
        result = check_video_authenticity(video_bytes, video.content_type)
        
        return VideoAuthenticityResponse(
            verdict=result.get("verdict", "error"),
            analysis=result.get("analysis", "No analysis"),
            confidence_score=result.get("confidence_score", 0),
            confidence_explanation=result.get("confidence_explanation", "No explanation"),
            potential_implications=result.get("potential_implications", "Unknown"),
            status="success" if result.get("verdict") != "error" else "error"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Video authenticity error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/url-safety", response_model=URLSafetyResponse)
async def url_safety_endpoint(request: URLSafetyRequest):
    try:
        url = request.url.strip()
        if not url:
            raise HTTPException(status_code=400, detail="URL cannot be empty")
        
        if not url.startswith(('http://', 'https://')):
            url = f"https://{url}"
        
        logger.info(f"Checking URL safety: {url}")
        
        result = check_url_safety(url)
        
        return URLSafetyResponse(
            verdict=result.get("verdict", "error"),
            risk_analysis=result.get("risk_analysis", "No analysis"),
            recommendations=result.get("recommendations", "No recommendations"),
            confidence=result.get("confidence", "low"),
            sources=result.get("sources", []),
            status="success" if result.get("verdict") != "error" else "error"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"URL safety error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/url-safety-form")
async def url_safety_form_endpoint(url: str = Form(...)):
    try:
        url = url.strip()
        if not url:
            raise HTTPException(status_code=400, detail="URL cannot be empty")
        
        if not url.startswith(('http://', 'https://')):
            url = f"https://{url}"
        
        logger.info(f"Form-based URL check: {url}")
        
        result = check_url_safety(url)
        
        return {
            "verdict": result.get("verdict", "error"),
            "risk_analysis": result.get("risk_analysis", "No analysis"),
            "recommendations": result.get("recommendations", "No recommendations"),
            "confidence": result.get("confidence", "low"),
            "sources": result.get("sources", []),
            "status": "success" if result.get("verdict") != "error" else "error"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"URL safety form error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/media-analysis", response_model=MediaAnalysisResponse)
async def media_analysis_endpoint(request: MediaAnalysisRequest):
    try:
        input_text = request.input
        logger.info(f"Media analysis for: {input_text[:100]}...")
        
        result = analyze_media(input_text)
        
        analysis_type = result.get("analysis_type", "error")
        
        if analysis_type == "bias_rating":
            return MediaAnalysisResponse(
                analysis_type="bias_rating",
                bias_rating=result.get("bias_rating"),
                balance_score=result.get("balance_score"),
                bias_analysis=result.get("bias_analysis"),
                sources=result.get("sources", []),
                status="success"
            )
        elif analysis_type == "neutral_summary":
            return MediaAnalysisResponse(
                analysis_type="neutral_summary",
                neutral_summary=result.get("neutral_summary"),
                alternative_views=result.get("alternative_views"),
                education_tips=result.get("education_tips"),
                sources=result.get("sources", []),
                status="success"
            )
        else:
            return MediaAnalysisResponse(
                analysis_type="error",
                sources=[],
                status="error",
                error=result.get("error", "Unknown error")
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Media analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/social-media-context", response_model=SocialMediaContextResponse)
async def social_media_context_endpoint(request: SocialMediaContextRequest):
    try:
        post_url = request.post_url.strip()
        if not post_url:
            raise HTTPException(status_code=400, detail="Post URL cannot be empty")
        
        logger.info(f"Analyzing social media post: {post_url}")
        
        context_analysis, fact_check_result = await analyze_social_media_context(post_url)
        
        return SocialMediaContextResponse(
            context_analysis=context_analysis,
            fact_check_result=fact_check_result,
            status="success"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Social media context endpoint error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/search")
async def search_endpoint(query: str, max_results: int = 5):
    try:
        if not query.strip():
            raise HTTPException(status_code=400, detail="Query cannot be empty")
        
        if max_results > 10:
            max_results = 10
        
        results = cached_search(query, max_results=max_results)
        
        return {
            "query": query,
            "results": [
                {
                    "title": r.get("title", ""),
                    "url": r.get("url", ""),
                    "content": r.get("content", "")[:500]
                } for r in results
            ],
            "count": len(results),
            "status": "success"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Search error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stats")
async def stats_endpoint():
    cache_info = cached_search.cache_info()
    return {
        "cache_hits": cache_info.hits,
        "cache_misses": cache_info.misses,
        "cache_size": cache_info.currsize,
        "cache_max_size": cache_info.maxsize,
        "uptime": time.time(),
        "status": "operational"
    }

@app.post("/api/clear-cache")
async def clear_cache_endpoint():
    cached_search.cache_clear()
    return {"message": "Cache cleared successfully", "status": "success"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")