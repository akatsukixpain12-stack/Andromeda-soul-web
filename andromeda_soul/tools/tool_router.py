"""
Andromeda Tool Router & Dispatch Engine
"""

from typing import Dict, Any, Optional
from .calculator.calculator import CalculatorTool
from .code.executor import CodeExecutorTool

class ToolRouter:
    @staticmethod
    def dispatch(tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        if tool_name == "calculator":
            expr = arguments.get("expression", "")
            result = CalculatorTool.evaluate(expr)
            return {"status": "success", "result": result}
            
        elif tool_name == "python_interpreter":
            code = arguments.get("code", "")
            return CodeExecutorTool.execute_python(code)
            
        elif tool_name == "file_reader":
            filepath = arguments.get("filepath", "")
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    return {"status": "success", "content": f.read()}
            except Exception as e:
                return {"status": "error", "message": str(e)}

        return {"status": "error", "message": f"Unknown tool: {tool_name}"}
