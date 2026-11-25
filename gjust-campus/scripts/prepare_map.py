"""Build the campus extract. Requires pmtiles, mapbox-vector-tile and shapely.
Usage: python scripts/prepare_map.py [downloaded-osm.xml]
"""
import argparse
import gzip
import json
import math
import tempfile
import xml.etree.ElementTree as ET
from functools import lru_cache
from pathlib import Path
from urllib.request import Request, urlopen

import mapbox_vector_tile
from pmtiles.reader import Reader
from shapely.geometry import LineString, Point, Polygon, mapping, shape
from shapely.ops import transform, unary_union

ROOT = Path(__file__).resolve().parent.parent
OSM_URL = 'https://api.openstreetmap.org/api/0.6/map?bbox=75.724,29.158,75.752,29.181'
RELEASE = '2026-11-18.0'
TILES = 'https://overturemaps-extras-us-west-2.s3.us-west-2.amazonaws.com/tiles'
BOUNDARY = '183636455'
GJUST_INSPECTION = 'https://gjust.ac.in/portal/upload/Standard%20Inspection%20Form%20Jan%202025_15January2025_13-28-19-80.pdf'
UNIVERSITY_PLACES = [
    # The university form records a facility coordinate, without specifying a street entrance.
    ('auditorium','Ch. Ranbir Singh Auditorium','auditorium',75.735186,29.170027),
    ('boys-hostel','Boys’ hostel area','hostel',75.738399,29.172849),
    ('girls-hostel','Girls’ hostel area','hostel',75.731478,29.172010),
    ('herbal-garden','Herbal Garden','garden',75.731579,29.175347),
    ('instrumentation','Central Instrumentation Room','laboratory',75.736175,29.172142),
    ('water-cooler','Pharmacy drinking water point','drinking_water',75.736066,29.172732),
    ('first-aid','First aid room','first_aid',75.733443,29.172492),
    ('seminar-hall','Pharmacy seminar hall','lecture_hall',75.736345,29.172942),
    ('computer-lab','B.Pharm computer room','laboratory',75.736046,29.170309),
    ('pharmacy-faculty-room','Pharmacy faculty room','faculty_room',75.735083,29.172441),
    ('pharmacy-toilets','Pharmacy toilet blocks','toilets',75.736352,29.172984),
]
# A handful of university facilities have distinct, identifiable Overture records.
# Records with conflicting coordinates, duplicate pins and off-campus businesses are excluded.
OVERTURE_PLACES = {
    '3b1387cf-0752-43af-9b4e-9f19298d284d':('Punjab National Bank & ATM','bank'),
    '5bf0bf5a-a7f2-4566-b263-30b589673995':('Garden of Fragrance','garden'),
    'f5c17bc6-786a-4aea-815a-dc8eb4b0159e':('Department of Pharmaceutical Sciences','department'),
    '2423c586-0111-4a81-9f68-7fe80f8d5752':('Rose Garden','garden'),
    '8a788df7-80fb-46ce-82f1-9f7ffdc534b8':('Teaching Block IV','academic'),
    'c3428042-e41a-4a78-b671-ea4c57a769e8':('Girls’ Hostel No. 1','hostel'),
    '298768ec-a703-4d61-a26e-e62a6354429a':('Administrative Block','administration'),
    'a1629c7d-b568-4321-aaea-74dd34819101':('Teaching Block VII','academic'),
}
CACHE = Path(tempfile.gettempdir()) / 'gjust-carto-cache'
CACHE.mkdir(exist_ok=True)


def retrieve(url, filename, start=None, length=None):
    path = CACHE / filename
    if not path.exists():
        headers = {'User-Agent': 'GJUSTCampusGuide/1.0 (open map extract)'}
        if start is not None:
            headers['Range'] = f'bytes={start}-{start + length - 1}'
        with urlopen(Request(url, headers=headers), timeout=60) as reply:
            if start is not None and reply.status != 206:
                raise RuntimeError('Server did not support the requested byte range')
            data = reply.read()
        if length is not None and len(data) != length:
            raise RuntimeError('Incomplete tile range')
        path.write_bytes(data)
    return path.read_bytes()


def osm_features(filename):
    root = ET.fromstring(Path(filename).read_bytes() if filename else retrieve(OSM_URL, 'campus.xml'))
    nodes = {n.get('id'): (float(n.get('lon')), float(n.get('lat'))) for n in root.findall('node')}
    ways = root.findall('way')
    def coords(w):
        return [nodes[n.get('ref')] for n in w.findall('nd') if n.get('ref') in nodes]
    campus = Polygon(coords(next(w for w in ways if w.get('id') == BOUNDARY)))
    features = []
    for w in ways:
        tags = {t.get('k'):t.get('v') for t in w.findall('tag')}
        if not set(tags).intersection({'highway','landuse','natural','amenity','building','leisure','waterway'}):
            continue
        points = coords(w)
        if len(points) < 2:
            continue
        is_area = len(points) > 3 and points[0] == points[-1] and ('highway' not in tags or tags.get('area') == 'yes')
        geom = Polygon(points) if is_area else LineString(points)
        if w.get('id') != BOUNDARY and not geom.intersects(campus.buffer(0.00013)):
            continue
        if not geom.is_valid:
            geom = geom.buffer(0)
        if w.get('id') != BOUNDARY:
            geom = geom.intersection(campus.buffer(0.00022))
        if geom.geom_type not in {'Polygon','MultiPolygon','LineString','MultiLineString'}:
            continue
        # Keep separate road segments so browser routing can join original shared vertices.
        segments = geom.geoms if geom.geom_type == 'MultiLineString' else [geom]
        for i, segment in enumerate(segments):
            features.append(feature('way/'+w.get('id')+(':'+str(i) if i else ''), tags, segment))
    return campus, features


def feature(fid, tags, geometry):
    def rounded(value):
        if isinstance(value, (list, tuple)):
            return [rounded(n) for n in value]
        return round(value,7)
    geo = mapping(geometry)
    return {'type':'Feature','id':fid,'properties':tags,'geometry':{'type':geo['type'],'coordinates':rounded(geo['coordinates'])}}


def tile_number(lon,lat,z):
    n = 2**z
    return (int((lon+180)/360*n), int((1-math.asinh(math.tan(math.radians(lat)))/math.pi)/2*n))


def overture_features(theme, campus):
    url = f'{TILES}/{RELEASE}/{theme}.pmtiles'
    def fetch(offset, length):
        return retrieve(url, f'{RELEASE}-{theme}-{offset}-{length}.bin', offset, length)
    reader = Reader(lru_cache(maxsize=32)(fetch))
    z = reader.header()['max_zoom']
    left,bottom,right,top = campus.bounds
    x0,y0 = tile_number(left,top,z)
    x1,y1 = tile_number(right,bottom,z)
    print(theme, 'zoom',z,'tiles',(x1-x0+1)*(y1-y0+1),flush=True)
    records = {}
    for tx in range(x0,x1+1):
        for ty in range(y0,y1+1):
            tile = reader.get(z,tx,ty)
            if not tile:
                continue
            if tile.startswith(b'\x1f\x8b'):
                tile = gzip.decompress(tile)
            layers = mapbox_vector_tile.decode(tile, default_options={'y_coord_down':True})
            layer = layers.get('building' if theme=='buildings' else 'place',{})
            extent = layer.get('extent',4096)
            def geographic(x,y):
                lon = (tx+x/extent)/(2**z)*360-180
                lat = math.degrees(math.atan(math.sinh(math.pi*(1-2*(ty+y/extent)/(2**z)))))
                return (lon,lat)
            for f in layer.get('features',[]):
                props = f['properties']
                geom = transform(geographic, shape(f['geometry']))
                if not campus.covers(geom.representative_point()):
                    continue
                ident = str(props.get('id') or props.get('@id') or f['id'])
                if ident not in records:
                    records[ident] = [props, []]
                records[ident][1].append(geom)
    out = []
    for ident,(props,geoms) in records.items():
        if theme=='buildings':
            tags = {'building':'yes','source':props.get('@geometry_source','Overture Maps')}
            for k in ['height','num_floors']:
                if props.get(k):
                    tags['building:levels' if k=='num_floors' else k] = props[k]
        else:
            if ident not in OVERTURE_PLACES:
                continue
            name, category = OVERTURE_PLACES[ident]
            tags = {'source':'Overture Maps','name':name,'category':category,'accuracy':'Approximate map pin',
                    'sourceUrl':'https://www.overturemaps.org/'}
        geom = unary_union([g if g.is_valid else g.buffer(0) for g in geoms])
        out.append(feature('overture/'+ident,tags,geom))
    return out


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('osm',nargs='?')
    args = parser.parse_args()
    campus, mapped = osm_features(args.osm)
    for theme in ['buildings','places']:
        extra = overture_features(theme,campus)
        print(theme,len(extra),flush=True)
        mapped.extend(extra)
    for ident, name, category, lon, lat in UNIVERSITY_PLACES:
        mapped.append(feature('gjust/'+ident, {'name':name,'category':category,'source':'GJUST pharmacy inspection form, January 2025',
                            'sourceUrl':GJUST_INSPECTION,'accuracy':'University facility coordinate'},Point(lon,lat)))
    data = {'type':'FeatureCollection','bbox':list(campus.bounds),'features':mapped,
            'attribution':'© OpenStreetMap contributors, Overture Maps Foundation and its contributors',
            'license':'https://docs.overturemaps.org/attribution/','osmLicense':'https://www.openstreetmap.org/copyright',
            'geometryLicense':'ODbL-1.0','databaseLicenseUrl':'https://opendatacommons.org/licenses/odbl/1-0/',
            'overtureRelease':RELEASE,'osmSnapshot':'2026-11-25'}
    dest = ROOT/'dist'/'data'/'map.js'
    dest.parent.mkdir(exist_ok=True, parents=True)
    dest.write_text('window.CAMPUS_GEO='+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n', encoding='utf-8')
