# 🤝 Contributing to The Veil Launcher

Thank you for your interest in contributing to The Veil Launcher! We're excited to have you join our community of developers working to make this project better. This guide will help you get started, whether you're a seasoned developer or just beginning your coding journey.

---

## 📋 Table of Contents

- [🌟 Welcome](#-welcome)
- [🚀 Getting Started](#-getting-started)
- [🏗️ Project Structure](#️-project-structure)
- [💻 Development Setup](#-development-setup)
- [🔄 Contribution Workflow](#-contribution-workflow)
- [📝 Coding Standards](#-coding-standards)
- [🧪 Testing](#-testing)
- [📖 Documentation](#-documentation)
- [🐛 Bug Reports](#-bug-reports)
- [💡 Feature Requests](#-feature-requests)
- [🔒 Security](#-security)
- [❓ Getting Help](#-getting-help)

---

## 🌟 Welcome

We believe that **everyone can contribute**, regardless of experience level! Whether you're:

- 🆕 **New to programming** - We welcome documentation improvements, bug reports, and simple fixes
- 🎓 **Learning developer** - Perfect opportunity to work on a real project with mentorship
- 🏆 **Experienced developer** - Help us architect better solutions and optimize performance
- 🎨 **Designer** - Improve our UI/UX and create better user experiences
- 📝 **Writer** - Help us improve documentation and user guides

**Your contribution matters!** 🎉

---

## 🚀 Getting Started

### 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Git** ([Download](https://git-scm.com/))
- **Code Editor** (We recommend [VS Code](https://code.visualstudio.com/))
- **Java 17+** (for testing game launches)

### 🔧 Quick Setup

```bash
# 1. Fork the repository on GitHub
# Click the "Fork" button on https://github.com/TheVeilMC/LauncherApp

# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/LauncherApp.git
cd LauncherApp

# 3. Add upstream remote
git remote add upstream https://github.com/TheVeilMC/LauncherApp.git

# 4. Install dependencies
npm install

# Build for dist
npm run build:dev

# 5. Start development environment
npm run start
```

### ✅ Verify Setup

After running `npm run start`, you should see:

- Electron window opens with the launcher
- No console errors in the terminal

---

## 🏗️ Project Structure

Understanding the codebase structure is crucial for effective contributions:

```
LauncherApp/
├── 📁 main/                    # Electron main process
│   ├── 📁 core/               # Core application logic
│   ├── 📁 managers/           # Game, mod, and system managers
│   ├── 📁 services/           # Business logic services
│   ├── 📁 utils/              # Utility functions
│   └── 📁 ipc/                # Inter-process communication
├── 📁 renderer/               # Frontend Vue.js application
│   ├── 📁 src/
│   │   ├── 📁 components/     # Reusable Vue components
│   │   ├── 📁 views/          # Page-level components
│   │   ├── 📁 stores/         # Pinia state management
│   │   ├── 📁 services/       # API and external services
│   │   └── 📁 assets/         # Static assets
├── 📁 preload/                # Electron preload scripts
├── 📁 shared/                 # Shared types and utilities
├── 📁 build/                  # Build configuration
└── 📁 docs/                   # Documentation
```

### 🧩 Key Components

#### Main Process (`main/`)

- **Core**: Application initialization and lifecycle
- **Managers**: Handle specific domains (mods, instances, assets)
- **Services**: Business logic (Java detection, launching, installation)
- **IPC**: Communication bridge with renderer

#### Renderer (`renderer/`)

- **Components**: Reusable UI components
- **Views**: Full page components
- **Stores**: State management with Pinia
- **Services**: API clients and external integrations

#### Shared (`shared/`)

- **Types**: TypeScript interfaces and types
- **Constants**: Application-wide constants
- **Utils**: Shared utility functions

---

## 💻 Development Setup

### 🔧 Development Commands

```bash
# Start development (both main and renderer)
npm run start

# Build for production
npm run build

# Run tests
npm run test

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Type checking
npm run type-check
```

### 🛠️ IDE Setup

#### VS Code Extensions (Recommended)

```json
{
  "recommendations": [
    "vue.volar",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

#### Settings

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

---

## 🔄 Contribution Workflow

### 🌿 Branch Strategy

We use a **Git Flow** inspired branching model:

- `release` - Production-ready code
- `dev` - Development integration branch
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Critical production fixes

### 📝 Step-by-Step Process

#### 1. 🍴 Fork & Clone

```bash
# Fork on GitHub, then clone
git clone https://github.com/YOUR_USERNAME/LauncherApp.git
cd LauncherApp
git remote add upstream https://github.com/TheVeilMC/LauncherApp.git
```

#### 2. 🌿 Create Feature Branch

```bash
# Always branch from 'dev'
git checkout dev
git pull upstream dev
git checkout -b feature/your-feature-name

# Examples:
# feature/skin-3d-preview
# feature/server-browser
# bugfix/memory-leak-fix
# improvement/ui-animations
```

#### 3. 💻 Develop

- Make your changes
- Follow our [coding standards](#-coding-standards)
- Test your changes thoroughly
- Commit frequently with clear messages

#### 4. 🧪 Test

```bash
# Run all tests
npm run test

# Test the built application
npm run build
npm run start
```

#### 5. 📝 Commit

```bash
# Use conventional commits
git add .
git commit -m "feat: add 3D skin preview component"

# Commit message format:
# type(scope): description
#
# Types: feat, fix, docs, style, refactor, test, chore
# Examples:
# feat: add new feature
# fix: resolve bug in launcher
# docs: update README
# style: format code
# refactor: improve code structure
# test: add unit tests
# chore: update dependencies
```

#### 6. 🚀 Push & PR

```bash
# Push to your fork
git push origin feature/your-feature-name

# Create Pull Request on GitHub
# Target: dev branch (NOT release!)
# Fill out the PR template
```

### ⚠️ Important Rules

- ✅ **Always target `dev` branch** for PRs
- ❌ **Never create PRs to `release`** - they will be closed
- ✅ **Keep PRs focused** - one feature/fix per PR
- ✅ **Update documentation** if needed
- ✅ **Test your changes** before submitting

---

## 📝 Coding Standards

### 🎨 Code Style

We use **ESLint** and **Prettier** for consistent code formatting:

```bash
# Check linting
npm run lint

# Auto-fix issues
npm run lint:fix
```

### 📏 General Guidelines

#### TypeScript

```typescript
// ✅ Good: Use explicit types
interface UserProfile {
  username: string;
  uuid: string;
  accessToken: string;
}

// ❌ Avoid: Using 'any'
const userData: any = response.data;

// ✅ Good: Proper error handling
try {
  const result = await apiCall();
  return result;
} catch (error: any) {
  logger.error('API call failed:', error);
  throw new Error(`Failed to fetch data: ${error.message}`);
}
```

#### Vue Components

```vue
<!-- ✅ Good: Clear component structure -->
<template>
  <div class="component-wrapper">
    <h2 class="component-title">{{ title }}</h2>
    <slot />
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string;
  optional?: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  click: [id: string];
}>();
</script>
```

#### File Organization

```typescript
// ✅ Good: Organized imports
// External libraries
import { ref, computed } from 'vue';
import axios from 'axios';

// Internal modules
import { useAuthStore } from '@/stores/auth';
import { ApiResponse } from '@/types';

// Local components
import Button from './Button.vue';
```

### 🏗️ Architecture Patterns

#### State Management

```typescript
// ✅ Good: Pinia store structure
export const useFeatureStore = defineStore('feature', () => {
  // State
  const items = ref<Item[]>([]);
  const isLoading = ref(false);

  // Getters
  const activeItems = computed(() => items.value.filter((item) => item.active));

  // Actions
  async function loadItems() {
    try {
      isLoading.value = true;
      const response = await api.getItems();
      items.value = response.data;
    } catch (error) {
      // Handle error
    } finally {
      isLoading.value = false;
    }
  }

  return {
    items,
    isLoading,
    activeItems,
    loadItems,
  };
});
```

#### Error Handling

```typescript
// ✅ Good: Comprehensive error handling
async function launchGame(options: LaunchOptions) {
  try {
    validateLaunchOptions(options);

    const result = await gameService.launch(options);

    notificationStore.addNotification({
      type: 'success',
      title: 'Game Launched',
      message: 'The Veil is starting up...',
    });

    return result;
  } catch (error: any) {
    logger.error('Game launch failed:', error);

    notificationStore.addNotification({
      type: 'error',
      title: 'Launch Failed',
      message: error.message || 'Failed to launch game',
    });

    throw error;
  }
}
```

---

## 🧪 Testing

### 🔍 Testing Strategy

We use a multi-layered testing approach:

1. **Unit Tests** - Individual functions and components
2. **Integration Tests** - Component interactions
3. **E2E Tests** - Full user workflows
4. **Manual Testing** - Real-world usage scenarios

### 🧪 Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm run test -- --testNamePattern="LaunchService"
```

### ✍️ Writing Tests

#### Component Tests

```typescript
// Example: Button component test
import { mount } from '@vue/test-utils';
import Button from '@/components/ui/Button.vue';

describe('Button Component', () => {
  it('renders correctly with props', () => {
    const wrapper = mount(Button, {
      props: {
        variant: 'primary',
        disabled: false,
      },
      slots: {
        default: 'Click me',
      },
    });

    expect(wrapper.text()).toBe('Click me');
    expect(wrapper.classes()).toContain('btn-primary');
  });

  it('emits click event', async () => {
    const wrapper = mount(Button);
    await wrapper.trigger('click');

    expect(wrapper.emitted('click')).toBeTruthy();
  });
});
```

#### Service Tests

```typescript
// Example: API service test
import { apiService } from '@/services/api';
import { vi } from 'vitest';

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles successful authentication', async () => {
    const mockResponse = {
      success: true,
      data: { token: 'mock-token' },
    };

    vi.spyOn(apiService, 'authenticate').mockResolvedValue(mockResponse);

    const result = await apiService.authenticate('user', 'pass');

    expect(result.success).toBe(true);
    expect(result.data.token).toBe('mock-token');
  });
});
```

---

## 📖 Documentation

### 📚 Types of Documentation

1. **Code Comments** - Explain complex logic
2. **README Updates** - Keep installation/usage current
3. **API Documentation** - Document public interfaces
4. **Architecture Docs** - Explain design decisions

### ✍️ Documentation Standards

#### Code Comments

````typescript
/**
 * Launches the Minecraft game with specified configuration
 *
 * @param manifest - Game configuration manifest
 * @param account - User account information
 * @returns Promise resolving to launch result
 *
 * @throws {Error} When Java is not found
 * @throws {Error} When game files are corrupted
 *
 * @example
 * ```typescript
 * const result = await launchGame(manifest, account);
 * console.log(`Game launched with PID: ${result.processId}`);
 * ```
 */
async function launchGame(
  manifest: Manifest,
  account: UserAccount
): Promise<LaunchResult> {
  // Implementation...
}
````

#### README Sections

When updating documentation, ensure:

- Clear, concise language
- Step-by-step instructions
- Code examples where helpful
- Screenshots for UI changes
- Updated version numbers

---

## 🐛 Bug Reports

### 📝 Before Reporting

1. **Search existing issues** - Your bug might already be reported
2. **Try latest version** - Bug might be already fixed
3. **Reproduce consistently** - Ensure it's not a one-time issue
4. **Gather information** - Logs, system info, steps to reproduce

### 🎯 Good Bug Report Template

```markdown
## 🐛 Bug Description

A clear and concise description of what the bug is.

## 🔄 Steps to Reproduce

1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## ✅ Expected Behavior

A clear description of what you expected to happen.

## 📱 System Information

- OS: [e.g. Windows 11, macOS 13.0, Ubuntu 22.04]
- Launcher Version: [e.g. 1.0.0]
- Java Version: [e.g. 17.0.2]
- Memory: [e.g. 16GB]

## 📋 Additional Context

- Error messages (if any)
- Screenshots
- Log files
- Any other relevant information

## 🔍 Possible Solution

If you have ideas on how to fix it, please share!
```

---

## 💡 Feature Requests

### 🌟 Suggesting Features

We love new ideas! When suggesting features:

1. **Check existing requests** - Avoid duplicates
2. **Explain the problem** - What need does this address?
3. **Describe the solution** - How should it work?
4. **Consider alternatives** - Are there other approaches?
5. **Think about impact** - Who benefits and how?

### 📋 Feature Request Template

```markdown
## 🚀 Feature Request

### 🎯 Problem Statement

A clear description of the problem this feature would solve.

### 💡 Proposed Solution

A detailed description of what you want to happen.

### 🔄 Alternative Solutions

Other approaches you've considered.

### 📊 Additional Context

- Who would benefit from this feature?
- How important is this feature (1-10)?
- Any mockups, examples, or references?

### 🛠️ Implementation Ideas

If you have technical ideas on how to implement this, share them!
```

---

## 🔒 Security

### 🛡️ Security First

Security is paramount in a launcher application. When contributing:

- **Never commit secrets** - API keys, tokens, passwords
- **Validate all inputs** - Especially file paths and URLs
- **Use secure defaults** - Fail securely when possible
- **Follow OWASP guidelines** - Web and desktop security best practices

### 🚨 Reporting Security Issues

**DO NOT** open public issues for security vulnerabilities!

Instead:

1. Email us at [matrix@ogmatrix.net](mailto:matrix@ogmatrix.net)
2. Include detailed description and reproduction steps
3. We'll respond within 48 hours
4. We'll work together on a fix before public disclosure

### 🔐 Security Checklist

When reviewing code, check for:

- [ ] Input validation and sanitization
- [ ] Proper error handling (no sensitive data in errors)
- [ ] Secure file operations (no path traversal)
- [ ] Safe URL handling (no SSRF vulnerabilities)
- [ ] Proper authentication checks
- [ ] Secure IPC communication
- [ ] No hardcoded secrets

---

## ❓ Getting Help

### 💬 Communication Channels

- **💬 Discord**: [Join our community](https://discord.gg/HpEhWuzyDH) - Best for quick questions
- **🐛 GitHub Issues**: For bugs and feature requests
- **💡 GitHub Discussions**: For general questions and ideas
- **📧 Email**: [matrix@ogmatrix.net](mailto:matrix@ogmatrix.net) - For private matters

### 🤝 Mentorship

New to open source? We're here to help!

- **Pair Programming**: Available for complex features
- **Code Reviews**: Detailed feedback on your contributions
- **Learning Resources**: We can recommend tutorials and guides
- **Career Advice**: Happy to share our experiences

### 📚 Learning Resources

#### Electron Development

- [Electron Documentation](https://www.electronjs.org/docs)
- [Electron Security Best Practices](https://www.electronjs.org/docs/tutorial/security)

#### Vue.js

- [Vue 3 Documentation](https://vuejs.org/)
- [Vue 3 Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)

#### TypeScript

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [TypeScript Best Practices](https://typescript-eslint.io/rules/)

---

## 🎉 Recognition

### 🏆 Contributors

All contributors are recognized in:

- **README.md** - Listed in contributors section
- **CHANGELOG.md** - Credited for their contributions
- **Discord** - Special contributor role
- **Releases** - Mentioned in release notes

### 🎁 Rewards

While we can't offer monetary rewards, we provide:

- **Mentorship** - Learn from experienced developers
- **Portfolio Projects** - Real-world experience for your resume
- **Community Recognition** - Build your reputation in the community
- **Early Access** - Test new features before release
- **Swag** - Stickers and merchandise (when available)

---

## 📋 Contribution Types

### 🔧 Code Contributions

- **New Features** - Implement planned features
- **Bug Fixes** - Resolve reported issues
- **Performance** - Optimize existing code
- **Refactoring** - Improve code structure
- **Security** - Enhance application security

### 📖 Non-Code Contributions

- **Documentation** - Improve guides and docs
- **Translation** - Localize the application
- **Design** - Create UI/UX improvements
- **Testing** - Manual testing and QA
- **Community** - Help other users and contributors

### 🎨 Design Contributions

- **UI Components** - Design new interface elements
- **Icons & Graphics** - Create visual assets
- **User Experience** - Improve application flow
- **Accessibility** - Make the app more inclusive

---

## 🚀 Advanced Topics

### 🏗️ Architecture Decisions

When making significant changes:

1. **Discuss first** - Open an issue or discussion
2. **Consider impact** - How does this affect existing code?
3. **Document decisions** - Update architecture docs
4. **Plan migration** - How will existing users upgrade?

### 🔄 Release Process

Understanding our release process helps you contribute effectively:

1. **Development** - Features merged to `dev`
2. **Testing** - QA testing on `dev` branch
3. **Release Candidate** - Create RC from `dev`
4. **Production** - Merge to `release` after testing
5. **Distribution** - Automated builds and deployment

### 📊 Performance Considerations

When contributing performance-sensitive code:

- **Profile first** - Measure before optimizing
- **Consider memory usage** - Electron apps can be memory-hungry
- **Optimize startup time** - Users want fast launches
- **Background processing** - Don't block the UI thread

---

## 🎯 Conclusion

Thank you for taking the time to read this guide! Contributing to open source can be intimidating at first, but it's one of the most rewarding ways to learn and grow as a developer.

**Remember:**

- 🤝 **Be respectful** - We're all learning together
- 💡 **Ask questions** - No question is too simple
- 🎯 **Start small** - Small contributions are just as valuable
- 🚀 **Have fun** - Enjoy the process of building something cool!

We can't wait to see what you'll contribute to The Veil Launcher. Welcome to the team! 🎉

---

<div align="center">
  <sub>Happy coding! 🚀</sub>
</div>
