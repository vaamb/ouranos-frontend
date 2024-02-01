from __future__ import annotations

import os
from pathlib import Path
import subprocess

from ouranos import current_app
from ouranos.core.config import get_base_dir
from ouranos.sdk import Functionality

from ouranos_frontend.config import Config


class Frontend(Functionality):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
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

    async def _startup(self):
        address = current_app.config.get("FRONTEND_ADDRESS", Config.FRONTEND_ADDRESS)
        port = current_app.config.get("FRONTEND_PORT", Config.FRONTEND_PORT)
        if current_app.config["DEVELOPMENT"]:
            cmd = [
                "npm",
                "run",
                "dev",
                "--prefix", str(self.frontend_dir),
                "--",
                "--host", str(address),
                "--port", str(port),
            ]
            self.logger.info(
                f"Vite development server running on http://{address}:{port} "
                "(Press CTRL+C to quit)"
            )
        else:
            address = current_app.config.get("FRONTEND_ADDRESS", Config.FRONTEND_ADDRESS)
            port = current_app.config.get("FRONTEND_PORT", Config.FRONTEND_PORT)
            cmd = [
                "node",
                str(self.frontend_dir/"build"),
                "--",
                "--host", str(address),
                "--port", str(port),
            ]
            self.logger.info(
                f"Node running on http://{address}:{port} (Press CTRL+C to quit)"
            )
        self.subprocess = subprocess.Popen(
            cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, text=True)

    async def _shutdown(self):
        self.subprocess.terminate()
        self.subprocess = None
