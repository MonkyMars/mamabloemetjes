# Mamabloemetjes

The monorepo for the Mamabloemetjes project, which includes the frontend built in Next.js and backend built in Rust with Cargo.

## Running the project
1. Clone the repository:
   ```bash
   git clone github.com/MonkyMars/mamabloemetjes.git
   cd mamabloemetjes
   ```

2. Install the dependencies:
   ```bash
   bun i
    ```

3. Start the development servers:

For only the frontend
```bash
    bun run dev # Run this within apps/frontend
```

For only the backend
```bash
    cargo run # Run this within apps/backend
```

For both frontend and backend
```bash
    bun run repo # Run this within apps/frontend
```
