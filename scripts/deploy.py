#!/usr/bin/env python3
"""
Docker Compose orchestration script for Convex POC deployment.

This script provides a simple interface to start and stop Docker Compose services.
It uses subprocess to execute Docker Compose commands directly.
"""

import subprocess
import sys
import argparse


def run_command(cmd, description):
    """
    Execute a command using subprocess and handle errors.

    Args:
        cmd: List of command arguments
        description: Human-readable description of the command

    Returns:
        bool: True if command succeeded, False otherwise
    """
    print(f"\n{'='*60}")
    print(f"{description}...")
    print(f"Running: {' '.join(cmd)}")
    print(f"{'='*60}\n")

    try:
        result = subprocess.run(
            cmd,
            check=True,
            capture_output=False,
            text=True
        )
        print(f"\n✓ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"\n✗ {description} failed with exit code {e.returncode}")
        return False
    except FileNotFoundError:
        print(f"\n✗ Error: '{cmd[0]}' command not found. Please ensure Docker is installed and in PATH.")
        return False


def deploy_up(detach=True):
    """
    Start all Docker Compose services.

    Args:
        detach: If True, run in detached mode (default)
    """
    cmd = ["docker", "compose", "up"]
    if detach:
        cmd.append("-d")

    success = run_command(cmd, "Starting Docker Compose services")

    if success:
        print("\n" + "="*60)
        print("Services are starting...")
        print("\nAccess URLs:")
        print("  - Frontend:     http://localhost:3000")
        print("  - Convex API:   http://localhost:3210")
        print("  - Convex Dashboard: http://localhost:6791")
        print("\nTo view logs, run: docker compose logs -f")
        print("="*60)

    return success


def deploy_down():
    """
    Stop and remove all Docker Compose services.
    """
    cmd = ["docker", "compose", "down"]
    success = run_command(cmd, "Stopping Docker Compose services")

    if success:
        print("\n" + "="*60)
        print("All services stopped and containers removed")
        print("="*60)

    return success


def deploy_status():
    """
    Show status of all Docker Compose services.
    """
    cmd = ["docker", "compose", "ps"]
    return run_command(cmd, "Checking service status")


def deploy_logs(service=None, follow=False):
    """
    Show logs from Docker Compose services.

    Args:
        service: Optional service name to filter logs
        follow: If True, follow log output (like tail -f)
    """
    cmd = ["docker", "compose", "logs"]
    if follow:
        cmd.append("-f")
    if service:
        cmd.append(service)

    return run_command(cmd, f"Showing logs{' for ' + service if service else ''}")


def main():
    """
    Main entry point for the deployment script.
    """
    parser = argparse.ArgumentParser(
        description="Docker Compose orchestration for Convex POC",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s up              Start all services in detached mode
  %(prog)s up --no-detach  Start all services in foreground
  %(prog)s down            Stop and remove all services
  %(prog)s status          Show service status
  %(prog)s logs            Show logs from all services
  %(prog)s logs -f         Follow logs (like tail -f)
  %(prog)s logs backend    Show logs for backend service only
        """
    )

    parser.add_argument(
        "action",
        choices=["up", "down", "status", "logs"],
        help="Action to perform"
    )
    parser.add_argument(
        "--no-detach",
        action="store_true",
        help="Run in foreground (only for 'up' action)"
    )
    parser.add_argument(
        "-f",
        "--follow",
        action="store_true",
        help="Follow log output (only for 'logs' action)"
    )

    args = parser.parse_args()

    # Execute the requested action
    if args.action == "up":
        success = deploy_up(detach=not args.no_detach)
    elif args.action == "down":
        success = deploy_down()
    elif args.action == "status":
        success = deploy_status()
    elif args.action == "logs":
        # For logs, any remaining args are treated as service name
        if args.follow:
            success = deploy_logs(follow=True)
        else:
            success = deploy_logs()
    else:
        parser.print_help()
        success = False

    # Exit with appropriate code
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
