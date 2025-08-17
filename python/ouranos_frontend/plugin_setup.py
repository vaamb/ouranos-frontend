from ouranos.sdk import Plugin

from ouranos_frontend.main import Frontend


plugin = Plugin(
    functionality=Frontend,
    description="""Launch Ouranos' Frontend

    The Frontend is a web app that allows the user to interact with Ouranos 
    using a web interface.
    """,
)
