# Register the integration dir as a standalone top-level "carlinko" package
# before anything imports it, so importing api.py never runs the real
# custom_components.carlinko.__init__ (which pulls in homeassistant).
import importlib.util, sys
from importlib.machinery import ModuleSpec
from pathlib import Path
_p = importlib.util.module_from_spec(ModuleSpec("carlinko", None, is_package=True))
_p.__path__ = [str(Path(__file__).resolve().parents[1] / "custom_components" / "carlinko")]
sys.modules["carlinko"] = _p

# Separate, environment-only shim: when homeassistant IS installed, its test
# plugin (pytest-homeassistant-custom-component) registers an autouse async
# fixture that pytest-asyncio's default "strict" mode rejects on sync tests.
# No-op when pytest-asyncio isn't installed (the HA-free run).
def pytest_configure(config):
    config.option.asyncio_mode = "auto"
