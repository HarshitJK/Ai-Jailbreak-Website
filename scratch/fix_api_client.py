import re

with open("d:/Ai-Jailbreak-Website/frontend/src/lib/apiClient.ts", "r", encoding="utf-8") as f:
    content = f.read()

# Remove ADMIN_SECRET constant
content = re.sub(
    r'// Admin secret kept for direct API tooling \(header-based fallback in backend\)\n'
    r'const ADMIN_SECRET: string =\n'
    r'  \(\(import\.meta as unknown as \{ env: Record<string, string> \}\)\.env\n'
    r'    \.VITE_ADMIN_SECRET \?\? ""\);\n',
    '', content
)

# Remove the header dictionary with X-Admin-Secret from all apiGet and apiPost calls
content = re.sub(
    r',?\s*\{ "X-Admin-Secret": ADMIN_SECRET \}\s*',
    '', content
)
content = re.sub(
    r',\s*\{\s*"X-Admin-Secret": ADMIN_SECRET\s*\}\s*',
    '', content
)
content = re.sub(
    r'headers:\s*\{\s*"X-Admin-Secret": ADMIN_SECRET\s*\},?',
    '', content
)
# We also have one fetch call in deleteTeam
#     headers: { "X-Admin-Secret": ADMIN_SECRET },
content = re.sub(
    r'\s*headers:\s*\{\s*"X-Admin-Secret":\s*ADMIN_SECRET\s*\},\n',
    '\n', content
)

with open("d:/Ai-Jailbreak-Website/frontend/src/lib/apiClient.ts", "w", encoding="utf-8") as f:
    f.write(content)
