# Contributing to Fortress Command

Thank you for your interest in contributing to **Fortress Command**! We welcome bug reports, feature proposals, documentation improvements, and pull requests from security researchers and developers worldwide.

---

## Code of Conduct

All contributors and maintainers are expected to adhere to our [Code of Conduct](CODE_OF_CONDUCT.md). Please treat all participants with respect, professionalism, and constructive feedback.

---

## Ethical Boundaries & Authorized Use

Fortress Command is strictly intended for educational, defensive, and authorized penetration testing operations. Contributions that implement destructive exploits, unsolicited malware distribution backends, or credential theft infrastructure without educational simulation boundaries will be rejected immediately.

---

## Getting Started

### 1. Fork and Clone
```bash
git clone https://github.com/<your-username>/fortress-command.git
cd fortress-command
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment
Copy the example environment configuration:
```bash
cp .env.example .env
```
Ensure your Gemini API key is configured in `.env`.

### 4. Run the Development Server
```bash
npm run dev
```

---

## Development Workflow

1. **Create a Feature Branch**:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bugfix-name
   ```

2. **Coding Standards**:
   - Write clean, modular TypeScript with strict type safety.
   - Use Tailwind CSS utility classes; avoid inline styles.
   - Adhere to the established cyber-terminal bento visual hierarchy.
   - Ensure all Gemini API operations support automatic fallback via `safeGenerateContent` and `safeGenerateContentStream`.
   - Never expose API keys or secrets in client-side code.

3. **Verify Your Code**:
   Run the TypeScript linter:
   ```bash
   npm run lint
   ```
   Verify production build:
   ```bash
   npm run build
   ```

---

## Submitting Pull Requests

1. **Commit Messages**:
   Follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat(sigint): add waterfall FFT frequency resolution control`
   - `fix(vault): handle undefined timestamp during loot export`
   - `docs(readme): expand hardware SDR setup instructions`

2. **Open a Pull Request**:
   - Provide a clear, detailed summary of the problem and proposed solution.
   - Reference any related open issue numbers (e.g. `Fixes #42`).
   - Include screenshots or terminal output for UI changes.
   - Ensure all CI checks and linter checks pass.

---

## Reporting Issues

- **Bug Reports**: Use the [Bug Report Template](.github/ISSUE_TEMPLATE/bug_report.md). Include reproduction steps, environment details, and relevant console logs.
- **Feature Requests**: Use the [Feature Request Template](.github/ISSUE_TEMPLATE/feature_request.md). Explain the operational use case and technical architecture.
- **Security Vulnerabilities**: Do **not** open public GitHub issues for security vulnerabilities. Review our [Security Policy](SECURITY.md) for responsible disclosure.
