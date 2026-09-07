import re

with open('src/data/regions/guangdong21CitiesGeo.ts', 'r', encoding='utf-8') as f:
    text = f.read()

matches = re.findall(r'"name":\s*"([^"]+)"', text)
print('Cities in guangdong21CitiesGeo:', len(matches), matches)

# Also check how many points
import json
# find export const GUANGDONG_21_CITIES_GEO = ...
idx = text.find('GUANGDONG_21_CITIES_GEO')
arr_start = text.find('[', idx)
# parse array
data = json.loads(text[arr_start:].rstrip(';\n '))
total_city_pts = sum(sum(len(ring) for ring in c['rings']) for c in data)
print('Total points across 21 cities:', total_city_pts)
for c in data:
    rings_len = [len(r) for r in c['rings']]
    print(f"  {c['name']}: {len(c['rings'])} rings, pts: {sum(rings_len)}")
