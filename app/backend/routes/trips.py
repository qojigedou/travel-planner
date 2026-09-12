from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from database.models.trips import TripModel, GeoPointModel
from schemas.trips import TripListItemSchema, TripCreateSchema, TripDeleteSchema, TripUpdateSchema, TripDetailSchema, TripListResponseSchema
from database.session_postgresql import get_postgres_db

router = APIRouter()

@router.get("/trips/",
    response_model=TripListResponseSchema,
    summary="List all trips",
    responses={
        404: {
            "description": "No trips found",
            "content": {
                "application/json": {
                    "example": {"detail": "No trips found"}
                }
            },
        }
    }
)
def get_trips_list(
        page: int = Query(1, ge=1, description="Page number"),
        per_page: int = Query(10, ge=1, description="Number of trips to return per page"),
        db: Session = Depends(get_postgres_db),
) -> TripListResponseSchema:
    offset = (page - 1) * per_page
    query = db.query(TripModel).order_by()
    order_by = TripModel.default_order_by()
    if order_by:
        query = query.order_by(*order_by)

    total_items = query.count()
    trips = query.offset(offset).limit(per_page).all()

    if not trips:
        raise HTTPException(status_code=404, detail="No trips found")

    trip_list = [
        TripListItemSchema.model_validate(trip)
        for trip in trips
    ]

    total_pages = (total_items + per_page - 1) // per_page

    response = TripListResponseSchema(
        trips=trip_list,
        prev_page=f"/trips/?page={page - 1}&per_page={per_page}" if page > 1 else None,
        next_page=f"/trips/?page={page + 1}&per_page={per_page}" if page < total_pages else None,
        total_pages=total_pages,
        total_items=total_items,
    )
    return response

@router.post("/trips/",response_model=TripDetailSchema,)
def create_trip(
        trip_data: TripCreateSchema,
        db: Session = Depends(get_postgres_db),
) -> TripDetailSchema:

    existing_trip = db.query(TripModel).filter(
        TripModel.title == trip_data.title,
        TripModel.date == trip_data.date,
    ).first()

    if existing_trip:
        raise HTTPException(status_code=409, detail="Trip already exists")

    try:
        geopoints = []
        for geopoint_data in trip_data.geopoints or []:
            geopoint = db.query(GeoPointModel).filter(GeoPointModel.name == geopoint_data.name).first()
            if not geopoint:
                geopoint = GeoPointModel(**geopoint_data.model_dump())
                db.add(geopoint)
                db.flush()
            geopoints.append(geopoint)
    except IntegrityError:
        raise HTTPException(status_code=422, detail="Integrity issue")

    trip = TripModel(
        title=trip_data.title,
        status=trip_data.status,
        date=trip_data.date,
        geopoints=geopoints,)
    try:
        db.add(trip)
        db.commit()
        db.refresh(trip)
        return TripDetailSchema.model_validate(trip)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=422, detail="Integrity issue while trip creation")

@router.get("/trips/{id}/",
    response_model=TripDetailSchema, )
def get_trip(id: int, db: Session = Depends(get_postgres_db)) ->TripDetailSchema:
    trip = (
        db.query(TripModel)
        .options(
            joinedload(TripModel.geopoints),
        )
        .filter(TripModel.id == id)
        .first()
    )

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return TripDetailSchema.model_validate(trip)

@router.delete("/trips/{id}/",)
def delete_trip(id: int, db: Session = Depends(get_postgres_db)) -> None:
    trip = db.query(TripModel).filter(TripModel.id == id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    try:
        db.delete(trip)
        db.commit()
        return {"detail": "Trip deleted"}
    except IntegrityError:
        raise HTTPException(status_code=422, detail="Integrity issue while trip deletion")

@router.patch("/trips/{id}/",)
def update_trip(id: int, trip_data: TripUpdateSchema, db: Session = Depends(get_postgres_db)) -> None:
    trip = db.query(TripModel).filter(TripModel.id == id).first()

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    for  field, value in trip_data.model_dump(exclude_unset=True).items():
        setattr(trip, field, value)

    try:
        db.commit()
        db.refresh(trip)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Invalid input data")
    else:
        return {"detail": "Trip updated successfully"}