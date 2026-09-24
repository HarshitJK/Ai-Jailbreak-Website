import sys

with open('frontend/src/lib/apiClient.ts', 'r', encoding='utf-8') as f:
    content = f.read()

target = 'credentials: "include",  // send session cookie automatically'
replacement = 'credentials: "include",\n    cache: "no-store",  // send session cookie automatically'
if target in content:
    content = content.replace(target, replacement)
    with open('frontend/src/lib/apiClient.ts', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Replaced successfully")
else:
    print("Target not found")
