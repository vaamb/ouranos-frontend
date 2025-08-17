from __future__ import annotations

import os
from pathlib import Path
import subprocess

from ouranos import current_app
from ouranos.core.config import ConfigDict, get_base_dir
from ouranos.sdk import Functionality

from ouranos_frontend.config import Config


class Frontend(Functionality):
    def __init__(self, config: ConfigDict, **kwargs):
        super().__init__(config, **kwargs)
        self.subprocess: subprocess.Popen | None = None
        self.frontend_dir = self._get_frontend_dir().absolute()

    @staticmethod
    def _get_frontend_dir() -> Path:
        # Check if the env var "OURANOS_FRONTEND_DIR" should be used
        frontend_dir_var = os.environ.get("OURANOS_FRONTEND_DIR")
        if frontend_dir_var is not None:
            frontend_dir = Path(frontend_dir_var)
            if frontend_dir.exists():
                return frontend_dir
        # Try to use the default case
        base_dir = get_base_dir()
        frontend_dir = base_dir / "lib/ouranos-frontend"
        if frontend_dir.exists():
            return frontend_dir
        # Try to find the dir from the package
        this_dir = Path(__file__).absolute().parent
        frontend_dir = this_dir.parents[1]
        if frontend_dir.exists():
            return frontend_dir
        raise ValueError("Cannot find the frontend end directory")

    def _patch_dotenv(self) -> None:
        # App mode
        app_mode: str
        if current_app.config["DEVELOPMENT"]:
            app_mode = "development"
        elif current_app.config["TESTING"]:
            app_mode = "test"
        else:
            app_mode = "production"
        # API URLs
        backend_url = current_app.config.get("BACKEND_URL")
        if not backend_url:
            backend_url = Config().BACKEND_URL
        api_url_local = current_app.config.get("API_URL_LOCAL")
        if not api_url_local:
            api_url_local = Config().API_URL_LOCAL
        # Patch the dotenv file
        with open(self.frontend_dir / ".env", "w") as f:
            f.write(f'PUBLIC_APP_MODE = "{app_mode}"\n')
            f.write(f'PUBLIC_BACKEND_URL = "{backend_url}"\n')
            f.write(f'PUBLIC_LOCAL_API_URL = "{api_url_local}"\n')

    async def startup(self) -> None:
        self._patch_dotenv()
        host = current_app.config.get("FRONTEND_HOST", Config.FRONTEND_HOST)
        port = current_app.config.get("FRONTEND_PORT", Config.FRONTEND_PORT)
        if current_app.config["DEVELOPMENT"]:
            cmd = [
                "npm",
                "run",
                "dev",
                "--prefix", str(self.frontend_dir),
                "--",
                "--host", str(host),
                "--port", str(port),
            ]
            self.logger.info(
                f"Vite development server running on http://{host}:{port} "
                "(Press CTRL+C to quit)"
            )
        else:
            cmd = [
                "node",
                str(self.frontend_dir/"build"),
                "--",
                "--host", str(host),
                "--port", str(port),
            ]
            self.logger.info(
                f"Node running on http://{host}:{port} (Press CTRL+C to quit)"
            )
        self.subprocess = subprocess.Popen(
            cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, text=True)

    async def shutdown(self) -> None:
        self.subprocess.terminate()
        self.subprocess = None
