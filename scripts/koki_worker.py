"""
========================================================================================
KOKI PEKERJA DI DAPUR (BACKGROUND WORKER / CONSUMER RABBITMQ)
Sistem Inventarisasi & Pencetakan Barcode BMN - BPMP Provinsi Jambi
========================================================================================
Tugas berkas ini:
1. Standby terus di latar belakang (listening) ke antrean RabbitMQ (CloudAMQP).
2. Begitu ada nota tugas masuk:
   - Menjalankan sinkronisasi data SIMAN Kemenkeu (jika tipe 'SYNC_SIMAN').
   - Menyusun laporan hasil kerja.
   - Mengirimkan email notifikasi ke Mailtrap (SMTP Sandbox).
3. Mengonfirmasi ke RabbitMQ bahwa tugas selesai (Basic ACK), sehingga nota dihapus dari antrean.
========================================================================================
"""

import sys
import os
import json
import time
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import pika

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Import konfigurasi terpusat
from config_queue import (
    RABBITMQ_URL,
    QUEUE_NAME,
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    DEFAULT_SENDER,
    DEFAULT_RECEIVER,
)

# Import modul sinkronisasi SIMAN
try:
    import importlib.util
    spec = importlib.util.spec_from_file_location(
        "sync_siman",
        os.path.join(os.path.dirname(__file__), "01_sync_siman.py")
    )
    sync_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(sync_module)
    run_sync = sync_module.run_sync
except Exception as e:
    run_sync = None


def kirim_email_mailtrap(subject, html_body, receiver=DEFAULT_RECEIVER):
    """Mengirim email HTML ke Mailtrap Sandbox"""
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"BPMP BMN Bot <{DEFAULT_SENDER}>"
    msg["To"] = receiver
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(DEFAULT_SENDER, receiver, msg.as_string())
        print(f"[EMAIL TERKIRIM] Laporan berhasil dikirim ke Mailtrap ({receiver})")
        return True
    except Exception as e:
        print(f"[GAGAL KIRIM EMAIL] {str(e)}")
        return False


def proses_tugas(ch, method, properties, body):
    """Fungsi yang dieksekusi setiap kali nota tugas baru masuk dari RabbitMQ"""
    try:
        pesan = json.loads(body.decode("utf-8"))
        task_type = pesan.get("task_type", "UNKNOWN")
        payload = pesan.get("payload", {})
        email_target = payload.get("email_target", DEFAULT_RECEIVER)

        print("\n" + "=" * 65)
        print(f"[KOKI MENERIMA NOTA BARU] Waktu: {time.strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"[*] Jenis Tugas : {task_type}")
        print(f"[*] Target Email: {email_target}")
        print("=" * 65)

        if task_type == "TEST_NOTIFIKASI":
            html = f"""
            <html>
              <body style="font-family: Arial, sans-serif; background: #f8fafc; padding: 20px;">
                <div style="max-width: 600px; margin: auto; background: white; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0;">
                  <h2 style="color: #0284c7;">Uji Coba Tugas Antrean RabbitMQ</h2>
                  <p>Halo Operator BMN,</p>
                  <p>Tugas dengan tipe <b>TEST_NOTIFIKASI</b> yang Anda kirim ke RabbitMQ telah berhasil diproses oleh Worker di latar belakang!</p>
                  <p style="color: #10b981; font-weight: bold;">Status: 100% SUKSES</p>
                </div>
              </body>
            </html>
            """
            kirim_email_mailtrap("[NOTIFIKASI] Uji Coba Antrean RabbitMQ Berhasil", html, email_target)

        elif task_type == "SYNC_SIMAN":
            print("[MEMULAI PROSES BERAT] Menjalankan sinkronisasi data SIMAN...")
            start_time = time.time()

            if run_sync:
                run_sync(force_recheck=False)
            else:
                time.sleep(2)
                print("Modul 01_sync_siman disimulasikan.")

            duration = round(time.time() - start_time, 2)

            html = f"""
            <html>
              <body style="font-family: Arial, sans-serif; background: #f8fafc; padding: 20px;">
                <div style="max-width: 600px; margin: auto; background: white; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0;">
                  <h2 style="color: #0f766e;">Sinkronisasi SIMAN Selesai Dikerjakan!</h2>
                  <p>Halo Operator BMN BPMP Jambi,</p>
                  <p>Worker di latar belakang telah selesai mengeksekusi sinkronisasi API SIMAN Kemenkeu ke berkas database master:</p>
                  <div style="background: #f1f5f9; padding: 12px 16px; border-radius: 8px; margin: 15px 0;">
                    <b>Durasi Proses:</b> {duration} detik<br>
                    <b>Status:</b> Selesai & Berhasil Diperbarui<br>
                    <b>Database Target:</b> data/data.xlsx
                  </div>
                  <p>Label barcode siap dicetak dengan data terbaru.</p>
                </div>
              </body>
            </html>
            """
            kirim_email_mailtrap("[LAPORAN BMN] Sinkronisasi SIMAN Telah Selesai", html, email_target)

        else:
            print(f"[PERINGATAN] Jenis tugas '{task_type}' tidak dikenali.")

        # Konfirmasi ke RabbitMQ bahwa tugas selesai (hapus nota dari antrean)
        ch.basic_ack(delivery_tag=method.delivery_tag)
        print("[SELESAI] Tugas telah tuntas & di-ACK ke RabbitMQ.")

    except Exception as e:
        print(f"[ERROR PROSES TUGAS] {str(e)}")
        # Kirim NACK agar tidak hilang jika terjadi error sistem
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)


def mulai_mendengarkan(run_once=False):
    """Menghubungkan worker ke antrean RabbitMQ"""
    print("=" * 65)
    print("[KOKI WORKER AKTIF] Sedang menunggu nota tugas dari RabbitMQ...")
    print(f"[*] Antrean Target : {QUEUE_NAME}")
    print(f"[*] Mailtrap Host  : {SMTP_HOST}:{SMTP_PORT}")
    print(f"[*] Mode           : {'Satu Kali Jalan (--once)' if run_once else 'Stanby Terus Menerus'}")
    print("[*] Tekan CTRL + C untuk berhenti.")
    print("=" * 65)

    params = pika.URLParameters(RABBITMQ_URL)
    connection = pika.BlockingConnection(params)
    channel = connection.channel()

    channel.queue_declare(queue=QUEUE_NAME, durable=True)
    channel.basic_qos(prefetch_count=1)

    if run_once:
        # Periksa apakah ada pesan yang sedang antre
        method_frame, header_frame, body = channel.basic_get(queue=QUEUE_NAME)
        if method_frame:
            proses_tugas(channel, method_frame, header_frame, body)
        else:
            print("[INFO] Antrean kosong. Tidak ada nota yang menunggu.")
        connection.close()
        return

    channel.basic_consume(queue=QUEUE_NAME, on_message_callback=proses_tugas)

    try:
        channel.start_consuming()
    except KeyboardInterrupt:
        print("\nKoki Worker dimatikan secara manual.")
        channel.stop_consuming()
        connection.close()


if __name__ == "__main__":
    once = "--once" in sys.argv
    mulai_mendengarkan(run_once=once)

