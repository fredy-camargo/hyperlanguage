import re
import collections

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

ids = re.findall(r'id=["\']([^"\']+)["\']', html)
dupes = collections.Counter(ids)

print("Duplicate IDs in index.html:")
found = False
for id_name, count in dupes.items():
    if count > 1:
        print(f"  - {id_name}: {count} occurrences")
        found = True

if not found:
    print("  None! All IDs are unique.")
