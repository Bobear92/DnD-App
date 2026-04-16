---
description: Scaffold a new frontend page (component + CSS + service + route)
---

Scaffold a new frontend page for this D&D app. The argument is: `<PageName> <url_path> <description>`

Example: `CharacterCreate /characters/create Form page for creating a new character`

## What to build

### 1. `frontend/src/<feature>/pages/<PageName>.jsx`
Follow the existing page structure:
- Functional component with hooks (useState, useEffect)
- Load data from the relevant service on mount
- Read user/campaign from localStorage: `JSON.parse(localStorage.getItem('user'))` and `localStorage.getItem('selectedCampaign')`
- If unauthenticated, redirect: `navigate('/login')`
- Wrap content in `<MainLayout>` from `shared/components/layout/MainLayout`
- Include loading state and error state
- Use consistent CSS class naming (kebab-case, prefixed by page name)

### 2. `frontend/src/<feature>/pages/<PageName>.css`
- Scoped styles for this page only
- Follow the existing CSS structure (container, header, grid/list, card patterns)

### 3. `frontend/src/<feature>/<featureName>Service.js`
- Only create if a service file doesn't already exist for this feature
- Export async functions that call the backend API
- Use `localStorage.getItem('token')` for the Authorization header
- Base URL: `http://localhost:8000`
- Follow the pattern: `async function getX() { const res = await fetch(...); if (!res.ok) throw new Error(...); return res.json(); }`

### 4. Register the route in `frontend/src/App.jsx`
- Import the new component
- Add `<Route path="$URL_PATH" element={<$PageName />} />` inside `<Routes>`

## Arguments
$ARGUMENTS
