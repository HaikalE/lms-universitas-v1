#!/bin/bash

echo "🚀 LMS Universitas v1 - Quick GitHub Upload Script"
echo "================================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    print_error "Please run this script from the LMS project root directory"
    exit 1
fi

# Get repository information
print_info "Masukkan informasi repository GitHub yang SUDAH DIBUAT:"
echo "Format: git@github.com:username/repository-name.git"
echo "Contoh: git@github.com:HaikalE/lms-universitas-complete.git"
echo ""
read -p "Repository URL: " REPO_URL

# Validate input
if [ -z "$REPO_URL" ]; then
    print_error "Repository URL tidak boleh kosong!"
    exit 1
fi

print_info "Repository target: $REPO_URL"
echo ""

# Check current status
print_info "Checking current Git status..."
git status --porcelain

echo ""
read -p "Lanjutkan upload ke repository baru? (y/n): " confirm
if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    print_warning "Upload dibatalkan."
    exit 0
fi

echo ""
print_info "Starting upload process..."

# Add new remote
print_info "Adding new remote..."
git remote add github-new "$REPO_URL" 2>/dev/null || {
    print_warning "Remote 'github-new' sudah ada, menghapus dan menambah ulang..."
    git remote remove github-new 2>/dev/null
    git remote add github-new "$REPO_URL"
}

# Push to new repository
print_info "Pushing to GitHub repository..."

# Try different branch strategies
if git push github-new update-from-cli:main; then
    print_success "Upload berhasil! Branch 'update-from-cli' → 'main'"
elif git push github-new main; then
    print_success "Upload berhasil! Branch 'main' → 'main'"
elif git push github-new master:main; then
    print_success "Upload berhasil! Branch 'master' → 'main'"
else
    print_error "Upload gagal. Periksa koneksi dan pastikan repository sudah dibuat."
    exit 1
fi

# Push all branches and tags
print_info "Pushing all branches and tags..."
git push --all github-new 2>/dev/null || print_warning "Some branches might not be pushed"
git push --tags github-new 2>/dev/null || print_warning "No tags to push"

echo ""
print_success "🎉 Upload Complete!"
echo ""
echo "Repository URL: ${REPO_URL}"
echo "Web URL: ${REPO_URL/git@github.com:/https://github.com/}"
echo "Web URL: ${REPO_URL/.git/}"
echo ""

print_info "📦 Yang sudah di-upload:"
echo "✅ Complete source code (Backend + Frontend)"
echo "✅ Database export lengkap (PostgreSQL)"
echo "✅ Docker configuration"
echo "✅ Dokumentasi lengkap"
echo "✅ Migration guides"
echo "✅ Bug fixes dan enhancements"
echo ""

print_info "🔗 Next steps:"
echo "1. Buka repository di GitHub"
echo "2. Verifikasi semua files ter-upload"
echo "3. Setup branch protection (optional)"
echo "4. Create release tag (optional)"
echo "5. Update repository description dan topics"
echo ""

print_success "Happy coding! 🚀"

# Clean up remote
read -p "Hapus remote temporary 'github-new'? (y/n): " cleanup
if [ "$cleanup" = "y" ] || [ "$cleanup" = "Y" ]; then
    git remote remove github-new
    print_info "Remote 'github-new' dihapus"
fi