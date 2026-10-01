from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from database.models import trips
from routes import geopoints_router
from routes import trips_router
from routes import users_router
from limiter import limiter

app = FastAPI()

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

origins = [
    "http://localhost:3000",
    "http://localhost:80",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(geopoints_router, tags=["geopoints"])
app.include_router(trips_router, tags=["trips"])
app.include_router(users_router, tags=["users"])

