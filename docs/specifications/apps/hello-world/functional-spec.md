# HelloWorld Block Functional Specification

This document defines the functional requirements, user stories, Gutenberg editor behavior, and frontend interactivity for the HelloWorld block.

---

## 1. User Stories

1. **Insert Block:** As a content creator, I want to find and insert the "AI-Ready Hello World" block from the Gutenberg block inserter so that I can add greeting content to posts or pages.
2. **Customize in Editor:** As a content creator, I want to edit the greeting text directly on canvas or in the Inspector sidebar controls.
3. **Interactive Like Button:** As a site visitor, I want to click the "Like" button on the frontend to increment the counter immediately without reloading the page.
4. **Insert Pattern:** As a site designer, I want to insert the pre-designed "Interactive Showcase" block pattern to preview the block styled with responsive typography and layout.

---

## 2. Gutenberg Editor Experience

- **Block Inserter:** Located under the "Widgets" category with a smiley icon.
- **Canvas View:**
  - Displays greeting text.
  - Displays disabled preview of the interactive like button.
- **Inspector Sidebar Controls:**
  - **Greeting Settings Panel:** Text control for the greeting message.
  - **Interactivity Settings Panel:** Toggle control to show/hide the like button, number input for initial likes.

---

## 3. Frontend Interactivity Behavior

- **Zero Full-Page Reload:** Powered by the WordPress Interactivity API client store (`@wordpress/interactivity`).
- **Client-Side Toggle:**
  - First click: increments counter by 1, updates label to `"Liked (N)"`, applies active styling.
  - Second click: decrements counter by 1, reverts label to `"Like (N-1)"`, removes active styling.
- **Directives:** Declarative `data-wp-interactive`, `data-wp-context`, `data-wp-text`, `data-wp-on--click` attributes.
