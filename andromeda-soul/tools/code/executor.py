"""
Andromeda Code Sandbox Executor Tool
Executes Python code in a controlled namespace
"""

import sys
import io
import traceback
from typing import Dict, Any

class CodeExecutorTool:
    @staticmethod
    def execute_python(code: str, timeout_seconds: int = 5) -> Dict[str, Any]:
        old_stdout = sys.stdout
        old_stderr = sys.stderr
        redirected_stdout = sys.stdout = io.StringIO()
        redirected_stderr = sys.stderr = io.StringIO()

        exec_globals = {
            "__builtins__": __builtins__,
        }
        exec_locals = {}

        success = True
        error_msg = None

        try:
            exec(code, exec_globals, exec_locals)
        except Exception as e:
            success = False
            error_msg = traceback.format_exc()

        sys.stdout = old_stdout
        sys.stderr = old_stderr

        stdout_str = redirected_stdout.getvalue()
        stderr_str = redirected_stderr.getvalue()

        return {
            "success": success,
            "stdout": stdout_str,
            "stderr": stderr_str or error_msg,
            "result_variables": {k: str(v) for k, v in exec_locals.items() if not k.startswith("_")}
        }
