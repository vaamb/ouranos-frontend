import os
from warnings import warn


class Config:
    def _get_backend_url(self) -> str:
        if not hasattr(self, "API_HOST") or not hasattr(self, "API_PORT"):
            warn(
                "The config class used for Ouranos does not subclass "
                "`ouranos_frontend.Config`. Falling back to default values.")
        api_host = self.API_HOST if hasattr(self, "API_HOST") else "127.0.0.1"
        api_port = self.API_PORT if hasattr(self, "API_PORT") else 5000
        api_use_ssl = self.API_USE_SSL if hasattr(self, "API_USE_SSL") else False
        return f"http{'s' if api_use_ssl else ''}://{api_host}:{api_port}"

    # URLs used for fetching data from the API. The local version is used in
    #  `*.server.js` pages and is never exposed to the client.
    @property
    def BACKEND_URL(self) -> str:
        return self._get_backend_url()

    @property
    def API_URL_LOCAL(self) -> str:
        return f"{self._get_backend_url()}/api"

    # Frontend config
    FRONTEND_HOST: str = os.environ.get("OURANOS_FRONTEND_HOST", "127.0.0.1")
    FRONTEND_PORT: int = os.environ.get("OURANOS_FRONTEND_PORT", 3000)
    FRONTEND_USE_SSL: bool = os.environ.get("OURANOS_FRONTEND_USE_SSL", False)
