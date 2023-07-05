from ouranos.sdk import Plugin

from ouranos_frontend.main import Frontend


plugin = Plugin(
    name="frontend",
    functionality=Frontend,
)
