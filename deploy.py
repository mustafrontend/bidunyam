#!/usr/bin/env python3
"""Deploy script: uploads SSH key, pulls latest code, runs docker compose."""
import paramiko
import os
import sys

HOST = "94.73.180.193"
USER = "root"
PASSWORD = "Cx0#Qi7#Iy3#Cw4!"
REPO_DIR = "/root/bidunyam"
PUB_KEY_PATH = os.path.expanduser("~/.ssh/id_ed25519.pub")
NGINX_SRC = f"{REPO_DIR}/deploy/nginx/bidunyam.com.conf"
NGINX_DEST = "/etc/nginx/sites-available/bidunyam.com.conf"

def run(client, cmd, label=""):
    print(f"\n{'─'*50}")
    print(f">>> {label or cmd[:80]}")
    stdin, stdout, stderr = client.exec_command(cmd, get_pty=True)
    out = stdout.read().decode(errors="replace")
    err = stderr.read().decode(errors="replace")
    if out.strip():
        print(out.strip())
    if err.strip():
        print("[stderr]", err.strip())
    return out, err

def main():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print(f"Connecting to {HOST}...")
    client.connect(HOST, username=USER, password=PASSWORD, timeout=30)
    print("Connected!")

    # 1. Add SSH public key
    if os.path.exists(PUB_KEY_PATH):
        with open(PUB_KEY_PATH) as f:
            pubkey = f.read().strip()
        run(client,
            f'mkdir -p ~/.ssh && '
            f'grep -qxF "{pubkey}" ~/.ssh/authorized_keys 2>/dev/null || echo "{pubkey}" >> ~/.ssh/authorized_keys && '
            f'chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys && echo "SSH key added"',
            "Upload SSH public key")

    # 2. Git pull
    run(client, f"cd {REPO_DIR} && git pull origin main 2>&1", "git pull")

    # 3. Docker compose build & up
    run(client,
        f"cd {REPO_DIR} && docker compose up --build -d 2>&1",
        "docker compose up --build -d")

    # 4. Show running containers
    run(client, "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'", "Running containers")

    # 5. Nginx config
    run(client,
        f'cp {NGINX_SRC} {NGINX_DEST} && '
        f'ln -sf {NGINX_DEST} /etc/nginx/sites-enabled/bidunyam.com.conf && '
        f'nginx -t && systemctl reload nginx && echo "Nginx OK"',
        "Nginx config deploy")

    client.close()
    print("\n✓ Deployment complete!")

if __name__ == "__main__":
    main()
