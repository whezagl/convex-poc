#!/usr/bin/env python3
"""
Docker Compose orchestration script for Convex POC.

This script provides a convenient interface for managing the Docker Compose
lifecycle of the Convex backend and dashboard services.
"""

import argparse
import subprocess
import sys
from typing import List


class DockerComposeError(Exception):
    """Custom exception for Docker Compose errors."""
    pass


class DeployManager:
    """Manages Docker Compose operations for the Convex POC."""

    def __init__(self, compose_file: str = "docker-compose.yml"):
        """Initialize the deploy manager.

        Args:
            compose_file: Path to the Docker Compose configuration file.
        """
        self.compose_file = compose_file
        self.base_cmd: List[str] = ["docker", "compose", "-f", self.compose_file]

    def _run_command(self, command: List[str], check: bool = True) -> subprocess.CompletedProcess:
        """Run a command and handle errors.

        Args:
            command: The command to run as a list of strings.
            check: Whether to raise an exception on non-zero exit codes.

        Returns:
            The completed process result.

        Raises:
            DockerComposeError: If the command fails and check is True.
        """
        try:
            result = subprocess.run(
                command,
                check=check,
                capture_output=False,
                text=True
            )
            return result
        except subprocess.CalledProcessError as e:
            raise DockerComposeError(f"Command failed: {' '.join(command)}") from e
        except FileNotFoundError as e:
            raise DockerComposeError(
                "Docker Compose not found. Please ensure Docker is installed and 'docker compose' is available."
            ) from e

    def up(self, detached: bool = True) -> None:
        """Start all services.

        Args:
            detached: Whether to run in detached mode (default: True).
        """
        cmd = self.base_cmd + ["up"]
        if detached:
            cmd.append("-d")
        print("Starting services...")
        self._run_command(cmd, check=True)
        print("Services started successfully.")
        self.status()

    def down(self, volumes: bool = False) -> None:
        """Stop and remove all services.

        Args:
            volumes: Whether to remove named volumes (default: False).
        """
        cmd = self.base_cmd + ["down"]
        if volumes:
            cmd.append("-v")
        print("Stopping services...")
        self._run_command(cmd, check=True)
        print("Services stopped successfully.")

    def restart(self) -> None:
        """Restart all services."""
        print("Restarting services...")
        cmd = self.base_cmd + ["restart"]
        self._run_command(cmd, check=True)
        print("Services restarted successfully.")
        self.status()

    def status(self) -> None:
        """Show status of all services."""
        cmd = self.base_cmd + ["ps"]
        print("\nService Status:")
        print("-" * 60)
        self._run_command(cmd, check=False)

    def logs(self, service: str = None, follow: bool = False) -> None:
        """Show logs from services.

        Args:
            service: Optional service name to filter logs.
            follow: Whether to follow log output.
        """
        cmd = self.base_cmd + ["logs"]
        if follow:
            cmd.append("-f")
        if service:
            cmd.append(service)
        self._run_command(cmd, check=False)


def main():
    """Main entry point for the deploy script."""
    parser = argparse.ArgumentParser(
        description="Docker Compose orchestration script for Convex POC",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python deploy.py up              Start all services
  python deploy.py down            Stop all services
  python deploy.py restart         Restart all services
  python deploy.py status          Show service status
  python deploy.py logs            Show all logs
  python deploy.py logs backend    Show backend logs
  python deploy.py logs -f         Follow logs
        """
    )

    parser.add_argument(
        "command",
        choices=["up", "down", "restart", "status", "logs"],
        help="Command to execute"
    )
    parser.add_argument(
        "-f", "--file",
        default="docker-compose.yml",
        help="Path to Docker Compose file (default: docker-compose.yml)"
    )
    parser.add_argument(
        "-v", "--volumes",
        action="store_true",
        help="Remove named volumes (only applies to 'down' command)"
    )
    parser.add_argument(
        "--follow",
        action="store_true",
        help="Follow log output (only applies to 'logs' command)"
    )

    args = parser.parse_args()

    try:
        manager = DeployManager(compose_file=args.file)

        if args.command == "up":
            manager.up(detached=True)
        elif args.command == "down":
            manager.down(volumes=args.volumes)
        elif args.command == "restart":
            manager.restart()
        elif args.command == "status":
            manager.status()
        elif args.command == "logs":
            # Get service name from remaining args if any
            service = None
            if len(sys.argv) > 2:
                potential_service = sys.argv[-1]
                if not potential_service.startswith("-"):
                    service = potential_service
            manager.logs(service=service, follow=args.follow)

    except DockerComposeError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
    except KeyboardInterrupt:
        print("\nOperation cancelled by user.", file=sys.stderr)
        sys.exit(130)
    except Exception as e:
        print(f"Unexpected error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
