# Linux Docs / Command Reference

This folder is a complete replacement module for the existing GENiSYS Linux reference page.

## Placement

Copy the entire `LinuxDocs` directory to:

```text
src/components/LinuxDocs/
```

The resulting structure is:

```text
src/components/LinuxDocs/
├── LinuxDocsPage.tsx
├── components/
├── data/
├── lib/
├── types/
├── tests/
├── index.ts
└── README.md
```

## `/linux` integration

The module exports `LinuxDocsPage` from `index.ts`.

The existing application router should continue to own `/linux`. Wire the existing `/linux` route to the exported page, for example:

```tsx
import LinuxDocsPage from './components/LinuxDocs';
```

Then render `LinuxDocsPage` from the route that already exists.

Do **not** add a `BrowserRouter` here. The module is a page inside the existing SPA shell.

Do **not** add or replace the existing GENiSYS application-level `Sidebar`. `LinuxDocsSidebar` is an internal reference rail only; it is intentionally hidden below the large-screen breakpoint and does not replace the application sidebar.

## Existing files that must remain unchanged

Keep the existing:

- GENiSYS SPA shell
- application-level `Sidebar`
- existing `BrowserRouter`
- existing `/linux` route definition
- existing desktop content offset/margins
- existing green/white branding system

The module is designed to occupy the content area supplied by that shell.

## TypeScript contract

All shared interfaces live in:

```text
types/linuxDocs.ts
```

In particular, every Kali entry uses exactly:

```ts
interface KaliTool {
  name: string;
  purpose: string;
  command: string;
  category: string;
  tags: string[];
}
```

Components and data import this contract rather than defining local competing interfaces.

## Behavior

- Search covers command name, description, syntax, examples, tags, and category.
- Category filtering is available in the desktop reference rail and tabs.
- Command cards are collapsed by default; the first card can open as a useful example.
- Long commands scroll inside their own code blocks.
- The command generator is data-driven and only creates/copies command text.
- Destructive command patterns are rejected by the generator validation helper.
- Pipelines provide both step-by-step and combined copyable representations.
- Network/web examples are explicitly framed for authorized testing.
- The page uses `min-w-0`, `min-h-0`, internal vertical scrolling, responsive grids, and local horizontal scrolling for code/table regions.

## TypeScript checks

Run the project's normal TypeScript check from the application root. Common Astro/TypeScript setups use:

```bash
npm run check
```

or:

```bash
npx tsc --noEmit
```

Use whichever script/configuration the existing GENiSYS project already defines.

## Tests

The module tests use Vitest:

```bash
npx vitest run src/components/LinuxDocs/tests
```

If the existing project already has a test script, use its normal command instead.

## Notes

This module intentionally does not execute shell commands from the browser. It is a reference, generator, and workflow UI.
