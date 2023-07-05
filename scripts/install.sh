if [[ ! -v $OURANOS_DIR ]]; then
  echo "OURANOS_DIR is not set. It should have been set if you installed Ouranos with the installer."
  echo "Set OURANOS_DIR to the root path of your Ouranos installation (the directory containing python_venv, lib, logs and scripts) in order to be able to install the frontend."
  exit 1
fi

cd "$OURANOS_DIR" || exit 1

source python_venv/bin/activate

cd "lib/" || exit 1

if [ ! -d "ouranos-frontend" ]; then
  echo "Getting Ouranos frontend"
  git clone --branch stable https://github.com/vaamb/ouranos-frontend.git > /dev/null
  if [ $? = 0 ] ; then
    cd "ouranos-frontend"
  else
    echo "Failed to get Ouranos frontend repository from git";
    exit 2
  fi
else
  echo "Detecting an existing installation, you should update it if needed. Stopping"
  exit 3
fi

echo "Building Ouranos frontend and installing its wrapper"
sudo apt update
sudo apt install nodejs npm

npm install
npm i -D @sveltejs/adapter-node
npm run build

cd python_wrapper
pip install -e .

deactivate
