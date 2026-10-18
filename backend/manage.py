"""Manage sonmic logins. Run from the project root:

    pnpm user add <username>      add a user, or change their password
    pnpm user remove <username>
    pnpm user list
"""

import getpass
import re
import sys

import auth


def ask_password(username: str) -> str:
    password = getpass.getpass(f"Password for {username}: ")
    if len(password) < 8:
        sys.exit("Use at least 8 characters.")
    if getpass.getpass("Repeat password: ") != password:
        sys.exit("Passwords didn't match.")
    return password


def main(argv: list[str]) -> None:
    auth.init_db()
    command, *args = argv or ["help"]

    if command == "add" and len(args) == 1:
        username = auth.normalize_username(args[0])
        if not re.fullmatch(r"[a-z0-9._-]+", username):
            sys.exit("Usernames can use letters, numbers, . _ and - only.")
        auth.set_user(username, ask_password(username))
        print(f"Saved {username}. Any devices they were logged in on will need to log in again.")
    elif command == "remove" and len(args) == 1:
        removed = auth.remove_user(args[0])
        print(f"Removed {args[0]}." if removed else f"No user named {args[0]}.")
    elif command == "list" and not args:
        users = auth.list_users()
        print("\n".join(users) if users else "No users yet. Add one with: pnpm user add <username>")
    else:
        print(__doc__)
        sys.exit(1)


if __name__ == "__main__":
    main(sys.argv[1:])
