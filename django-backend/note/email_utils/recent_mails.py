import imaplib
import email
from email.header import decode_header
import time
import os
from datetime import datetime
from note.models import LocalMessage, LocalMessageList


def connect_to_gmail(username, password):
    imap = imaplib.IMAP4_SSL("imap.gmail.com")
    imap.login(username, password)
    return imap

def get_latest_email_id(imap):
    imap.select("INBOX")
    _, message_numbers = imap.search(None, "ALL")
    return int(message_numbers[0].split()[-1])

def get_last_processed_id():
    if os.path.exists("last_processed_id.txt"):
        with open("last_processed_id.txt", "r") as f:
            return int(f.read().strip())
    return 0

def save_last_processed_id(email_id):
    with open("last_processed_id.txt", "w") as f:
        f.write(str(email_id))

def process_email(email_message):
    subject, encoding = decode_header(email_message["Subject"])[0]
    if isinstance(subject, bytes):
        subject = subject.decode(encoding if encoding else "utf-8")
    
    sender, encoding = decode_header(email_message.get("From"))[0]
    if isinstance(sender, bytes):
        sender = sender.decode(encoding if encoding else "utf-8")
    
    date_tuple = email.utils.parsedate_tz(email_message["Date"])
    if date_tuple:
        local_date = datetime.fromtimestamp(email.utils.mktime_tz(date_tuple))
        date = local_date.strftime("%Y-%m-%d %H:%M:%S")
    else:
        date = "Unknown"
    
    if email_message.is_multipart():
        for part in email_message.walk():
            if part.get_content_type() == "text/plain":
                body = part.get_payload(decode=True).decode()
                break
    else:
        body = email_message.get_payload(decode=True).decode()
    
    # Here you would typically add code to insert this data into your database
    print(f"New email: Subject: {subject}, From: {sender}, Date: {date}")
    print(f"Body preview: {body[:100]}...")
    print("=" * 50)

    # Placeholder for database insertion
    LocalMessage.objects.create(text=body, list=LocalMessageList.objects.get(slug="default"))

def check_for_new_emails(username, password, interval_seconds=60, reconnect_interval=3600):
    imap = None
    last_connect_time = 0
    
    while True:
        try:
            current_time = time.time()
            
            # Reconnect if it's time or if imap is None
            if imap is None or current_time - last_connect_time >= reconnect_interval:
                if imap:
                    try:
                        imap.logout()
                    except:
                        pass
                imap = connect_to_gmail(username, password)
                last_connect_time = current_time
                print("Reconnected to Gmail")
            
            last_processed_id = get_last_processed_id()
            latest_email_id = get_latest_email_id(imap)
            
            if latest_email_id > last_processed_id:
                print(f"Found {latest_email_id - last_processed_id} new email(s)")
                for email_id in range(last_processed_id + 1, latest_email_id + 1):
                    _, msg = imap.fetch(str(email_id), "(RFC822)")
                    for response in msg:
                        if isinstance(response, tuple):
                            email_message = email.message_from_bytes(response[1])
                            process_email(email_message)
                    
                    save_last_processed_id(email_id)
            else:
                print("No new emails")
            
            time.sleep(interval_seconds)
        except Exception as e:
            print(f"An error occurred: {e}")
            imap = None  # Force reconnection on next iteration
            time.sleep(interval_seconds)
