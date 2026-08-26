# BSOMS

Bakery Shop Owner Management System.

## Development

```sh
npm install
npm run dev
```

The Vite client runs on its default port and the Express API runs on port 5000.

## Production build

```sh
npm run build
npm start
```

The Express server serves the built client from `dist/` and exposes the API under `/api`.

## Structure

- `client/` - React application and Vite configuration
- `server/` - Express API and local persistence setup
- `legacy/` - Original standalone HTML client kept for reference
- `dist/` - Generated production build, ignored by Git
- `data/` - Runtime local database files, ignored by Git
