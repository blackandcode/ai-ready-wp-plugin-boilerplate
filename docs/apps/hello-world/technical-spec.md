# HelloWorld App Technical Specification

This document details the software design, block attributes, Interactivity API client store, and backend greeting services for the HelloWorld App.

---

## 1. Backend Greeting Domain (`src/backend/Apps/HelloWorld/`)

### 1.1 `HelloWorldGreeting` Value Object

- Encapsulates greeting strings.
- Guarantees non-empty trimmed text.
- Fallback default: `'Hello from AI-Ready WP Plugin Boilerplate!'`.

### 1.2 `HelloWorldService` & DTO

- Produces formatted `HelloWorldDTO` carrying greeting message, timestamp, and environment metadata.
- Exposes `GET /ai-ready-wp/v1/hello` via `HelloWorldController` as a public smoke-testing endpoint.

---

## 2. Gutenberg Block Specification (`src/frontend/apps/hello-world/`)

### 2.1 Metadata (`block.json`)

```json
{
  "$schema": "https://schemas.wp.org/trunk/block.json",
  "apiVersion": 3,
  "name": "ai-ready-wp/hello-world",
  "version": "1.3.3",
  "title": "AI-Ready Hello World",
  "category": "widgets",
  "icon": "smiley",
  "supports": {
    "html": false,
    "interactivity": true
  },
  "attributes": {
    "message": {
      "type": "string",
      "default": "Hello, World!"
    },
    "showLikes": {
      "type": "boolean",
      "default": true
    },
    "initialLikes": {
      "type": "number",
      "default": 0
    }
  },
  "editorScript": "file:./index.js",
  "viewScriptModule": "file:./view.js",
  "style": "file:./style-index.css",
  "editorStyle": "file:./index.css"
}
```

### 2.2 Editor UI (`edit.tsx` & `Inspector.tsx`)

- Uses `@wordpress/block-editor` components (`useBlockProps`, `InspectorControls`).
- Inspector controls offer:
  - Text input for customizing the greeting message.
  - Toggle control for enabling/disabling the interactive like button.
  - Number control for setting initial like counter.

### 2.3 Frontend Save Directives (`save.tsx`)

Renders declarative Interactivity API directives:

```html
<div
  {...blockProps}
  data-wp-interactive="ai-ready-wp/hello-world"
  data-wp-context='{"likes": 0, "hasLiked": false}'
>
  <p class="greeting" data-wp-text="context.message"></p>
  <button
    type="button"
    class="like-btn"
    data-wp-on--click="actions.toggleLike"
  >
    <span data-wp-text="state.likeButtonLabel"></span>
  </button>
</div>
```

### 2.4 Interactivity API Client Store (`view.ts`)

Registers store actions and computed state using `store()` from `@wordpress/interactivity`:

```typescript
import { store, getContext } from '@wordpress/interactivity';

store('ai-ready-wp/hello-world', {
  state: {
    get likeButtonLabel() {
      const context = getContext();
      return context.hasLiked ? `Liked (${context.likes})` : `Like (${context.likes})`;
    },
  },
  actions: {
    toggleLike() {
      const context = getContext();
      if (context.hasLiked) {
        context.likes -= 1;
        context.hasLiked = false;
      } else {
        context.likes += 1;
        context.hasLiked = true;
      }
    },
  },
});
```
