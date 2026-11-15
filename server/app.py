import os
import io
import time
import ctypes
import threading
import subprocess
import urllib.parse
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uvicorn
import win32clipboard
import pyautogui
from PIL import ImageGrab

app = FastAPI(title="IDT Dashboard Outlook Automation Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

user32 = ctypes.windll.user32

VK_LWIN = 0x5B
VK_SNAPSHOT = 0x2C
VK_TAB = 0x09
VK_CONTROL = 0x11
VK_V = 0x56
KEYEVENTF_KEYUP = 0x0002

def send_key_tap(vk_code: int):
    """Sends a hardware-level key press and release event."""
    user32.keybd_event(vk_code, 0, 0, 0)
    time.sleep(0.06)
    user32.keybd_event(vk_code, 0, KEYEVENTF_KEYUP, 0)
    time.sleep(0.06)

def set_clipboard_html(html_fragment: str, plain_text: Optional[str] = None):
    """
    Sets both CF_HTML and CF_UNICODETEXT on Windows system clipboard.
    Outlook and Office applications use CF_HTML to render actual formatted tables.
    """
    try:
        CF_HTML = win32clipboard.RegisterClipboardFormat('HTML Format')
        header_template = (
            'Version:0.9\r\n'
            'StartHTML:{start_html:08d}\r\n'
            'EndHTML:{end_html:08d}\r\n'
            'StartFragment:{start_frag:08d}\r\n'
            'EndFragment:{end_frag:08d}\r\n'
        )
        dummy = header_template.format(start_html=0, end_html=0, start_frag=0, end_frag=0)
        html_doc = f'<html><body><!--StartFragment-->{html_fragment}<!--EndFragment--></body></html>'
        
        start_html = len(dummy.encode('utf-8'))
        start_frag = start_html + len('<html><body><!--StartFragment-->'.encode('utf-8'))
        end_frag = start_frag + len(html_fragment.encode('utf-8'))
        end_html = start_html + len(html_doc.encode('utf-8'))
        
        full_payload = header_template.format(
            start_html=start_html,
            end_html=end_html,
            start_frag=start_frag,
            end_frag=end_frag
        ) + html_doc

        win32clipboard.OpenClipboard()
        try:
            win32clipboard.EmptyClipboard()
            win32clipboard.SetClipboardData(CF_HTML, full_payload.encode('utf-8'))
            if plain_text:
                win32clipboard.SetClipboardData(win32clipboard.CF_UNICODETEXT, plain_text)
        finally:
            win32clipboard.CloseClipboard()
            
        print("[Clipboard] Rich HTML and Plain-Text tables placed on Windows system clipboard.")
        return True
    except Exception as e:
        print(f"[Error] Failed to set clipboard HTML: {e}")
        return False

def execute_search_open_outlook_and_draft(subject: str, html_body: str, text_body: str):
    """
    Searches and opens Outlook Classic on the user's laptop:
    1. Sets Windows system clipboard with rich HTML tables & plain-text summary.
    2. Opens Windows Start menu -> searches 'outlook' -> launches Outlook.
    3. Triggers 'New Email' (Ctrl+N), navigates to the body, and pastes (Ctrl+V) the rich tables.
    """
    print("[Outlook Task] 1. Placing report tables on Windows clipboard...")
    set_clipboard_html(html_body, text_body)

    # Launch or search for Outlook Classic
    time.sleep(0.3)
    print("[Outlook Task] 2. Searching Windows for Outlook Classic...")
    try:
        # Check direct launch first
        subprocess.Popen(['outlook.exe', '/c', 'ipm.note'], shell=True)
        print("[Outlook Task] Direct outlook.exe spawn invoked.")
    except Exception as e:
        print(f"[Outlook Task] Direct spawn info: {e}")

    # Also simulate Windows Start Search to guarantee Outlook opens on any laptop configuration
    try:
        time.sleep(0.4)
        pyautogui.press('win')
        time.sleep(0.4)
        print("[Outlook Task] Typing 'outlook' into Windows Start...")
        pyautogui.write('outlook', interval=0.04)
        time.sleep(0.4)
        pyautogui.press('enter')
        print("[Outlook Task] Pressed Enter on Outlook.")
    except Exception as e:
        print(f"[Outlook Task] Keystroke automation info: {e}")

    # Wait for Outlook to load
    print("[Outlook Task] 3. Waiting 5.5s for Outlook Classic window...")
    time.sleep(5.5)

    # Click 'New Email' via shortcut Ctrl + N
    print("[Outlook Task] 4. Triggering New Mail compose (Ctrl + N)...")
    try:
        pyautogui.hotkey('ctrl', 'n')
        time.sleep(2.0)

        # Tab 3 times from 'To' field to the rich email body
        print("[Outlook Task] 5. Focusing Email Body...")
        for _ in range(3):
            send_key_tap(VK_TAB)
            time.sleep(0.2)

        # Paste rich HTML formatted tables into compose body
        print("[Outlook Task] 6. Pasting rich formatted report (Ctrl + V)...")
        time.sleep(0.3)
        pyautogui.hotkey('ctrl', 'v')
        print("[Success] Outlook Classic opened & report tables pasted into compose window!")
    except Exception as e:
        print(f"[Outlook Task] Compose navigation info: {e}")

class ReportDraftRequest(BaseModel):
    subject: str
    html_body: str
    text_body: str
    mentor_email: Optional[str] = None

@app.post("/api/draft-outlook-report")
async def draft_outlook_report(req: ReportDraftRequest):
    """
    Endpoint called when the user clicks 'Send Weekly Report' in top right.
    Searches and opens Outlook Classic on the laptop and drafts the complete report.
    """
    try:
        threading.Thread(
            target=execute_search_open_outlook_and_draft,
            args=(req.subject, req.html_body, req.text_body),
            daemon=True
        ).start()
        return {
            "status": "success",
            "message": "Outlook Classic search initiated and report tables copied to clipboard."
        }
    except Exception as e:
        print(f"[Error] /api/draft-outlook-report: {e}")
        return {"status": "error", "message": str(e)}

@app.post("/api/trigger-screenshot-and-outlook")
async def handle_legacy_trigger():
    return {"status": "ok", "message": "Deprecated screenshot trigger. Use /api/draft-outlook-report."}

@app.get("/health")
def health():
    return {"status": "ok", "service": "IDT Outlook Classic Automation Backend"}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=5005)
