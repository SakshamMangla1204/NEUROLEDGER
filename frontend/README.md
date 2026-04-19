The frontend is now a React multi-page application built with Vite.

Run locally:

1. `cd frontend`
2. `npm install`
3. `npm run dev`
4. keep the backend running on `http://127.0.0.1:5050`
5. open `http://127.0.0.1:5173`

Build for backend serving:

1. `cd frontend`
2. `npm run build`
3. start the backend
4. open `http://127.0.0.1:5050`

Optional environment variables:

- `VITE_API_TARGET`: backend target used by the Vite dev proxy
- `VITE_API_BASE_URL`: absolute API base URL to use instead of the dev proxy

Pages included:

- `Dashboard`
- `Identity`
- `Wearables`
- `Reports`
- `Verification`
