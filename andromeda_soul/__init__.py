"""Compatibility package alias for the hyphenated ``andromeda-soul`` source tree.

The web server historically imports ``andromeda_soul`` (underscore), while the
repository stores the native Python package in ``andromeda-soul`` (hyphen).
Python cannot import a hyphenated package name directly, so this tiny alias
mounts the real package directory under the importable underscore name.
"""

from __future__ import annotations

import importlib.util
import pathlib
import sys

_REAL_PACKAGE = pathlib.Path(__file__).resolve().parent.parent / "andromeda-soul"
_REAL_INIT = _REAL_PACKAGE / "__init__.py"

_spec = importlib.util.spec_from_file_location(
    __name__,
    _REAL_INIT,
    submodule_search_locations=[str(_REAL_PACKAGE)],
)

if _spec is None or _spec.loader is None:
    raise ImportError(f"Unable to mount native Andromeda package at {_REAL_PACKAGE}")

_module = importlib.util.module_from_spec(_spec)
_module.__path__ = [str(_REAL_PACKAGE)]
_module.__file__ = str(_REAL_INIT)
sys.modules[__name__] = _module
_spec.loader.exec_module(_module)
