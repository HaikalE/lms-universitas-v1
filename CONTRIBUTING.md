# Contributing to LMS Universitas v1.0

Terima kasih atas minat Anda untuk berkontribusi pada LMS Universitas! Kami menyambut kontribusi dari komunitas untuk membuat platform ini semakin baik.

## 🤝 Cara Berkontribusi

### 1. Fork Repository

```bash
# Fork repository melalui GitHub UI, kemudian clone
git clone https://github.com/YOUR-USERNAME/lms-universitas-v1.git
cd lms-universitas-v1

# Tambahkan upstream remote
git remote add upstream https://github.com/HaikalE/lms-universitas-v1.git
```

### 2. Setup Development Environment

```bash
# Jalankan setup script
./scripts/setup.sh

# Atau setup manual
cd backend && npm install
cd ../frontend && npm install
```

### 3. Buat Branch untuk Feature/Fix

```bash
# Update main branch
git checkout main
git pull upstream main

# Buat branch baru
git checkout -b feature/nama-fitur
# atau
git checkout -b fix/nama-bug
```

### 4. Development Guidelines

#### Backend (NestJS)

- **Code Style**: Gunakan Prettier dan ESLint
- **Testing**: Tulis unit tests untuk semua service methods
- **Documentation**: Dokumentasikan API endpoints
- **Error Handling**: Gunakan appropriate HTTP status codes
- **Security**: Implement proper authorization checks

```bash
# Format code
npm run format

# Lint code
npm run lint

# Run tests
npm test

# Run e2e tests
npm run test:e2e
```

#### Frontend (React + TypeScript)

- **Code Style**: Gunakan Prettier dan ESLint
- **TypeScript**: Gunakan proper typing
- **Components**: Buat reusable components
- **State Management**: Gunakan React Query untuk server state
- **Testing**: Tulis tests untuk components

```bash
# Format code
npm run format

# Lint code
npm run lint

# Run tests
npm test

# Type checking
npm run type-check
```

### 5. Commit Guidelines

Gunakan format commit yang jelas dan deskriptif:

```bash
# Format: type(scope): description

# Examples:
feat(auth): add two-factor authentication
fix(courses): resolve material upload issue
docs(api): update authentication endpoints
test(users): add unit tests for user service
refactor(database): optimize query performance
style(frontend): update button components styling
```

**Commit Types:**
- `feat`: Feature baru
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements
- `ci`: CI/CD changes

### 6. Testing Requirements

#### Backend Testing

```bash
# Unit tests
npm test

# Integration tests
npm run test:e2e

# Coverage report
npm run test:cov
```

**Test Requirements:**
- Unit tests untuk semua service methods
- Integration tests untuk API endpoints
- Minimum 80% code coverage
- Mock external dependencies

#### Frontend Testing

```bash
# Component tests
npm test

# Coverage report
npm run test:coverage
```

**Test Requirements:**
- Component rendering tests
- User interaction tests
- API integration tests
- Accessibility tests

### 7. Pull Request Process

#### Sebelum Submit PR

- [ ] Code telah diformat dengan Prettier
- [ ] Linting checks pass
- [ ] All tests pass
- [ ] Documentation updated jika diperlukan
- [ ] No breaking changes (atau dijelaskan dengan baik)

#### PR Description Template

```markdown
## Description
Jelaskan perubahan yang dibuat dan mengapa.

## Type of Change
- [ ] Bug fix (non-breaking change yang memperbaiki issue)
- [ ] New feature (non-breaking change yang menambah functionality)
- [ ] Breaking change (fix atau feature yang menyebabkan existing functionality tidak bekerja)
- [ ] Documentation update

## How Has This Been Tested?
Jelaskan testing yang telah dilakukan.

## Screenshots (jika applicable)
Tambahkan screenshots untuk perubahan UI.

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Code commented (terutama di area yang kompleks)
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] All tests pass
```

### 8. Code Review Process

#### Review Guidelines

- **Functionality**: Apakah code berfungsi dengan benar?
- **Performance**: Apakah ada optimasi yang bisa dilakukan?
- **Security**: Apakah ada vulnerability?
- **Maintainability**: Apakah code mudah dibaca dan dipelihara?
- **Testing**: Apakah test coverage adequate?

#### Reviewer Responsibilities

- Review dalam 24-48 jam
- Berikan feedback yang konstruktif
- Approve jika memenuhi standards
- Request changes jika diperlukan perbaikan

## 🐛 Bug Reports

### Before Reporting

1. Check existing issues
2. Try latest version
3. Check documentation
4. Test in clean environment

### Bug Report Template

```markdown
**Bug Description**
Deskripsi singkat dan jelas tentang bug.

**To Reproduce**
Steps untuk reproduce behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected Behavior**
Deskripsi tentang apa yang seharusnya terjadi.

**Screenshots**
Tambahkan screenshots jika membantu menjelaskan problem.

**Environment:**
 - OS: [e.g. Ubuntu 20.04]
 - Browser: [e.g. Chrome 91.0]
 - Node.js: [e.g. 18.17.0]
 - Database: [e.g. PostgreSQL 14.2]

**Additional Context**
Informasi tambahan tentang problem.
```

## ✨ Feature Requests

### Feature Request Template

```markdown
**Feature Description**
Deskripsi jelas dan ringkas tentang feature yang diinginkan.

**Problem Statement**
Jelaskan problem yang akan diselesaikan oleh feature ini.

**Proposed Solution**
Deskripsi solusi yang Anda inginkan.

**Alternative Solutions**
Alternatif solusi yang telah Anda pertimbangkan.

**Additional Context**
Tambahkan context atau screenshots tentang feature request.
```

## 📖 Documentation Contributions

### Documentation Guidelines

- Gunakan bahasa yang jelas dan mudah dipahami
- Sertakan contoh code yang berfungsi
- Update documentation ketika mengubah functionality
- Gunakan proper Markdown formatting

### Documentation Structure

```
docs/
├── SETUP.md              # Setup instructions
├── DEPLOYMENT.md          # Deployment guide
├── API_DOCUMENTATION.md   # API documentation
├── FEATURES.md           # Feature documentation
├── TROUBLESHOOTING.md    # Troubleshooting guide
└── CONTRIBUTING.md       # This file
```

## 🔧 Development Tools

### Recommended VS Code Extensions

```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-json"
  ]
}
```

### Git Hooks

Projek menggunakan git hooks untuk quality assurance:

```bash
# Install husky (dilakukan otomatis saat npm install)
npx husky install

# Pre-commit hook akan:
# - Format code dengan Prettier
# - Run ESLint
# - Run type checking

# Pre-push hook akan:
# - Run all tests
# - Check build
```

## 🚀 Release Process

### Versioning

Projek mengikuti [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Guidelines

1. **Feature Freeze**: Stop adding new features
2. **Testing**: Comprehensive testing
3. **Documentation**: Update all documentation
4. **Changelog**: Update CHANGELOG.md
5. **Version Bump**: Update version numbers
6. **Tag Release**: Create git tag
7. **Deploy**: Deploy to production

## 📝 Code of Conduct

### Our Pledge

Kami berkomitmen untuk menjadikan partisipasi dalam projek ini sebagai pengalaman yang bebas dari harassment untuk semua orang.

### Standards

**Behavior yang Diharapkan:**
- Menggunakan bahasa yang ramah dan inklusif
- Menghormati perbedaan perspektif dan pengalaman
- Menerima kritik yang konstruktif dengan baik
- Fokus pada yang terbaik untuk komunitas
- Menunjukkan empati terhadap anggota komunitas lain

**Behavior yang Tidak Dapat Diterima:**
- Penggunaan bahasa atau imagery yang bersifat seksual
- Trolling, komentar yang menghina atau merendahkan
- Harassment publik atau pribadi
- Publishing informasi pribadi orang lain tanpa izin
- Conduct lain yang tidak pantas dalam setting professional

### Enforcement

Jika Anda mengalami atau menyaksikan behavior yang tidak dapat diterima, silakan laporkan ke maintainer project.

## 🏆 Recognition

Kontributor yang memberikan kontribusi signifikan akan:

- Disebutkan dalam CONTRIBUTORS.md
- Diberikan badge contributor di GitHub
- Diundang menjadi maintainer jika konsisten berkontribusi

## 📞 Getting Help

- **GitHub Issues**: Untuk bug reports dan feature requests
- **GitHub Discussions**: Untuk pertanyaan dan diskusi
- **Email**: contact@lms-universitas.dev (jika tersedia)

Terima kasih atas kontribusi Anda untuk membuat LMS Universitas menjadi lebih baik! 🎉
