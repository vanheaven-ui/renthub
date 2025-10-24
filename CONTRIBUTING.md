# 🤝 Contributing to RentHub

Welcome to **RentHub** — a modern peer-to-peer rental app built with **Next.js**, **Supabase**, **TanStack Query**, **TailwindCSS**, and **Socket.io**.  
We are thrilled that you are interested in contributing! 💜

---

## 🧭 Code of Conduct

Be kind. Be constructive.  
Respect others’ time, effort, and perspectives.  
RentHub thrives on open collaboration — everyone’s voice matters.

---

## 🚀 Getting Started

### 1. Fork the Repository

Click the **Fork** button at the top of the page to create your own copy.

### 2. Clone Your Fork

```bash
git clone https://github.com/<your-username>/renthub.git
cd renthub
```

### 3. Install Dependencies

```bash
pnpm install
# or
npm install
```

### 4. Start the Development Server

```bash
npm run dev
```

Your app should now be running at http://localhost:3000
🎉

---

## 🧠 Branching Strategy

We follow a simplified **Git Flow** model to manage development and releases efficiently.

| Branch        | Purpose                                                                                 |
| :------------ | :-------------------------------------------------------------------------------------- |
| **`main`**    | Production-ready code; reflects the current live release.                               |
| **`develop`** | The latest stable branch for ongoing development. All feature branches merge into here. |
| `feature/*`   | Used for new features or substantial enhancements.                                      |
| `bugfix/*`    | Used for addressing bugs or issues identified in `develop`.                             |
| `hotfix/*`    | Used for urgent fixes required in the `main` (production) branch.                       |

### 👉 Example: Starting a new feature

When beginning work on a new feature, always branch off of `develop`:

```bash
git checkout develop
git pull origin develop
git checkout -b feature/add-ai-chat
```

## When done, push your branch and open a Pull Request (PR) to develop.

## 🧩 Pull Request Guidelines

To ensure smooth and efficient code review, please adhere to the following guidelines when submitting a Pull Request (PR):

- ✅ **Keep PRs small and focused.** A PR should ideally address only one feature or bug fix.
- ✅ Use **clear, descriptive commit messages** that explain _what_ and _why_ changes were made.
- ✅ **Run linting** before submitting your code:
  ```bash
  npm run lint
  ```
- ✅ **Ensure your code passes all tests.** If you are adding a new feature, include unit and/or integration tests.
- ✅ For any UI updates, **add screenshots or short video clips** to the PR description to show the changes in action.

---

## 🧪 Running Tests

We prioritize code reliability, so testing is a mandatory step before submission.

If tests are available for the package you are working on, run the following command:

```bash
npm test
```
Contribute new tests for new logic or bug fixes where applicable.
--- 

## Use Conventional Commits 📝(Optional but recommended)

We enforce the **Conventional Commits** specification for all commit messages. This standard provides clear rules for commit history, which is essential for automated changelog generation and semantic versioning.

### Format

The commit message must follow this structure:

```
<type>(scope): short description
```

- **`<type>`:** A required keyword (e.g., `feat`, `fix`, `chore`).
- **`(scope)`:** An optional detail describing _where_ the change was made (e.g., `auth`, `listings`, `socket`).
- **`short description`:** A concise summary of the change.

### Examples

| Type        | Example                                     | Description                              |
| :---------- | :------------------------------------------ | :--------------------------------------- |
| **`feat`**  | `feat(auth): add OTP verification flow`     | A new feature or enhancement.            |
| **`fix`**   | `fix(socket): handle user disconnect event` | A bug fix.                               |
| **`chore`** | `chore: update dependencies`                | Maintenance, build process changes, etc. |
| **`docs`**  | `docs: update CONTRIBUTING.md guidelines`   | Documentation only changes.              |
---

## 💬 Need Help?

If you get stuck or have any questions about contributing, don't worry! We are here to help.

* **Open a Discussion** on the repository page.
* Alternatively, open a new **[Issue](https://github.com/vanheaven-ui/renthub/issues)** and apply a relevant tag like `question`.

We are a friendly bunch, and we will guide you through the process. 😄
---

## 🪄 Contributors

Thanks to all the awesome contributors who make RentHub better every day! 🌟

<p align="center">
  <a href="../../graphs/contributors">
    <img src="https://contrib.rocks/image?repo=vanheaven-ui/renthub" alt="Contributors" />
  </a>
</p>