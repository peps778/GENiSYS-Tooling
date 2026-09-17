# GENiSYS Linux Docs integration

The current GENiSYS `GenisysApp.tsx` already exposes `/linux`, but its current import is:

```tsx
import LinuxDocs from "./pages/LinuxDocs";
```

The requested architecture places the feature under `src/components/LinuxDocs/`. Change only that import to:

```tsx
import LinuxDocs from "./LinuxDocs";
```

if `LinuxDocsPage.tsx` is copied to `src/components/LinuxDocs/` and `GenisysApp.tsx` is located directly in `src/components/`.

Then the existing route can remain unchanged:

```tsx
<Route path="/linux" element={<LinuxDocs />} />
```

No second BrowserRouter should be introduced. The existing application shell already owns the router and persistent Sidebar.
