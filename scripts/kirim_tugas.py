"""
========================================================================================
PENGIRIM NOTA TUGAS (PRODUCER RABBITMQ)
Sistem Inventarisasi & Pencetakan Barcode BMN - BPMP Provinsi Jambi
========================================================================================
Tugas berkas ini:
Mengirimkan nota perintah kerja (Task) ke dalam antrean RabbitMQ (CloudAMQP).
Website atau pengguna tidak perlu menunggu proses berat selesai; cukup kirim nota
dalam 0.5 detik, lalu antrean akan menyimpannya dengan aman untuk dikerjakan worker.
========================================================================================
"""

import sys
import json
import argparse
import pika
from config_queue import RABBITMQ_URL, QUEUE_NAME

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

def kirim_tugas(task_type, payload=None):
    if payload is None:
        payload = {}

    data_pesan = {
        "task_type": task_type,
        "payload": payload
    }
    pesan_json = json.dumps(data_pesan, indent=2)

    print("=" * 60)
    print(">>> [PRODUCER] MENGIRIM TUGAS KE ANTREAN RABBITMQ")
    print(f"[*] Jenis Tugas : {task_type}")
    print(f"[*] Antrean     : {QUEUE_NAME}")
    print("=" * 60)

    try:
        params = pika.URLParameters(RABBITMQ_URL)
        connection = pika.BlockingConnection(params)
        channel = connection.channel()

        # Pastikan antrean sudah ada dan bersifat durable (tahan restart)
        channel.queue_declare(queue=QUEUE_NAME, durable=True)

        # Kirim pesan ke antrean
        channel.basic_publish(
            exchange="",
            routing_key=QUEUE_NAME,
            body=pesan_json,
            properties=pika.BasicProperties(
                delivery_mode=2  # Pesan persisten
            )
        )

        connection.close()
        print("[BERHASIL] Nota tugas berhasil dimasukkan ke antrean RabbitMQ!")
        print(f"Detail Pesan:\n{pesan_json}")
        print("=" * 60)
        return True

    except Exception as e:
        print(f"[GAGAL] Gagal mengirim pesan ke RabbitMQ: {str(e)}")
        return False


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Kirim nota tugas ke RabbitMQ")
    parser.add_argument(
        "--tipe",
        type=str,
        default="SYNC_SIMAN",
        help="Jenis tugas: SYNC_SIMAN | LAPORAN_EMAIL | TEST_NOTIFIKASI"
    )
    parser.add_argument(
        "--email",
        type=str,
        default="muhindra293@gmail.com",
        help="Email penerima laporan"
    )
    args = parser.parse_args()

    kirim_tugas(args.tipe, {"email_target": args.email})
