"""
Forwarder kompatibilitas otomatis.
Skrip ini mengarahkan eksekusi ke lokasi baru: scripts/01_sync_siman.py
"""
import os
import sys
import subprocess

SCRIPT_PATH = os.path.join(os.path.dirname(__file__), 'scripts', '01_sync_siman.py')
cmd = [sys.executable, SCRIPT_PATH] + sys.argv[1:]
sys.exit(subprocess.call(cmd))
