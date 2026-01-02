#!/bin/bash

# Exit on error, unset variable, and pipefail
set -euo pipefail

# Version requirements
readonly OURANOS_FRONTEND_VERSION="0.9.0"
readonly OURANOS_FRONTEND_REPO="https://github.com/vaamb/ouranos-frontend.git"

check_ouranos_installed() {
    # Check if ouranos has been installed
    if [ ! -d "${OURANOS_DIR}/lib" ]; then
        echo "Ouranos installation not found. Please install it first using the Ouranos install script."
        exit 1
    fi
}

setup_logging() {
    # Load logging functions
    readonly DATETIME=$(date +%Y%m%d_%H%M%S)
    readonly LOG_FILE="/tmp/ouranos_frontend_install_${DATETIME}.log"
    source "${OURANOS_DIR}/scripts/utils/logging.sh" "${LOG_FILE}"
}

install_requirements() {
    log INFO "Updating package lists..."
    sudo apt-get update ||
        log WARN "Failed to update package lists"

    log INFO "Installing Node.js and npm..."
    if ! command -v node &> /dev/null || ! command -v npm &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash - && \
        sudo apt-get install -y nodejs npm  || log ERROR "Failed to install Node.js and npm"
    else
        log INFO "Node.js and npm are already installed"
    fi

    # Verify Node.js and npm versions
    local node_version=$(node -v)
    local npm_version=$(npm -v)
    log INFO "Using Node.js ${node_version} and npm ${npm_version}"
}

install_ouranos_frontend() {
    # Change to Ouranos lib directory
    cd "${OURANOS_DIR}/lib" ||
        log ERROR "Failed to change to directory: ${OURANOS_DIR}/lib"

    # Check if ouranos-frontend already exists
    if [ -d "ouranos-frontend" ]; then
        log ERROR "Ouranos-frontend installation detected at ${OURANOS_DIR}/lib/ouranos-frontend. Please update using the update script."
    fi

    # Clone the repository
    log INFO "Cloning Ouranos frontend repository..."
    git clone "${OURANOS_FRONTEND_REPO}" --branch "${OURANOS_FRONTEND_VERSION}" ||
        log ERROR "Failed to clone Ouranos frontend repository"

    cd "${OURANOS_DIR}/lib/ouranos-frontend" ||
        log ERROR "Failed to change to ouranos-frontend directory"

    # Install npm dependencies
    log INFO "Installing npm dependencies..."
    npm install ||
        log ERROR "Failed to install npm dependencies"

    log INFO "Installing additional npm development dependencies..."
    npm install --save-dev @sveltejs/adapter-node ||
        log ERROR "Failed to install additional npm dependencies"

    # Build the frontend
    log INFO "Building Ouranos frontend..."
    npm run build ||
        log ERROR "Failed to build Ouranos frontend"

    # Install Python hook
    log INFO "Installing Python wrapper..."
    cd "${OURANOS_DIR}" ||
        log ERROR "Failed to change to directory: ${OURANOS_DIR}"
    uv lock --upgrade ||
        log ERROR "Failed to update uv lock"
    # use --inexact to keep packages not defined in pyproject.toml such as the DB drivers
    uv sync --all-packages --inexact ||
        log ERROR "Failed to update Python virtual environment"
}

# Cleanup function to run on exit
cleanup() {
    local exit_code=$?

    if [ ${exit_code} -ne 0 ]; then
        log ERROR "Installation failed. Check the log file for details: ${LOG_FILE}"
        rm -r "${OURANOS_DIR}/lib/ouranos-frontend"
    else
        log SUCCESS "Installation completed successfully!"
    fi

    # Reset terminal colors
    echo -e "${NC}"
    exit ${exit_code}
}

main() {
    # Check that Ouranos is installed
    check_ouranos_installed

    setup_logging

    # Set trap to run cleanup function on exit
    trap cleanup EXIT

    log INFO "Installing dependencies..."
    install_requirements
    log SUCCESS "Dependencies installed successfully!"

    log INFO "Installing Ouranos frontend..."
    install_ouranos_frontend
    log SUCCESS "Ouranos frontend installed successfully!"

    echo -e "\n${GREEN}✔ Installation completed successfully!${NC}"
    echo -e "\n${YELLOW}By default, the frontend is enabled with Ouranos and runs on port 3000.${NC}"
    echo -e "${YELLOW}To start the frontend, run one of those, depending on how you started Ouranos:${NC}"
    echo -e "  ouranos restart"
    echo -e "  sudo systemctl restart ouranos"
    echo -e "${YELLOW}You can also start the frontend alone by running:${NC}"
    echo -e "  ouranos start frontend"

    exit 0
}

main "$@"
