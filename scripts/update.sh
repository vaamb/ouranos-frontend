#!/bin/bash

# Exit on error, unset variable, and pipefail
set -euo pipefail

check_ouranos_frontend() {
    # Check if ouranos-frontend exists
    if [[ ! -d "${OURANOS_DIR}/lib/ouranos-frontend" ]]; then
        die "Ouranos-frontend installation not found at ${OURANOS_DIR}/lib/ouranos-frontend. Please install using the install script."
    fi
}

update_ouranos_frontend() {
    log INFO "Regenerating the build..."
    if [[ "$DRY_RUN" == false ]]; then
        cd "${OURANOS_DIR}/lib/ouranos-frontend" ||
            die "Failed to change to directory: ${OURANOS_DIR}/lib/ouranos-frontend"

        log INFO "Updating npm dependencies..."
        npm install ||
            die "Failed to update npm dependencies"

        log INFO "Updating additional npm development dependencies..."
        npm install --save-dev @sveltejs/adapter-node ||
            die "Failed to update additional npm dependencies"

        # Build the frontend
        log INFO "Updating Ouranos frontend build..."
        npm run build ||
            die "Failed to update Ouranos frontend build"
    fi
}

main() {
    # Check if ouranos-frontend exists
    log INFO "Checking if Ouranos frontend is installed..."
    check_ouranos_frontend
    log SUCCESS "Ouranos frontend installation found"

    log INFO "Updating Ouranos frontend..."
    update_ouranos_frontend
    log SUCCESS "Ouranos frontend updated successfully!"
}

if [[ "${BASH_SOURCE[0]}" -ef "$0" ]]; then
    echo "This script should be run from the Ouranos update script."
    exit 1
else
    main "$@"
fi
