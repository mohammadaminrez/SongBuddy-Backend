#!/bin/bash

# SongBuddy Backend Auto Setup Script
# This script automatically installs and configures everything needed to run the backend

set -e  # Exit on any error

echo "🎵 SongBuddy Backend Auto Setup"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
check_node() {
    print_status "Checking Node.js installation..."
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js is installed: $NODE_VERSION"
        
        # Check if version is 18 or higher
        NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
        if [ "$NODE_MAJOR" -lt 18 ]; then
            print_warning "Node.js version is $NODE_VERSION. Version 18+ is recommended."
        fi
    else
        print_error "Node.js is not installed!"
        print_status "Installing Node.js..."
        install_node
    fi
}

# Install Node.js
install_node() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        print_status "Installing Node.js on macOS..."
        if command -v brew &> /dev/null; then
            brew install node
        else
            print_error "Homebrew not found. Please install Node.js manually from https://nodejs.org/"
            exit 1
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        print_status "Installing Node.js on Linux..."
        if command -v apt &> /dev/null; then
            curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
            sudo apt-get install -y nodejs
        elif command -v yum &> /dev/null; then
            curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
            sudo yum install -y nodejs
        else
            print_error "Package manager not found. Please install Node.js manually from https://nodejs.org/"
            exit 1
        fi
    else
        print_error "Unsupported operating system. Please install Node.js manually from https://nodejs.org/"
        exit 1
    fi
}

# Check if Git is installed
check_git() {
    print_status "Checking Git installation..."
    if command -v git &> /dev/null; then
        print_success "Git is installed: $(git --version)"
    else
        print_error "Git is not installed! Please install Git first."
        exit 1
    fi
}

# Install dependencies
install_dependencies() {
    print_status "Installing Node.js dependencies..."
    if npm install; then
        print_success "Dependencies installed successfully!"
    else
        print_error "Failed to install dependencies!"
        exit 1
    fi
}

# Setup environment file
setup_environment() {
    print_status "Setting up environment configuration..."
    
    if [ ! -f .env ]; then
        if [ -f env.example ]; then
            cp env.example .env
            print_success "Created .env file from env.example"
        else
            print_error "env.example file not found!"
            exit 1
        fi
    else
        print_warning ".env file already exists. Skipping..."
    fi
}

# Generate JWT secret
generate_jwt_secret() {
    print_status "Generating JWT secret..."
    JWT_SECRET=$(openssl rand -base64 32)
    
    # Update .env file with generated JWT secret
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/your_super_secret_jwt_key_here_change_this_in_production/$JWT_SECRET/" .env
    else
        # Linux
        sed -i "s/your_super_secret_jwt_key_here_change_this_in_production/$JWT_SECRET/" .env
    fi
    
    print_success "JWT secret generated and configured!"
}

# Get system IP address
get_system_ip() {
    print_status "Getting system IP address..."
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        SYSTEM_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')
    else
        # Linux
        SYSTEM_IP=$(hostname -I | awk '{print $1}')
    fi
    
    if [ -n "$SYSTEM_IP" ]; then
        print_success "System IP address: $SYSTEM_IP"
        echo "SYSTEM_IP=$SYSTEM_IP" >> .env
    else
        print_warning "Could not determine system IP address"
    fi
}

# Test the setup
test_setup() {
    print_status "Testing the setup..."
    
    # Test if we can start the server
    print_status "Starting server for testing..."
    
    # Start server in background
    npm run dev:simple &
    SERVER_PID=$!
    
    # Wait a moment for server to start
    sleep 3
    
    # Test health endpoint
    if curl -s http://localhost:3000/health > /dev/null; then
        print_success "Server is running and responding!"
    else
        print_warning "Server test failed, but setup is complete"
    fi
    
    # Stop the test server
    kill $SERVER_PID 2>/dev/null || true
}

# Main setup function
main() {
    echo
    print_status "Starting SongBuddy Backend setup..."
    echo
    
    # Check prerequisites
    check_git
    check_node
    
    # Install dependencies
    install_dependencies
    
    # Setup environment
    setup_environment
    generate_jwt_secret
    get_system_ip
    
    # Test setup
    test_setup
    
    echo
    print_success "🎉 Setup completed successfully!"
    echo
    echo "📋 Next steps:"
    echo "1. Edit .env file with your Spotify credentials"
    echo "2. Run: npm run dev:simple"
    echo "3. Test: curl http://localhost:3000/health"
    echo
    echo "🔧 Configuration:"
    echo "- Backend will run on: http://localhost:3000"
    echo "- Health check: http://localhost:3000/health"
    echo "- API test: http://localhost:3000/api/test"
    echo
    echo "📱 For Flutter app connection:"
    echo "- Update BackendApiService baseUrl to: http://$SYSTEM_IP:3000"
    echo
    print_success "Happy coding! 🎵"
}

# Run main function
main "$@"
