from fastapi import APIRouter, FastAPI

from database.models import trips
from routes import geopoints_router
from routes import trips_router
from routes import users_router

app = FastAPI()
app.include_router(geopoints_router, tags=["geopoints"])
app.include_router(trips_router, tags=["trips"])
app.include_router(users_router, tags=["users"])

# @app.get("/trips/")
# def get_trips():
#     # return {TripsSerializer}
#     return "ok"
