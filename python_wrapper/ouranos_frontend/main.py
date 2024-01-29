from __future__ import annotations

import subprocess

from ouranos import current_app
from ouranos.core.config import get_base_dir
from ouranos.sdk import Functionality

from ouranos_frontend.config import Config


class Frontend(Functionality):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.subprocess: subprocess.Popen | None = None
        base_dir = get_base_dir().absolute()
        self.frontend_dir = base_dir/"lib/ouranos-frontend"

    def _startup(self):
        if current_app.config["DEVELOPMENT"]:
            cmd = [
                "npm",
                "run",
                "dev",
                "--prefix", str(self.frontend_dir),
            ]
            self.logger.info(
                "Vite development server running on http://127.0.0.1:5173 "
                "(Press CTRL+C to quit)"
            )
        else:
            address = current_app.config.get("FRONTEND_ADDRESS", Config.FRONTEND_ADDRESS)
            port = current_app.config.get("FRONTEND_PORT", Config.FRONTEND_PORT)
            cmd = [
                "node",
                str(self.frontend_dir/"build"),
                ]
            self.logger.info(
                f"Node running on http://{address}:{port} (Press CTRL+C to quit)"
            )
        self.subprocess = subprocess.Popen(
            cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, text=True)

    def _shutdown(self):
        self.subprocess.terminate()
        self.subprocess = None
