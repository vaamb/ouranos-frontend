import subprocess
from typing import Type

import click

from ouranos.core.utils import parse_str_value
from ouranos.sdk import Plugin

from ouranos_frontend.main import Frontend


class FrontendPlugin(Plugin):
    functionality: Frontend

    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    async def check_requirements(self) -> None:
        build_dir = self.functionality._get_frontend_dir().absolute() / "build"
        if not self.config["DEVELOPMENT"] and not build_dir.exists():
            raise ValueError(
                "The frontend app has not been built yet. Please run "
                "`ouranos frontend build` first."
            ) from None

    def build(self) -> None:
        frontend_dir = self.functionality._get_frontend_dir().absolute()
        subprocess.run(["npm", "run", "build"], cwd=str(frontend_dir))

    def create_run_command(
            self,
            cmd_cls: Type[click.Command] | None = None,
            cmd_kwargs: dict | None = None,
    ) -> click.Command:
        cmd_kwargs = cmd_kwargs or {}
        cmd_kwargs["invoke_without_command"] = True
        @click.command(
            self.name,
            cls=click.Group,
            help=self._description,
            **cmd_kwargs
        )
        @click.option(
            "--config-profile", "-c",
            type=str,
            default=None,
            help="Configuration profile to use as defined in config.py.",
            show_default=True,
        )
        @click.option(
            "--config-override", "-co",
            type=str,
            multiple=True,
            help="Configuration overrides in key=value format",
            show_default=True,
        )
        @click.pass_context
        def group(
                ctx: click.Context,
                config_profile: str | None,
                config_override: list[str],
        ) -> None:
            """Run the plugin as a standalone service."""
            if ctx.invoked_subcommand is not None:
                return

            config_override_str = config_override
            config_override = {}
            for overridden in config_override_str:
                key, value = overridden.split("=")
                config_override[key] = parse_str_value(value)

            self.setup_config(config_profile, config_override)
            self.run_as_standalone()

        @group.command("build", help="Build the Svelte app")
        def build():
            self.build()

        return group


plugin = FrontendPlugin(
    functionality=Frontend,
    description="""Launch Ouranos' Frontend

    The Frontend is a web app that allows the user to interact with Ouranos 
    using a web interface.
    """,
)
