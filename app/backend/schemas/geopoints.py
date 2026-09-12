# from datetime import date
# from pydantic import BaseModel, Field, model_validator
# from database.models.trips import GeoStatusEnum
# from typing import Optional
#
#
# class GeoPointSchema(BaseModel):
#     id: int
#     name: str
#     geo_latitude: Optional[float] = Field(None, ge=-90, le=90)
#     geo_longitude: Optional[float] = Field(None, ge=-180, le=180)
#     geo_link: str | None = Field(None, max_length=256)
#     status: GeoStatusEnum
#     score: Optional[float] = Field(None, ge=0, le=1)
#     addition_date: date
#
#     model_config = {
#         "from_attributes": True
#     }
#
# class GeoPointCreateSchema(BaseModel):
#     name: str = Field(..., min_length=1, max_length=256)
#     geo_latitude: Optional[float] = Field(None, ge=-90, le=90)
#     geo_longitude: Optional[float] = Field(None, ge=-180, le=180)
#     geo_link: str | None = Field(None, max_length=256)
#     status: GeoStatusEnum = GeoStatusEnum.NOT_VISITED
#     score: Optional[float] = Field(None, ge=0, le=1)
#     addition_date: date
#     trips: Optional[list[TripsCreateSchema]]
#
#     @model_validator(mode="after")
#     def validate_coords(self):
#         has_latitude, has_longitude = self.geo_latitude is not None, self.geo_longitude is not None
#         if has_latitude != has_longitude:
#             raise ValueError("GeoPointCreateSchema must have latitude and longitude")
#         return self
#
#
#
#
# class GeoPointUpdateSchema(BaseModel):
#     name: Optional[str] = None
#     geo_latitude: Optional[float] = None
#     geo_longitude: Optional[float] = None
#     geo_link: Optional[str] = None
#     status: Optional[GeoStatusEnum] = None
#     score: Optional[float] = Field(None, ge=0.0)
#     addition_date: Optional[date] = None
#
#     model_config = {
#         "from_attributes": True
#     }
#
# class GeoPointDeleteSchema(BaseModel):
#     name: Optional[str] = None
#     geo_latitude: Optional[float] = None
#     geo_longitude: Optional[float] = None
#     geo_link: Optional[str] = None
#     status: Optional[GeoStatusEnum] = None
#     score: Optional[float] = None
#     addition_date: Optional[date] = None
#
#     model_config = {
#         "from_attributes": True
#     }
#
# class GeoPointListItemSchema(BaseModel):
#     id: int
#     name: str
#     addition_date: date
#     model_config = {
#         "from_attributes": True
#     }
#
# class GeoPointListResponseSchema(BaseModel):
#     geopoints: list[GeoPointListItemSchema]
#     prev_page: Optional[str]
#     next_page: Optional[str]
#     total_pages: int
#     total_items: int
#
#     model_config = {
#         "from_attributes": True
#     }
#
# class GeoPointDetailSchema(BaseModel):
#     id: int
#     name: str
#     geo_latitude: float
#     geo_longitude: float
#     geo_link: str
#     status: GeoStatusEnum
#     score: float
#     addition_date: date
#
#     model_config = {
#         "from_attributes": True
#     }