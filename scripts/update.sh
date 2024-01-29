if [[ ! -v $OURANOS_DIR ]]; then
  echo "OURANOS_DIR is not set. It should have been set if you installed Ouranos with the installer."
  echo "Set OURANOS_DIR to the root path of your Ouranos installation (the directory containing python_venv, lib, logs and scripts) in order to be able to install the frontend."
  exit 1
fi

cd "$OURANOS_DIR/lib/ouranos-frontend/" || exit 1

git pull;

npm run build
