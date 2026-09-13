"""
Andromeda Native Calculator Tool
"""

import ast
import operator
from typing import Union

class CalculatorTool:
    OPERATORS = {
        ast.Add: operator.add,
        ast.Sub: operator.sub,
        ast.Mult: operator.mul,
        ast.Div: operator.truediv,
        ast.Pow: operator.pow,
        ast.USub: operator.neg,
    }

    @classmethod
    def evaluate(cls, expression: str) -> Union[int, float, str]:
        try:
            tree = ast.parse(expression, mode='eval')
            return cls._eval(tree.body)
        except Exception as e:
            return f"Math Evaluation Error: {str(e)}"

    @classmethod
    def _eval(cls, node):
        if isinstance(node, ast.Num):  # Number
            return node.n
        elif isinstance(node, ast.BinOp):  # Binary Operation
            left = cls._eval(node.left)
            right = cls._eval(node.right)
            return cls.OPERATORS[type(node.op)](left, right)
        elif isinstance(node, ast.UnaryOp):  # Unary Operation
            operand = cls._eval(node.operand)
            return cls.OPERATORS[type(node.op)](operand)
        else:
            raise ValueError(f"Unsupported mathematical expression node: {type(node)}")
