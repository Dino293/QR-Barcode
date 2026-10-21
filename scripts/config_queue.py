"""
Konfigurasi Arsitektur RabbitMQ (CloudAMQP) & Mailtrap (SMTP Sandbox)
Sistem Inventarisasi & Pencetakan Barcode BMN - BPMP Provinsi Jambi
"""

import os

# Muat variabel dari .env jika ada di root proyek
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
if os.path.exists(env_path):
    try:
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    k, v = line.split('=', 1)
                    os.environ.setdefault(k.strip(), v.strip())
    except Exception:
        pass

# 1. RabbitMQ CloudAMQP Configuration
RABBITMQ_URL = os.getenv(
    "RABBITMQ_URL",
    "amqps://vvyocvyd:8KDgt2Xoq5DFbnKOo9xQWlRmUf5CatJd@armadillo.rmq.cloudamqp.com/vvyocvyd"
)
QUEUE_NAME = os.getenv("QUEUE_NAME", "bmn_tasks")

# 2. Mailtrap SMTP Configuration
SMTP_HOST = os.getenv("SMTP_HOST", "sandbox.smtp.mailtrap.io")
SMTP_PORT = int(os.getenv("SMTP_PORT", "2525"))
SMTP_USER = os.getenv("SMTP_USER", "250ddce561818d")
SMTP_PASS = os.getenv("SMTP_PASS", "e5fd7ece0032a6")

# 3. Email Settings
DEFAULT_SENDER = os.getenv("DEFAULT_SENDER", "sistem-bmn@bpmpjambi.kemdikbud.go.id")
DEFAULT_RECEIVER = os.getenv("DEFAULT_RECEIVER", "muhindra293@gmail.com")
