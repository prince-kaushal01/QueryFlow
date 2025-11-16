import os
import imaplib
import email
from email.header import decode_header
import html
import re
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter
from supabase import create_client, Client

router = APIRouter()

# -----------------------------
# READ ENV (loaded in main.py)
# -----------------------------
IMAP_HOST = os.getenv("IMAP_HOST")
IMAP_USER = os.getenv("IMAP_USER")
IMAP_PASSWORD = os.getenv("IMAP_PASSWORD")
MAILBOX = os.getenv("IMAP_MAILBOX", "INBOX")
CHECK_INTERVAL_SECONDS = int(os.getenv("CHECK_INTERVAL_SECONDS", 300))

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_TABLE = "queries"

print("DEBUG inside email_parser:", IMAP_USER, SUPABASE_URL)

if not all([IMAP_USER, IMAP_PASSWORD, SUPABASE_URL, SUPABASE_KEY]):
    raise RuntimeError("Set IMAP_USER, IMAP_PASSWORD, SUPABASE_URL, SUPABASE_KEY in .env")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# -----------------------------
# HELPERS
# -----------------------------
QUERY_KEYWORDS = [
    "query", "question", "support", "help", "issue", "bug", "error",
    "request", "ticket", "problem", "customer", "inquiry", "complaint", "trouble"
]

def is_query_email(subject: Optional[str], body: Optional[str]) -> bool:
    text = ((subject or "") + " " + (body or "")).lower()
    return any(kw in text for kw in QUERY_KEYWORDS)

def decode_mime_words(s):
    if not s:
        return ""
    decoded = []
    for part, encoding in decode_header(s):
        if isinstance(part, bytes):
            decoded.append(part.decode(encoding or "utf-8", errors="ignore"))
        else:
            decoded.append(part)
    return "".join(decoded)

def extract_body(msg):
    if msg.is_multipart():
        for part in msg.walk():
            if part.get_content_type() == "text/plain":
                return part.get_payload(decode=True).decode("utf-8", errors="ignore")
        for part in msg.walk():
            if part.get_content_type() == "text/html":
                html_body = part.get_payload(decode=True).decode("utf-8", errors="ignore")
                return re.sub("<[^<]+?>", "", html.unescape(html_body))
    else:
        payload = msg.get_payload(decode=True)
        if payload:
            return payload.decode("utf-8", errors="ignore")
    return ""

# -----------------------------
# MAIN EMAIL CHECK FUNCTION
# -----------------------------
import uuid
def fetch_and_process_emails():
    try:
        print(f"[{datetime.now(timezone.utc)}] Checking IMAP ...")
        mail = imaplib.IMAP4_SSL(IMAP_HOST)
        mail.login(IMAP_USER, IMAP_PASSWORD)
        mail.select(MAILBOX)
        new_id = str(uuid.uuid4())
        status, data = mail.search(None, "(UNSEEN)")
        msg_ids = data[0].split()

        print("Found", len(msg_ids), "new messages")

        for msg_id in msg_ids:
            _, msg_data = mail.fetch(msg_id, "(RFC822)")
            msg = email.message_from_bytes(msg_data[0][1])

            subject = decode_mime_words(msg.get("Subject", ""))
            sender = decode_mime_words(msg.get("From", ""))
            body = extract_body(msg)
            # type=
            # ---- If email contains query keywords ----
            if is_query_email(subject, body):

                now = datetime.now(timezone.utc).isoformat()

                record = {
                    "id": new_id,
                    "subject": subject or "No Subject",
                    "content": body or "",
                    "channel": "email",
                    "type": "bug_report",
                    "priority": "medium",
                    "status": "new",
                    "sender": sender,
                    "tags": ["email", "auto"],
                    "createdAt": now,
                    "updatedAt": now,
                    "history": [
                        {
                            "timestamp": now,
                            "action": "Query created from email",
                            "user": "system"
                        }
                    ],
                }

                supabase.table(SUPABASE_TABLE).insert(record).execute()

            # Mark as read
            mail.store(msg_id, "+FLAGS", "\\Seen")

        mail.logout()

    except Exception as e:
        print("Email fetch error:", e)

# -----------------------------
# ROUTE
# -----------------------------
@router.get("/health")
def health():
    return {"status": "ok", "email": IMAP_USER}
