# 09 · Development workflow

## Run the stack

The pod already runs everything under **supervisor**. You typically do not
start anything manually.

```bash
sudo supervisorctl status
# backend     RUNNING   pid 12345, uptime …
# frontend    RUNNING   pid 12346, uptime …
```

If you change `.env` or install a new dependency, **restart**:
```bash
sudo supervisorctl restart backend     # or `frontend`
```

Code changes are hot-reloaded automatically. No need to restart for `.py`/`.js` edits.

## Useful tail commands

```bash
tail -n 200 -f /var/log/supervisor/backend.err.log    # FastAPI errors + logs
tail -n 200 -f /var/log/supervisor/backend.out.log    # FastAPI stdout
tail -n 200 -f /var/log/supervisor/frontend.err.log   # CRA / yarn errors
```

## Backend

```bash
# Install a new dep
pip install <pkg>
pip freeze > /app/backend/requirements.txt

# Run pytest
cd /app/backend && pytest -q

# Lint
ruff check /app/backend
```

## Frontend

```bash
# Add a dep (uses yarn, NOT npm)
cd /app/frontend && yarn add <pkg>

# Lint
yarn lint
```

## Quick API smoke (uses the preview URL from env)

```bash
API_URL=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d= -f2 | tr -d '"')
TOK=$(curl -s -X POST "$API_URL/api/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"password":"mir-admin-2026"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")
curl -s "$API_URL/api/admin/stats" -H "Authorization: Bearer $TOK" | python3 -m json.tool
```

## Testing strategy

| Scope | How |
| --- | --- |
| Single curl smoke | inline bash as above |
| Backend unit tests | `pytest backend/tests/` |
| Full E2E (frontend + backend) | call the `testing_agent_v3_fork` subagent — see `/app/test_reports/iteration_*.json` for history. |
| UI smoke screenshots | `mcp_screenshot_tool` |

## Coding conventions

- **Routes** always prefixed with `/api` on the backend.
- Reads from MongoDB use `Model.from_mongo(doc)` helpers (`backend/server.py`). Never spread raw docs.
- ObjectIds are NEVER returned in JSON — all `id` fields are UUID strings.
- Frontend axios calls live in `frontend/src/lib/api.js`; pages never import axios directly.
- All interactive DOM elements get a unique `data-testid` (see existing pages for patterns).
- Tailwind classes use the design tokens from `/app/design_guidelines.json` (e.g. `text-mir-text`, `border-mir-border`).
- shadcn primitives come from `/app/frontend/src/components/ui/`.
