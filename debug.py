import main
import sys

print("Module contents:")
for name in sorted(dir(main)):
    if not name.startswith('_'):
        print(f"  {name}: {type(getattr(main, name))}")

with open('main.py', 'r') as f:
    lines = f.readlines()
    print(f"\nFile has {len(lines)} lines")
    for i, line in enumerate(lines[:15], 1):
        print(f"{i:3}: {line.rstrip()}")
