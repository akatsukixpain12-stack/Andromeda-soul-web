import subprocess
import os
import sys

def execute_code(code: str, language: str = "python", timeout: int = 10) -> dict:
    """
    Executes Python, Bash, or Node scripts within an isolated subshell.
    Enforces timeout limits and security boundaries.
    """
    # Security boundary patterns
    destructive_patterns = [
        "rm -rf /",
        "mkfs",
        ":(){ :|:& };:",
        "dd if=/dev/zero",
        "chmod -R 777 /",
    ]

    for pattern in destructive_patterns:
        if pattern in code:
            return {
                "success": False,
                "error": "Execution blocked: Destructive command pattern detected by Andromeda Safety.",
                "exit_code": 126
            }

    try:
        if language in ["python", "py"]:
            proc = subprocess.run(
                [sys.executable, "-c", code],
                capture_output=True,
                text=True,
                timeout=timeout
            )
        elif language in ["bash", "sh"]:
            proc = subprocess.run(
                ["bash", "-c", code],
                capture_output=True,
                text=True,
                timeout=timeout
            )
        elif language in ["javascript", "js", "node"]:
            proc = subprocess.run(
                ["node", "-e", code],
                capture_output=True,
                text=True,
                timeout=timeout
            )
        else:
            return {
                "success": False,
                "error": f"Unsupported language: {language}",
                "exit_code": 1
            }

        return {
            "success": proc.returncode == 0,
            "stdout": proc.stdout,
            "stderr": proc.stderr,
            "exit_code": proc.returncode
        }
    except subprocess.TimeoutExpired:
        return {
            "success": False,
            "error": f"Execution timed out after {timeout} seconds",
            "exit_code": 124
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "exit_code": 1
        }
