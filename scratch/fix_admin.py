import re

with open("d:/Ai-Jailbreak-Website/backend/app/routers/admin.py", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Remove verify_admin_header and _require_admin
content = re.sub(
    r'# ── Legacy header-based guard \(kept for direct API tooling\) ───────────────────\n\n'
    r'def verify_admin_header\(.*?def _require_admin\(.*?'
    r'raise HTTPException\(status_code=401, detail="Admin authentication required."\)\n\n',
    '', content, flags=re.DOTALL
)

# 2. Add dependencies=[Depends(get_current_admin)] to all protected routes
# This regex targets all @router.* except login and logout
routes_to_protect = [
    r'("/api/admin/teams",\n    response_model=List\[AdminTeamRow\],)',
    r'("/api/admin/teams/\{team_id\}/logs",\n    response_model=List\[ChatLogRow\],)',
    r'("/api/admin/teams/\{team_id\}/advance")',
    r'("/api/admin/leaderboard/round1", response_model=List\[AdminTeamRow\])',
    r'("/api/admin/leaderboard/round2", response_model=List\[AdminTeamRow\])',
    r'("/api/admin/teams/\{team_id\}/qualify")',
    r'("/api/admin/teams/\{team_id\}")',
    r'("/api/admin/teams/\{team_id\}/force-complete-r1")',
    r'("/api/admin/unlock-round2")',
    r'("/api/admin/round2/start")',
    r'("/api/admin/round2/stop")'
]

for route in routes_to_protect:
    # replace `@router.get(route)` with `@router.get(route, dependencies=[Depends(get_current_admin)])`
    # taking into account multiline strings and closing parenthesis
    content = re.sub(
        r'(@router\.(?:get|post|delete)\(' + route + r')\n?\)',
        r'\1,\n    dependencies=[Depends(get_current_admin)]\n)',
        content
    )

# 3. Remove `request: Request,` and `x_admin_secret...` from the function parameters
content = re.sub(
    r'\s*request:\s*Request,?\n?',
    '\n', content
)
content = re.sub(
    r'\s*x_admin_secret:\s*Optional\[str\]\s*=\s*Header\(default=None\),?\n?',
    '\n', content
)
content = re.sub(r',\n\s*\)', '\n)', content) # cleanup trailing commas if any

# 4. Remove `_require_admin(request, x_admin_secret)` calls
content = re.sub(
    r'\s*_require_admin\(request, x_admin_secret\)\n',
    '\n', content
)

# 5. Fix `admin_advance_team` bug:
content = content.replace(
    '''        if payload.target_stage == 5 and False: # we only complete it if they actually finish 5
            pass''',
    ''
)

# 6. Move `from app.services import session_store` to the top
content = content.replace(
    '''from app.models import AdminAdvanceRequest
from datetime import timezone
from app.services import session_store''',
    '''from app.models import AdminAdvanceRequest
from datetime import timezone'''
)

# Add session_store to the top imports
content = content.replace(
    'from app.db import get_db',
    'from app.db import get_db\nfrom app.services import session_store'
)


with open("d:/Ai-Jailbreak-Website/backend/app/routers/admin.py", "w", encoding="utf-8") as f:
    f.write(content)
