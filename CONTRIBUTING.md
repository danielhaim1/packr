# Contributing to Packr

Thanks for checking out **Packr**. Whether you're reporting a bug, suggesting an idea, or submitting code, contributions are always welcome.

## Code of Conduct

All contributors are expected to follow the [Code of Conduct](CODE_OF_CONDUCT.md). It’s there to keep things respectful and productive.

## How to Contribute

### 🐞 Found a Bug?

- First, check the [Issues](https://github.com/danielhaim1/packr/issues) tab to see if it's already been reported.
- If not, open a new issue with a short title and a clear description.
- Include things like your OS, Node.js version, and steps to reproduce it.

### 💡 Have a Feature Request?

- Look through open issues to avoid duplicates.
- If your idea isn’t there, create a new issue and tag it with `enhancement`.
- Explain what you’re proposing and why it would help.

### 📦 Submitting a Pull Request

1. Fork the repo  
2. Create a new branch:  
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Make your changes and test them:
   ```bash
   npm test
   ```
4. Commit clearly:
   ```bash
   git commit -m "Add [short description of change]"
   ```
5. Push your branch:
   ```bash
   git push origin feature/your-feature-name
   ```
6. Open a PR and fill out the template.

## Setting Up Locally

1. Clone the repo:
   ```bash
   git clone https://github.com/danielhaim1/packr.git
   cd packr
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build it:
   ```bash
   npm run build
   ```

4. Run the test suite:
   ```bash
   npm test
   ```

## Project Layout

- `src/` – Rust source code  
- `bin/` – CLI entry points and compiled binaries  
- `__tests__/` – Test files  
- `scripts/` – Build and helper scripts  

## Code Style

- Stick to the existing code style.
- Keep code readable and minimal.
- Tests should pass before you open a PR.
- Update docs if your change affects how things work.

## Release Scripts

Version bumps are handled through npm scripts:

- `npm run release:patch` → `1.0.0` → `1.0.1`  
- `npm run release:minor` → `1.0.0` → `1.1.0`  
- `npm run release:major` → `1.0.0` → `2.0.0`  

## Questions?

If something’s unclear, open an issue or start a discussion.

---

Appreciate your time and interest in improving **Packr**.