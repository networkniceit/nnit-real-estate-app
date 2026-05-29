# NNIT Real Estate frontend

This project is a responsive React + Vite application for NNIT Real Estate. It includes a mobile-first property listing page, search input, and modern UI components.

## Run locally

1. Open a terminal in `C:\NNIT Real Estate app`
2. Run `npm install` in both the root and `frontend` folders if dependencies are missing
3. Start the backend API with `npm run backend`
4. In a second terminal, run `npm run dev` from `C:\NNIT Real Estate app\frontend`
5. Open the displayed local URL in the browser

## What was fixed

- Added missing `public/index.html`
- Replaced the Vite starter page with a custom NNIT Real Estate homepage
- Added responsive property cards and mobile-friendly layout
- Removed invalid nested CSS and replaced it with valid CSS
- Added property data and new UI components

## Structure

- `src/App.jsx` — main page layout and search state
- `src/components` — UI components for the hero block and property cards
- `src/data/properties.js` — sample property listing data
- `src/App.css` — page-specific styles
- `src/index.css` — global styles
