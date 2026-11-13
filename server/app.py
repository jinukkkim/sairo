"""Local demo API. Run with uvicorn server.app:app --reload."""

from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from server.demo import demo_response

from core.translation import (
    PROFILES, Improvement, ImprovementInput, MessageInput, ReviewBatch, ThreadInput,
    ThreadResult, TranslationBatch, TranslationInput,
)

ROOT = Path(__file__).resolve().parent.parent
app = FastAPI(title="Sairo", docs_url=None, redoc_url=None)
app.mount("/assets", StaticFiles(directory=ROOT / "web"), name="assets")


@app.get("/")
async def index():
    return FileResponse(ROOT / "web" / "index.html")


@app.get("/api/profiles")
async def profiles():
    return [profile.model_dump() for profile in PROFILES]


@app.middleware("http")
async def prevent_api_caching(request: Request, call_next):
    response = await call_next(request)
    if request.url.path.startswith("/api/"):
        response.headers["Cache-Control"] = "no-store"
    return response


@app.post("/api/translate", response_model=TranslationBatch)
async def translate_message(body: TranslationInput):
    return await demo_response('translate', body)


@app.post("/api/review", response_model=ReviewBatch)
async def review_message(body: MessageInput):
    return await demo_response('review', body)


@app.post("/api/improve", response_model=Improvement)
async def improve_message(body: ImprovementInput):
    return await demo_response('improve', body)


@app.post("/api/thread-check", response_model=ThreadResult)
async def check_thread(body: ThreadInput):
    return await demo_response('thread-check', body)
