from fastapi import APIRouter, FastAPI
from starlette.middleware.cors import CORSMiddleware

from database.models import trips
from routes import geopoints_router
from routes import trips_router
from routes import users_router

app = FastAPI()

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

