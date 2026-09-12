import os
from pathlib import Path
from typing import Any

from pydantic_settings import BaseSettings

class BaseAppSettings(BaseSettings):
    BASE_DIR: Path = Path(__file__).parent.parent