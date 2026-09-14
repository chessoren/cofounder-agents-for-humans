"""Generate a realistic, synthetic observation log for demos and tests.

A freelance bookkeeper's week: every morning, supplier invoices arrive in Gmail,
get copied into a Google Sheet, then booked in Pennylane. On Friday, a client
report is assembled from HubSpot into Google Docs and sent. Around it: Slack,
news, music — the noise a real week has. No real person's data is involved.

    python demo/make_sample.py > demo/sample-observation.jsonl
"""

import json
import random
from datetime import datetime, timedelta

rng = random.Random(42)
CHROME = ("Google Chrome", "com.google.Chrome")
events = []


def visit(t, app, bundle, title, url=""):
    events.append({"t": round(t.timestamp(), 3), "app": app, "bundle": bundle, "title": title, "url": url})


def noise(t, n):
    options = [
        ("Slack", "com.tinyspeck.slackmacgap", "#clients - Slack", ""),
        (*CHROME, "Le Monde - Actualités", "https://www.lemonde.fr/"),
        ("Spotify", "com.spotify.client", "Spotify Premium", ""),
        ("Messages", "com.apple.MobileSMS", "Messages", ""),
        (*CHROME, "YouTube", "https://www.youtube.com/"),
    ]
    for _ in range(n):
        app, bundle, title, url = rng.choice(options)
        visit(t, app, bundle, title, url)
        t += timedelta(seconds=rng.randint(40, 400))
    return t


start = datetime(2026, 9, 7, 8, 50)
for day in range(5):
    t = start + timedelta(days=day, minutes=rng.randint(0, 20))
    t = noise(t, 2)
    for k in range(rng.randint(2, 3)):
        inv = f"INV-{2040 + day * 10 + k}"
        supplier = rng.choice(["Acme Supplies", "Bureau Vallée", "OVHcloud", "Free Pro"])
        visit(t, *CHROME, f"Invoice {inv} from {supplier} - Gmail", "https://mail.google.com/mail/u/0/#inbox")
        t += timedelta(seconds=rng.randint(60, 150))
        visit(t, *CHROME, "Supplier invoices Q3 - Google Sheets", "https://docs.google.com/spreadsheets/d/1abc/edit")
        t += timedelta(seconds=rng.randint(90, 200))
        visit(t, *CHROME, "Achats - Pennylane", "https://app.pennylane.com/purchases")
        t += timedelta(seconds=rng.randint(120, 240))
    t = noise(t + timedelta(hours=2), 4)
    if day == 4 or day == 0:
        t = start + timedelta(days=day, hours=7, minutes=rng.randint(0, 15))
        visit(t, *CHROME, "Deals - HubSpot", "https://app.hubspot.com/contacts/deals")
        t += timedelta(seconds=rng.randint(200, 400))
        visit(t, *CHROME, "Weekly client report - Google Docs", "https://docs.google.com/document/d/9xyz/edit")
        t += timedelta(seconds=rng.randint(400, 700))
        visit(t, *CHROME, "Compose: Weekly report - Gmail", "https://mail.google.com/mail/u/0/#inbox?compose=new")
        t += timedelta(seconds=90)
        noise(t, 2)

for e in sorted(events, key=lambda e: e["t"]):
    print(json.dumps(e, ensure_ascii=False))
