# 🎮 The Veil Launcher

<div align="center">
  <img src="assets/logo-win.png" alt="The Veil Launcher Logo" width="128" height="128">
  
  **A custom Minecraft launcher for The Veil horror gamemode**
  
  [![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/TheVeilMC/LauncherApp/releases)
  [![License](https://img.shields.io/badge/license-GPL--3.0-green.svg)](LICENSE)
  [![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)](#installation)
  [![Minecraft](https://img.shields.io/badge/minecraft-1.20.1-brightgreen.svg)](#features)
  [![Fabric](https://img.shields.io/badge/fabric-0.16.14-orange.svg)](#features)
</div>

---

## ⚠️ Important Disclaimers

> **🚨 SECURITY NOTICE**: This application is currently **NOT CODE-SIGNED**. Windows Defender and other antivirus software may show warnings when downloading or running the launcher. This is normal behavior for unsigned applications. You may need to temporarily disable real-time protection or add an exception to install and run the launcher.
>
> We plan to implement code signing in the future when we have a larger user base, as it requires significant monthly costs (~$200/month).

> **🔧 DEVELOPMENT STATUS**:
>
> - I am **not a professional developer** - this is a learning project!
> - This project is **not finished** and contains mock data and placeholder functionality
> - Some code may be **insecure** or follow non-standard practices
> - Currently **only supports Minecraft 1.20.1 with Fabric** (No TheVeil mod included, because still in Development)
> - Many features are still in development

---

## 🌟 About The Project

The Veil Launcher is a custom Minecraft launcher specifically designed for **The Veil** - an immersive horror gamemode that pushes the boundaries of what's possible in Minecraft. This launcher provides seamless integration with our custom server infrastructure, automatic mod management, and an enhanced user experience tailored for horror gameplay.

### 🎯 What Makes It Special

- **🔐 Secure Authentication**: Microsoft account integration with OAuth2
- **📦 Automatic Mod Management**: Seamless installation and updates for The Veil modpack
- **🚀 One-Click Launch**: Simplified game launching with optimized settings
- **🌐 Server Integration**: Direct connection to The Veil official servers
- **🎨 Modern UI**: Beautiful, responsive interface built with Vue 3 and Electron
- **📊 Real-time Monitoring**: Live game performance and memory usage tracking
- **🔄 Auto-Updates**: Automatic launcher and mod updates
- **🎭 Skin Management**: Advanced Minecraft skin management with 3D preview

---

## 🚀 Features

### ✅ Currently Working

- ✅ Microsoft Authentication (OAuth2)
- ✅ Minecraft 1.20.1 + Fabric 0.16.14 launching
- ✅ Automatic mod installation and verification
- ✅ Real-time launch progress tracking
- ✅ Memory usage monitoring
- ✅ Game file verification
- ✅ Auto-updater system
- ✅ Modern, responsive UI
- ✅ Cross-platform support (Windows, macOS, Linux)

### 🚧 In Development

- 🚧 Advanced skin management with 3D preview
- 🚧 Server browser and status
- 🚧 Achievement system
- 🚧 Community features
- 🚧 Performance optimization tools
- 🚧 Plugin system for extensibility

### 📋 Planned Features

- 📋 Custom resource pack management
- 📋 Voice chat integration
- 📋 Streaming tools integration
- 📋 Advanced graphics settings
- 📋 Mod conflict resolution

---

## 🛠️ Technology Stack

<div align="center">

| Frontend     | Backend    | Desktop     | Build Tools      |
| ------------ | ---------- | ----------- | ---------------- |
| Vue 3        | TypeScript | Electron 28 | Vite             |
| TypeScript   | Express    | Native APIs | TypeScript       |
| Tailwind CSS | WebSocket  | IPC         | ESLint           |
| Pinia        | Axios      | File System | Electron Builder |

</div>

### 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Renderer      │    │   Main Process  │    │   Preload       │
│   (Vue 3 App)   │◄──►│   (Electron)    │◄──►│   (Bridge)      │
│                 │    │                 │    │                 │
│ • UI Components │    │ • Game Launcher │    │ • IPC Bridge    │
│ • State Mgmt    │    │ • File Manager  │    │ • Security      │
│ • API Client    │    │ • Auto Updater  │    │ • Context Iso   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   External APIs │
                    │                 │
                    │ • Mojang API    │
                    │ • Microsoft     │
                    │ • The Veil API  │
                    └─────────────────┘
```

---

## 📥 Installation

### 📋 System Requirements

- **OS**: Windows 10/11, macOS 10.15+, or Linux (Ubuntu 18.04+)
- **RAM**: 8GB minimum (16GB recommended)
- **Storage**: 5GB free space
- **Java**: 17+ (automatically detected/installed)
- **Internet**: Required for initial setup and updates

### 🔽 Download & Install

1. **Download** the latest release from [Releases](https://github.com/TheVeilMC/LauncherApp/releases)
2. **Extract** the archive to your desired location
3. **Run** the launcher executable:
   - Windows: `VeilLauncher.exe`
   - macOS: `VeilLauncher.app`
   - Linux: `VeilLauncher.AppImage`

> **⚠️ Windows Users**: You may see a "Windows protected your PC" warning. Click "More info" → "Run anyway" to proceed.

### 🔧 First-Time Setup

1. **Launch** the application
2. **Sign in** with your Microsoft account
3. **Wait** for automatic mod installation
4. **Launch** The Veil and enjoy!

---

## 🎮 Usage

### 🚀 Launching The Game

1. Open The Veil Launcher
2. Ensure you're signed in with your Microsoft account
3. Click the large "Launch The Veil" button
4. Wait for the game to start (first launch may take longer)

### ⚙️ Settings & Configuration

- **Memory Allocation**: Adjust in Settings → Game → Default Memory
- **Java Path**: Auto-detected or manually set in Settings → Game
- **Game Directory**: Customize installation location
- **Auto-Updates**: Enable/disable automatic updates

### 🔧 Troubleshooting

- **Game won't launch**: Try "Verify Game Files" in Settings
- **Authentication issues**: Sign out and sign back in
- **Performance issues**: Increase memory allocation in settings
- **Mod conflicts**: Use the built-in verification system

---

## 🤝 Contributing

We **actively encourage contributions** from the community! Whether you're fixing bugs, adding features, improving documentation, or enhancing security - all contributions are welcome and appreciated.

> **📚 New to contributing?** Check out our detailed [CONTRIBUTING.md](CONTRIBUTING.md) guide!

### 🎯 How You Can Help

- 🐛 **Report Bugs**: Found an issue? [Open an issue](https://github.com/TheVeilMC/LauncherApp/issues)
- 💡 **Suggest Features**: Have ideas? We'd love to hear them!
- 🔧 **Fix Issues**: Browse open issues and submit PRs
- 📖 **Improve Docs**: Help make our documentation better
- 🔒 **Security**: Help us identify and fix security vulnerabilities
- 🎨 **UI/UX**: Improve the user interface and experience

### 🚀 Quick Start for Contributors

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR_USERNAME/LauncherApp.git
cd LauncherApp

# Install dependencies
npm install

# Build for dist
npm run build:dev

# Start development
npm run start

# Create a feature branch
git checkout -b feature/your-amazing-feature

# Make your changes and commit
git commit -m "feat: add amazing new feature"

# Push and create a Pull Request to the 'dev' branch
git push origin feature/your-amazing-feature
```

---

## 🐛 Bug Reports & Issues

We want to fix bugs as quickly as possible! If you encounter any issues:

1. **Check** if the issue already exists in [Issues](https://github.com/TheVeilMC/LauncherApp/issues)
2. **Create** a new issue with:
   - Clear description of the problem
   - Steps to reproduce
   - Your system information
   - Screenshots/logs if applicable
3. **Be patient** - we'll respond as soon as possible!

### 📝 Issue Template

```
**Bug Description:**
A clear description of what the bug is.

**To Reproduce:**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior:**
What you expected to happen.

**System Info:**
- OS: [e.g. Windows 11]
- Launcher Version: [e.g. 1.0.0]
- Java Version: [e.g. 17.0.2]

**Additional Context:**
Any other context about the problem.
```

---

## 📄 License & Usage

This project is licensed under the **GNU General Public License v3.0**.

### 🔑 Key Points:

- ✅ **Use freely** for personal and commercial purposes
- ✅ **Modify** and distribute under the same license
- ✅ **Study** the code and learn from it
- ❌ **Don't copy one-to-one** - add your own improvements!
- 📝 **Include license** in any distributions
- 🔗 **Link back** to this project if you create derivatives

> **💡 Important**: If you create your own launcher based on this code, please make it unique! Add your own features, improve the design, and make it your own. We'd love to see what you create - feel free to reach out and show us your work!

---

## 🌟 Community Projects

We love seeing what the community creates! Here are some amazing projects inspired by or based on The Veil Launcher:

> _No community projects yet - be the first to create one!_

**Created something cool?** [Let us know](https://github.com/TheVeilMC/LauncherApp/discussions) and we'll feature it here!

---

## 🙏 Acknowledgments

- **Mojang Studios** - For creating Minecraft
- **Fabric Team** - For the amazing modding framework
- **Electron Team** - For making cross-platform desktop apps possible
- **Vue.js Team** - For the incredible frontend framework
- **Our Community** - For testing, feedback, and contributions

---

## 📞 Support & Community

- 💬 **Discord**: [Join our community](https://discord.gg/HpEhWuzyDH)
- 🐛 **Issues**: [GitHub Issues](https://github.com/TheVeilMC/LauncherApp/issues)
- 💡 **Discussions**: [GitHub Discussions](https://github.com/TheVeilMC/LauncherApp/discussions)
- 📧 **Email**: [matrix@ogmatrix.net](mailto:matrix@ogmatrix.net)

---

## 🎉 Final Words

This project started as a fun learning experience and has grown into something we're genuinely proud of. While it's not perfect (and we know it!), we hope it brings joy to The Veil community and serves as a learning resource for other developers.

**Thank you for checking out The Veil Launcher!** We hope you enjoy using it as much as we enjoyed building it. Happy gaming, and may you survive the horrors that await in The Veil! 👻

---

<div align="center">
  <sub>Built with ❤️ by the OGMatrix team and amazing contributors</sub>
</div>
