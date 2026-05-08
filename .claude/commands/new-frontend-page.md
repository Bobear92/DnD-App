---
description: Scaffold a new frontend page (component + service + route)
---

Scaffold a new frontend page for this D&D app. The argument is: `<PageName> <url_path> <description>`

Example: `CharacterCreate /campaigns/:campaignId/characters/create Form page for creating a new character`

## Stack rules (non-negotiable)
- **Tailwind CSS v4 + shadcn/ui only** — never write a `.css` file for new pages
- Use `cn()` from `@/lib/utils` for conditional classes
- Import shadcn components from `@/components/ui/<component>`
- Icons from `lucide-react`
- HTTP calls via **axios** with the interceptor pattern (see service pattern below) — never raw `fetch`

## What to build

### 1. `frontend/src/<feature>/pages/<PageName>.jsx`
- Functional component with hooks (`useState`, `useEffect`, `useMemo`)
- Get campaign context and route params:
  ```js
  import { useParams, useNavigate } from 'react-router-dom';
  import { useCampaign } from '../../campaigns/CampaignContext';

  const { campaignId } = useParams();
  const navigate = useNavigate();
  const { campaign } = useCampaign();
  const isGm = campaign?.userRole === 'gm';

  useEffect(() => {
    if (!campaignId) { navigate('/campaigns'); return; }
    loadData();
  }, [campaignId]);
  ```
- GM check: **always** `campaign?.userRole === 'gm'` — never `user.is_admin`
- Wrap all content in `<MainLayout>` from `../../shared/components/layout/MainLayout`
- Include loading state (`<Loader2 className="animate-spin" />`) and inline error state
- All layout via Tailwind utility classes; all interactive elements via shadcn/ui components

### 2. `frontend/src/<feature>/<featureName>Service.js`
Only create if a service file doesn't already exist for this feature. Use axios with an auth interceptor:
```js
import axios from 'axios';

const BASE_URL = 'http://localhost:8000/api/gm/campaigns';
const api = axios.create({ baseURL: BASE_URL });

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
- Import the new component at the top with the other page imports
- Add inside `<Routes>`, wrapped in `<ProtectedRoute>`:
  ```jsx
  <Route path="/campaigns/:campaignId/your-path" element={<ProtectedRoute><YourPage /></ProtectedRoute>} />
  ```

### 4. Write tests — `frontend/src/<feature>/pages/<PageName>.test.jsx`
Co-locate the test file next to the component. Required coverage:
- **Service calls:** the right API method is called with the right arguments
- **Context interaction:** the component reads/writes context (not raw localStorage)
- **Navigation:** `navigate()` is called with the correct path on success
- **Error states:** API failures show an error; navigation and context writes do NOT happen
- **GM gating:** GM-only UI is hidden in player view

Mocking pattern:
```js
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => ({
  ...await vi.importActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));
vi.mock('../../campaigns/CampaignContext', () => ({
  useCampaign: () => ({ campaign: { id: 1, name: 'Test', userRole: 'gm' } }),
}));
vi.mock('../myService', () => ({ default: { getAll: vi.fn() } }));
```

Run tests with `npm test` from `frontend/`.

## Reference implementations
- **List page pattern:** `src/npcs/pages/NPCList.jsx` / `src/npcs/pages/NPCList.test.jsx`
- **Detail page with tabs + section editing:** `src/npcs/pages/NPCDetail.jsx`
- **Auth flow tests:** `src/auth/pages/Login.test.jsx` (mocking context hooks)
- **Service pattern:** `src/npcs/npcService.js` or `src/locations/locationService.js`

## Arguments
$ARGUMENTS
