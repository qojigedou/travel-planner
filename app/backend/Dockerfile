FROM python:3.14

RUN python -m pip install --upgrade pip && \
    pip install poetry

WORKDIR ../backend

COPY ./poetry.lock ./poetry.lock
COPY ./pyproject.toml ./pyproject.toml

RUN poetry config virtualenvs.create false

RUN poetry lock
RUN poetry install --no-root

COPY . .

CMD ["fastapi", "run", "main.py", "--port", "80"]
