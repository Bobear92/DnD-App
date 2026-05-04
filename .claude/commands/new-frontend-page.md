---
description: Scaffold a new frontend page (component + service + route)
---

Scaffold a new frontend page for this D&D app. The argument is: `<PageName> <url_path> <description>`

Example: `CharacterCreate /characters/create Form page for creating a new character`

## Stack rules (non-negotiable)
- **Tailwind CSS v4 + shadcn/ui only** — never write a `.css` file for new pages
- Use `cn()` from `@/lib/utils` for conditional classes
- Import shadcn components from `@/components/ui/<component>`
- Icons from `lucide-react`
- HTTP calls via **axios** with the interceptor pattern (see service pattern below) — never raw `fetch`

## What to build

### 1. `frontend/src/<feature>/pages/<PageName>.jsx`
- Functional component with hooks (`useState`, `useEffect`)
- Load user/campaign from localStorage on mount:
  ```js
  const storedUser = JSON.parse(localStorage.getItem('user'));
  const storedCampaign = JSON.parse(localStorage.getItem('selectedCampaign'));
  if (!storedUser || !storedCampaign) { navigate('/campaigns'); return; }
  ```
- Wrap all content in `<MainLayout>` from `../../shared/components/layout/MainLayout`
- Include loading state (`<Loader2 className="animate-spin" />`) and error state
- All layout via Tailwind utility classes; all interactive elements via shadcn/ui components

### 2. `frontend/src/<feature>/<featureName>Service.js`
Only create if a service file doesn't already exist for this feature. Use axios with an auth interceptor:
```js
import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:8000/api/...' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const myService = {
  getAll: async (campaignId) => {
    const res = await api.get(`/${campaignId}/items`);
    return res.data;
  },
  // ...
};

export default myService;
```

### 3. Register the route in `frontend/src/App.jsx`
- Import the new component
- Add `<Route path="$URL_PATH" element={<$PageName />} />` inside `<Routes>`

## Arguments
$ARGUMENTS
