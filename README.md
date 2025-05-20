# Fragments

A backend API server for managing content fragments.


## Installation

1. Clone the repository:
    ```bash
    git clone git@github.com:kjgamis/fragments.git
    cd fragments
    ```

2. Install dependencies:
    ```bash
    npm install
    ```

## Available Scripts

### Development

```bash
npm run dev
```

- Starts the server in development mode with hot reloading
- Uses nodemon for automatic server restart on file changes
- Sets `LOG_LEVEL` to debug for detailed logging
- Watches the `src` directory for changes

### Production

```bash
npm start
```

- Starts the server in production mode
- Runs the server directly with Node.js
- Uses the default logging level

### Debugging

```bash
npm run debug
```

- Starts the server in debug mode
- Enables Node.js inspector on port 9229
- Sets `LOG_LEVEL` to debug
- Allows remote debugging connections
- Hot reloading enabled

### Code Quality

```bash
npm run lint
```

- Runs ESLint to check code quality
- Checks all JavaScript files in the `src` directory
- Enforces coding standards and best practices

## Project Structure

```
fragments/
|── node_modules/
├── src/               # Source code
│   ├── server.js      # Main server
│   ├── app.js         # Express application
│   └── logger.js      # Pino logger config
├── .gitignore
├── .prettierrc
├── .prettierignore    # Prettier ignore rules
├── eslint.config.mjs  # ESLint config
├── package.json       # Project config and dependencies
└── README.md
```

## Author

Kage Gamis
