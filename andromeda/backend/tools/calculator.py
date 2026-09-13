import math
import re

def calculate(expression: str) -> dict:
    """
    Safely evaluates high-precision mathematical and scientific expressions.
    Supports basic arithmetic, algebra, trigonometry, logarithms, and constants.
    """
    clean_expr = expression.strip()
    
    # Allowed math symbols and tokens
    safe_dict = {
        "sin": math.sin,
        "cos": math.cos,
        "tan": math.tan,
        "asin": math.asin,
        "acos": math.acos,
        "atan": math.atan,
        "sqrt": math.sqrt,
        "log": math.log,
        "log10": math.log10,
        "log2": math.log2,
        "exp": math.exp,
        "pow": math.pow,
        "abs": abs,
        "round": round,
        "floor": math.floor,
        "ceil": math.ceil,
        "pi": math.pi,
        "e": math.e,
        "tau": math.tau,
    }

    # Clean expression of potential dangerous characters
    sanitized = re.sub(r"[^0-9\+\-\*\/\%\^\(\)\.\,\s\w]", "", clean_expr)
    sanitized = sanitized.replace("^", "**")

    try:
        # Safe eval using restricted globals and locals
        result = eval(sanitized, {"__builtins__": {}}, safe_dict)
        return {
            "success": True,
            "expression": clean_expr,
            "result": result,
            "formatted": f"{clean_expr} = {result}"
        }
    except Exception as e:
        return {
            "success": False,
            "expression": clean_expr,
            "error": str(e)
        }
