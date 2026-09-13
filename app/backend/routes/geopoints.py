from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from database.models.trips import GeoPointModel, TripModel
from schemas.trips import GeoPointListResponseSchema, GeoPointListItemSchema, \
    GeoPointCreateSchema, GeoPointUpdateSchema, GeoPointDetailSchema
from database.session_postgresql import get_postgres_db

router = APIRouter()

@router.get("/geopoints/",
    response_model=GeoPointListResponseSchema,
    summary="List all geopoints",
    responses={
        404: {
            "description": "No geopoints found",
            "content": {
                "application/json": {
                    "example": {"detail": "No geopoints found"}
                }
            },
        }
    }
)
def get_geopoints_list(
        page: int = Query(1, ge=1, description="Page number"),
        per_page: int = Query(10, ge=1, description="Number of geopoints to return per page"),
        db: Session = Depends(get_postgres_db),
) -> GeoPointListResponseSchema:
    offset = (page - 1) * per_page
    query = db.query(GeoPointModel).order_by()
    order_by = GeoPointModel.default_order_by()
    if order_by:
        query = query.order_by(*order_by)

    total_items = query.count()
    geopoints = query.offset(offset).limit(per_page).all()

    geopoint_list = [
        GeoPointListItemSchema.model_validate(geopoint)
        for geopoint in geopoints
    ]

    total_pages = (total_items + per_page - 1) // per_page

    response = GeoPointListResponseSchema(
        geopoints=geopoint_list,
        prev_page=f"/geopoints/?page={page - 1}&per_page={per_page}" if page > 1 else None,
        next_page=f"/geopoints/?page={page + 1}&per_page={per_page}" if page < total_pages else None,
        total_pages=total_pages,
        total_items=total_items,
    )
    return response

@router.post("/geopoints/",response_model=GeoPointDetailSchema,)
def create_geopoint(
        geopoint_data: GeoPointCreateSchema,
        db: Session = Depends(get_postgres_db),
) -> GeoPointDetailSchema:
    trip = None

    if geopoint_data.trip_id is not None:
        trip = (
            db.query(TripModel)
            .filter(TripModel.id == geopoint_data.trip_id)
            .first()
        )

        if not trip:
            raise HTTPException(status_code=404, detail="Trip not found")

    geopoint = GeoPointModel(**geopoint_data.model_dump(exclude={"trip_id"}))

    if trip:
        trip.geopoints.append(geopoint)
    try:
        db.add(geopoint)
        db.commit()
        db.refresh(geopoint)
        return GeoPointDetailSchema.model_validate(geopoint)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=422, detail="Integrity issue while geopoint creation")

@router.get("/geopoints/{id}/",
    response_model=GeoPointDetailSchema, )
def get_geopoint(id: int, db: Session = Depends(get_postgres_db)) ->GeoPointDetailSchema:
    geopoint = (
        db.query(GeoPointModel)
        .filter(GeoPointModel.id == id)
        .first()
    )

    if not geopoint:
        raise HTTPException(status_code=404, detail="Geopoint not found")
    return GeoPointDetailSchema.model_validate(geopoint)

@router.delete("/geopoints/{id}/",)
def delete_geopoint(id: int, db: Session = Depends(get_postgres_db)) -> None:
    geopoint = db.query(GeoPointModel).filter(GeoPointModel.id == id).first()
    if not geopoint:
        raise HTTPException(status_code=404, detail="Geopoint not found")
    try:
        db.delete(geopoint)
        db.commit()
        return {"detail": "Geopoint deleted"}
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=422, detail="Integrity issue while geopoint deletion")

@router.patch("/geopoints/{id}/",)
def update_geopoint(id: int, geopoint_data: GeoPointUpdateSchema, db: Session = Depends(get_postgres_db)) -> None:
    geopoint = db.query(GeoPointModel).filter(GeoPointModel.id == id).first()

    if not geopoint:
        raise HTTPException(status_code=404, detail="Geopoint not found")

    for  field, value in geopoint_data.model_dump(exclude_unset=True).items():
        setattr(geopoint, field, value)

    try:
        db.commit()
        db.refresh(geopoint)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Invalid input data")
    else:
        return {"detail": "Geopoint updated successfully"}
