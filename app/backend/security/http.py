from fastapi import Request, HTTPException, status

def get_token(req: Request) -> str:
    autorization: str = req.headers.get("Authorization")

    if not autorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )

    scheme, _, token = autorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )

    return token
