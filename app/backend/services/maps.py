import re
from urllib.parse import urlparse, parse_qs, unquote

import httpx

SHORT_HOSTS = {"maps.app.goo.gl", "goo.gl"}
ALLOWED_HOSTS = SHORT_HOSTS | {
    "google.com", "www.google.com", "maps.google.com",
}

_NUM = r"(-?\d{1,2}(?:\.\d+)?),\s*(-?\d{1,3}(?:\.\d+)?)"
_PIN = re.compile(r"!3d(-?\d{1,2}\.\d+)!4d(-?\d{1,3}\.\d+)")
_AT = re.compile(r"@" + _NUM)
_QUERY = re.compile(r"^\s*" + _NUM)

def _host(url: str) -> str:
    return (urlparse(url).hostname or "").lower()


def resolve_short_link(url: str) -> str:
    """Follow redirects of maps.app.goo.gl links. Only whitelisted hosts (SSRF protection)."""
    if _host(url) not in SHORT_HOSTS:
        return url
    try:
        with httpx.Client(follow_redirects=True, timeout=8) as client:
            resp = client.get(url, headers={"User-Agent": "Mozilla/5.0"})
            return str(resp.url)
    except httpx.HTTPError:
        return url

def _valid(lat: float, lng: float) -> bool:
    return abs(lat) <= 90 and abs(lng) <= 180


def extract_coords(link: str | None) -> tuple[float, float] | None:
    if not link:
        return None
    host = _host(link)
    if host not in ALLOWED_HOSTS and not host.endswith(".google.com"):
        return None

    url = unquote(resolve_short_link(link))

    if m := _PIN.search(url):
        lat, lng = float(m[1]), float(m[2])
        if _valid(lat, lng):
            return lat, lng

    qs = parse_qs(urlparse(url).query)
    for key in ("q", "ll", "query", "destination", "center"):
        if key in qs and (m := _QUERY.match(qs[key][0])):
            lat, lng = float(m[1]), float(m[2])
            if _valid(lat, lng):
                return lat, lng

    if m := _AT.search(url):
        lat, lng = float(m[1]), float(m[2])
        if _valid(lat, lng):
            return lat, lng

    return None