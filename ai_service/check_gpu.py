from __future__ import annotations

import torch


def main():
    print(f"torch version: {torch.__version__}")
    print(f"cuda available: {torch.cuda.is_available()}")
    print(f"cuda version: {torch.version.cuda}")
    print(f"device count: {torch.cuda.device_count()}")

    if torch.cuda.is_available():
        for index in range(torch.cuda.device_count()):
            print(f"device {index}: {torch.cuda.get_device_name(index)}")


if __name__ == "__main__":
    main()
