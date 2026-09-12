from pathlib import Path

import yaml

CONFIG_PATH = Path(__file__).resolve().parent.parent / "config" / "game_config.yaml"


def load_game_config() -> dict:
    with open(CONFIG_PATH, "r") as f:
        return yaml.safe_load(f)


game_config = load_game_config()
