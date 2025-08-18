#!/bin/bash

# Exit on error, unset variable, and pipefail
set -euo pipefail

# Version requirements
readonly OURANOS_FRONTEND_VERSION="0.9.0"
readonly OURANOS_FRONTEND_REPO="https://github.com/vaamb/ouranos-frontend.git"

check_ouranos_installed() {
    # Check that Ouranos variable is set
    if [[ -z "${OURANOS_DIR:-}" ]]; then
        echo "OURANOS_DIR environment variable is not set. Please check your installation."
        exit 1
    fi

    # Check that the directories exist
    local dirs=("${OURANOS_DIR}" "${OURANOS_DIR}/lib" "${OURANOS_DIR}/logs" "${OURANOS_DIR}/scripts")
    for dir in "${dirs[@]}"; do
      if [[ ! -d "$dir" ]]; then
        echo "Ouranos directories not found at $OURANOS_DIR. Please check your installation."
        exit 1
      fi
    done
}

setup_logging() {
    # Load logging functions
    readonly DATETIME=$(date +%Y%m%d_%H%M%S)
    readonly LOG_FILE="/tmp/ouranos_frontend_update_${DATETIME}.log"
    readonly SCRIPT_DIR="${OURANOS_DIR}/scripts"
    . "${SCRIPT_DIR}/logging.sh"
}

install_requirements() {
    log INFO "Updating package lists..."
    sudo apt-get update ||
        log WARN "Failed to update package lists"

    log INFO "Installing Node.js and npm..."
    if ! command -v node &> /dev/null || ! command -v npm &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash - && \
        sudo apt-get install -y nodejs  || log ERROR "Failed to install Node.js and npm"
    else
        log INFO "Node.js and npm are already installed"
    fi

    # Verify Node.js and npm versions
    local node_version=$(node -v)
    local npm_version=$(npm -v)
    log INFO "Using Node.js ${node_version} and npm ${npm_version}"
}

install_ouranos_frontend() {
    # Activate virtual environment
    source "${OURANOS_DIR}/python_venv/bin/activate" ||
        log ERROR "Failed to activate Python virtual environment"

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
    cd "python" ||
        log ERROR "Failed to change to python_wrapper directory"
    pip install -e . ||
        log ERROR "Failed to install Python wrapper"

    # Deactivate virtual environment
    deactivate ||
        log ERROR "Failed to deactivate virtual environment"
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
    # Set trap to run cleanup function on exit
    trap cleanup EXIT

    log INFO "Starting Ouranos frontend installation (v${OURANOS_FRONTEND_VERSION})"

    # Check that Ouranos is installed
    log INFO "Checking if Ouranos is installed..."
    check_ouranos_installed
    log SUCCESS "Ouranos installation found"

    setup_logging

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

main
