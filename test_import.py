import sys
import traceback

try:
    import main
    print(f"Successfully imported main")
    print(f"app exists: {hasattr(main, 'app')}")
except Exception as e:
    print(f"Error importing main: {e}")
    traceback.print_exc()
