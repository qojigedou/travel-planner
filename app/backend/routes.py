from fastapi import APIRouter, FastAPI

from database.models import trips

app = FastAPI()

@app.get("/trips/")
def get_trips():
    # return {TripsSerializer}
    return "ok"