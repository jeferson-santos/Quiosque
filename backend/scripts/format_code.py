import subprocess
import sys

def main():
    commands = [
        [sys.executable, "-m", "isort", "app", "tests"],
        [sys.executable, "-m", "black", "app", "tests"],
        [sys.executable, "-m", "pylint", "app", "tests"], 
    ]
    for cmd in commands:
        print(f"Running: {' '.join(cmd)}")
        result = subprocess.run(cmd)
        if result.returncode != 0:
            sys.exit(result.returncode)

if __name__ == "__main__":
    main()
