# Sample Viewer Worker

This package contains the Web Worker code for geometry generation in the sample viewer.

## Thread Boundary Enforcement

This package is **intentionally separate** to enforce thread boundaries between UI and Worker contexts.

### TypeScript Configuration

The `tsconfig.json` for this worker package uses:
```json
{
  "lib": ["ES2020", "WebWorker"]
}
```

This means:
- ✅ Worker APIs are available (`self`, `postMessage`, etc.)
- ❌ DOM APIs are **NOT** available (`document`, `window`, React, etc.)

### Compile-Time Safety

If you try to use DOM APIs in the worker, TypeScript will give you an error:

```typescript
// ❌ ERROR: Cannot find name 'document'
document.createElement('div');

// ❌ ERROR: Cannot find name 'window'
window.localStorage.setItem('key', 'value');

// ❌ ERROR: JSX not available in WebWorker context
const element = <div>Hello</div>;
```

### Why This Matters

Web Workers run in a completely separate thread from the UI:
- No shared memory (except through structured cloning or transferables)
- No access to DOM APIs
- No React/UI framework code
- Different global object (`self` instead of `window`)

By enforcing this at the package level with TypeScript, we prevent:
- Accidental imports of UI code into the worker
- Attempts to manipulate DOM from worker thread
- Singleton leakage between contexts
- Build errors that would only appear at runtime

### Development Workflow

1. Install dependencies:
   ```bash
   cd sample-viewer-worker
   npm install
   ```

2. Build the worker:
   ```bash
   npm run build
   ```

3. The main viewer imports the built worker as a module

This clear separation makes it obvious which code runs where!
