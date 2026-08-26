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
- `server/data/` - Local NeDB database files, tracked for inspection and backup

The database files use one JSON record per line. When records change, commit the
updated files in `server/data/` to keep the local data snapshot available for
future review.
