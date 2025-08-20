check_ouranos_installed() {
    # Check that Ouranos variable is set
    if [[ -z "${OURANOS_DIR:-}" ]]; then
        echo "OURANOS_DIR environment variable is not set. Please check your installation."
        exit 1
    fi

    # Check that the directories exist
    local dirs=("${OURANOS_DIR}" "${OURANOS_DIR}/lib" "${OURANOS_DIR}/logs" "${OURANOS_DIR}/scripts" "${OURANOS_DIR}/python_venv")
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

check_ouranos_frontend_installed() {
    # Check if ouranos-frontend exists
    if [ ! -d "${OURANOS_DIR}/lib/ouranos-frontend" ]; then
        log ERROR "Ouranos-frontend installation not found at ${OURANOS_DIR}/lib/ouranos-frontend. Please install using the install script."
    fi
}

update_ouranos_frontend() {
    # Change to Ouranos lib directory
    cd "${OURANOS_DIR}/lib/ouranos-frontend" ||
        log ERROR "Failed to change to directory: ${OURANOS_DIR}/lib/ouranos-frontend"

    # Use the update_git_repo function from ouranos scripts
    # It takes care of all the python-side updates
    update_git_repo "${OURANOS_DIR}/lib/ouranos-frontend"

    # Update npm dependencies
    log INFO "Updating npm dependencies..."
    npm install ||
        log ERROR "Failed to update npm dependencies"

    log INFO "Updating additional npm development dependencies..."
    npm install --save-dev @sveltejs/adapter-node ||
        log ERROR "Failed to update additional npm dependencies"

    # Build the frontend
    log INFO "Updating Ouranos frontend build..."
    npm run build ||
        log ERROR "Failed to update Ouranos frontend build"
}

main() {
    # All the backup and cleanup logics are taken care by ouranos scripts
    check_ouranos_installed

    setup_logging

    # Check if ouranos-frontend exists
    log INFO "Checking if Ouranos frontend is installed..."
    check_ouranos_frontend_installed
    log SUCCESS "Ouranos frontend installation found"

    log INFO "Updating Ouranos frontend..."
    update_ouranos_frontend
    log SUCCESS "Ouranos frontend updated successfully!"

    exit 0
}

main "$@"
