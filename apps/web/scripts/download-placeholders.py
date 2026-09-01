import urllib.request
import os
import ssl

base = "public/branding/placeholders"
os.makedirs(base, exist_ok=True)

# Disable SSL verification for picsum if needed on Windows
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

images = [
    # Home
    ("hero-photo", 1200, 900),
    ("hero-tour-poster", 1280, 720),
    ("gallery-1", 800, 800),
    ("gallery-2", 800, 600),
    ("gallery-3", 800, 1000),
    ("gallery-4", 800, 800),
    ("gallery-5", 800, 600),
    ("gallery-6", 800, 1000),
    # About
    ("authority-1", 600, 750),
    ("authority-2", 600, 750),
    ("authority-3", 600, 750),
    ("authority-4", 600, 750),
    ("about-campus", 1200, 800),
    # Levels
    ("level-preescolar", 1200, 800),
    ("level-primaria", 1200, 800),
    ("level-secundaria", 1200, 800),
]

for name, w, h in images:
    url = f"https://picsum.photos/seed/{name}/{w}/{h}"
    path = os.path.join(base, f"{name}.jpg")
    print(f"Downloading {url} -> {path}")
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, context=ctx, timeout=30) as response:
            data = response.read()
        with open(path, "wb") as f:
            f.write(data)
        print(f"  OK ({len(data)} bytes)")
    except Exception as e:
        print(f"  FAIL: {e}")

print("Done.")
