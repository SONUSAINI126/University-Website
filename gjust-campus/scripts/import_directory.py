"""Refresh professional contacts from GJUST's public faculty and office listings."""

from concurrent.futures import ThreadPoolExecutor
from html import unescape
from datetime import date
from hashlib import sha256
from pathlib import Path
from tempfile import gettempdir
from urllib.parse import urljoin
from urllib.request import Request, urlopen
import json
import re
import time


BASE = "https://gjust.ac.in"
INDEX = BASE + "/Page/Index_Faculties/Department/550"
CONTACTS = BASE + "/Page/Index_contact/Contact-Us-Page-Index-1s-University/15"
CHAIRS = BASE + "/Page/Index_DeanFaculty/Chairperson-Incharges/52"
OUTPUT = Path(__file__).resolve().parents[1] / "dist/data/directory.js"
EMAIL = re.compile(r"[\w.%+\-]+@[\w.\-]+\.[A-Za-z]{2,}")
PHONE = re.compile(r"01662[\s\-]*\d{6}|(?:\(?\+?91\)?[\s\-]*)?[6-9]\d{9}")
PUBLISHED_OFFICES = {
    "navdeep mor": ("Room 106, Teaching Block 4", BASE + "/portal/StaffImage/902302-CV.pdf"),
    "aradhita barmanray": (
        "Room 106, ground floor, Teaching Block 1",
        BASE + "/portal/StaffImage/efa6dcb8-3247-4080-a8db-0066745bdb34.pdf",
    ),
}


def fetch(url):
    cache = Path(gettempdir()) / "gjust-directory" / date.today().isoformat()
    cache.mkdir(parents=True, exist_ok=True)
    stored = cache / (sha256(url.encode()).hexdigest() + ".html")
    if stored.exists():
        return stored.read_text(encoding="utf-8")
    for attempt in range(3):
        try:
            # GJUST also serves the same records with hyphenated URL slugs.
            fetch_url = url
            if attempt == 1:
                head, slug, tail = url.rsplit("/", 2)
                fetch_url = "/".join([head, slug.replace("_", "-"), tail])
            request = Request(fetch_url, headers={"User-Agent": "GJUST-campus-guide/1.0"})
            with urlopen(request, timeout=22) as response:
                markup = response.read().decode("utf-8-sig")
            stored.write_text(markup, encoding="utf-8")
            return markup
        except OSError:
            if attempt == 2:
                raise
            time.sleep(attempt + 1)


def plain(value):
    return " ".join(unescape(re.sub(r"<[^>]+>", " ", value)).split())


def links(markup):
    return set(unescape(x) for x in re.findall(r'href="([^"]+)"', markup, re.I))


def faculty_page(department_url):
    relevant = [urljoin(BASE, x) for x in links(fetch(department_url))
                if re.search(r"/Index_Members/Faculty[_-]Members/", x, re.I)]
    return sorted(set(relevant))


def read_faculty(url):
    records = []
    for card in fetch(url).split('class="s-profile row"')[1:]:
        title = re.search(r'id="titleget"[^>]*value="([^"]+)"', card)
        headings = [plain(x) for x in re.findall(r"<h5[^>]*>(.*?)</h5>", card, re.S | re.I)]
        if title is None or len(headings) < 2:
            raise ValueError("Unrecognized faculty profile format at " + url)
        # Only the email and phone headings in the profile's detail table are contacts.
        detail = card.split("profiledetail", 1)[-1].split("</div>", 1)[0]
        contacts = [plain(x) for x in re.findall(r"<h6[^>]*>(.*?)</h6>", detail, re.S | re.I)]
        mail = EMAIL.search(" ".join(contacts))
        number = PHONE.search(" ".join(contacts))
        record = dict(name=headings[0], role=headings[1], department=plain(title[1]),
                      email=mail[0] if mail else "", phone=number[0] if number else "",
                      source=url)
        records.append(record)
    return records


def read_chairs():
    records = []
    for card in re.findall(r'<div class="col-md-9">(.*?)</div>', fetch(CHAIRS), re.S):
        fields = re.findall(r"<h6>(.*?)</h6>", card, re.S)
        if len(fields) < 3 or "fa-address-card" not in fields[2]:
            continue
        name, role, department = map(plain, fields[:3])
        contacts = " ".join(map(plain, fields[3:]))
        email = EMAIL.search(contacts)
        phone = PHONE.search(contacts)
        records.append(dict(name=name, role=role, department=department,
                            email=email[0] if email else "", phone=phone[0] if phone else "",
                            source=CHAIRS))
    return records


def finalize(faculty, offices, chairs):
    unique = {}
    for member in faculty:
        key = (member["department"], member["name"], member["email"])
        record = unique.setdefault(key, member)
        for field in ("phone", "role"):
            record[field] = record[field] or member[field]
    for chair in chairs:
        match = next((row for row in unique.values() if row["department"] == chair["department"]
                      and row["name"] == chair["name"]
                      and (row["email"] == chair["email"] or not row["email"] or not chair["email"])), None)
        if match:
            match["role"] = match["role"] or chair["role"]
        else:
            unique[(chair["department"], chair["name"], chair["email"])] = chair
    faculty = sorted(unique.values(), key=lambda item: (item["department"], item["name"]))
    for member in faculty:
        for name, office in PUBLISHED_OFFICES.items():
            if member["name"].lower().endswith(name):
                member["office"], member["officeSource"] = office
        # This directory profile links to the CV under the faculty member's alternate name.
        if member["email"].lower() == "sunilverma@gjust.org":
            member["aliases"] = ["Dr. Sunil Verma"]
            member["office"] = "Room 125, Teaching Block 7"
            member["officeSource"] = BASE + "/portal/StaffImage/1031-CV.pdf"
    if not faculty or not offices:
        raise RuntimeError("Directory extraction returned an empty list.")
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    source = []
    for variable, rows in [("CAMPUS_DIRECTORY", faculty), ("CAMPUS_SERVICES", offices)]:
        source.append("window." + variable + " = " + json.dumps(rows, ensure_ascii=False, indent=2) + ";")
    OUTPUT.write_text("\n\n".join(source) + "\n", encoding="utf-8")
    print(len(faculty), "directory listings;", len({r["department"] for r in faculty}),
          "departments;", len(offices), "service contacts")


def read_services():
    markup = unescape(fetch(CONTACTS))
    result = {}
    for row in re.findall(r"<tr\b[^>]*>(.*?)</tr>", markup, re.I | re.S):
        cells = [plain(c) for c in re.findall(r"<td\b[^>]*>(.*?)</td>", row, re.I | re.S)]
        if len(cells) != 2:
            continue
        name = cells[0].replace("Deptt.", "Department").replace("Secutiry", "Security")
        phones = re.findall(r"01662-\d{6}", cells[1])
        if phones:
            result.setdefault(name, []).extend(phones)
    records = []
    for name, phones in result.items():
        unique = list(dict.fromkeys(phones))
        extra = "Additional office numbers: " + ", ".join(unique[1:]) if len(unique) > 1 else ""
        records.append(dict(name=name, phone=unique[0], source=CONTACTS, description=extra))
    return records


def main():
    department_urls = sorted(urljoin(BASE, x) for x in links(fetch(INDEX))
                             if re.match(r"^/Page/Index_Department/(Department_of_|Haryana_School_|Guru_Jamb)", x, re.I))
    if not department_urls:
        raise RuntimeError("No departments found at " + INDEX)
    with ThreadPoolExecutor(max_workers=4) as pool:
        discovered = list(pool.map(faculty_page, department_urls))
        member_urls = sorted({url for group in discovered for url in group})
        faculty = [member for group in pool.map(read_faculty, member_urls) for member in group]
    for url, member_links in zip(department_urls, discovered):
        if not member_links:
            print("No faculty members link at", url)
    finalize(faculty, read_services(), read_chairs())


if __name__ == "__main__":
    main()
