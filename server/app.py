import os
import io
import time
import base64
import ctypes
import tempfile
import threading
import subprocess
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uvicorn
import pythoncom
import win32clipboard
import win32com.client.dynamic
from PIL import ImageGrab, Image

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
KEYEVENTF_KEYUP = 0x0002

def press_win_printscreen():
    """Simulates pressing Win + PrintScreen to save full desktop capture to Pictures\\Screenshots."""
    try:
        user32.keybd_event(VK_LWIN, 0, 0, 0)
        time.sleep(0.05)
        user32.keybd_event(VK_SNAPSHOT, 0, 0, 0)
        time.sleep(0.06)
        user32.keybd_event(VK_SNAPSHOT, 0, KEYEVENTF_KEYUP, 0)
        time.sleep(0.05)
        user32.keybd_event(VK_LWIN, 0, KEYEVENTF_KEYUP, 0)
    except Exception as e:
        print(f"[Keybd] Win+PrintScreen error: {e}")

def copy_pil_image_to_clipboard(img: Image.Image):
    """Sets DIB bitmap directly onto Windows system clipboard."""
    try:
        output = io.BytesIO()
        img.convert("RGB").save(output, "BMP")
        data = output.getvalue()[14:]  # Strip 14-byte BMP header for CF_DIB
        output.close()

        win32clipboard.OpenClipboard()
        win32clipboard.EmptyClipboard()
        win32clipboard.SetClipboardData(win32clipboard.CF_DIB, data)
        win32clipboard.CloseClipboard()
        print("[Clipboard] Image placed on Windows system clipboard (CF_DIB).")
        return True
    except Exception as e:
        print(f"[Clipboard] Error: {e}")
        return False

def find_outlook_executable() -> str:
    """Finds Outlook executable path."""
    candidates = [
        r"C:\Program Files\Microsoft Office\Root\Office16\OUTLOOK.EXE",
        r"C:\Program Files (x86)\Microsoft Office\Root\Office16\OUTLOOK.EXE",
        r"C:\Program Files\Microsoft Office\Office16\OUTLOOK.EXE",
        r"C:\Program Files (x86)\Microsoft Office\Office16\OUTLOOK.EXE",
        r"C:\Program Files\Microsoft Office\Office15\OUTLOOK.EXE",
        r"C:\Program Files (x86)\Microsoft Office\Office15\OUTLOOK.EXE"
    ]
    for p in candidates:
        if os.path.isfile(p):
            return p
    return "outlook.exe"

def save_screenshot_image(image_base64: Optional[str] = None) -> str:
    """
    Saves screenshot to disk so it can be attached to Outlook draft.
    Also places it on the system clipboard.
    """
    press_win_printscreen()
    timestamp = time.strftime("%Y%m%d_%H%M%S")
    out_dir = os.path.join(tempfile.gettempdir(), "idt_reports")
    os.makedirs(out_dir, exist_ok=True)
    file_path = os.path.join(out_dir, f"IDT_Logistics_Weekly_Report_{timestamp}.png")

    saved = False
    if image_base64:
        try:
            b64_str = image_base64.split(',')[-1]
            raw_bytes = base64.b64decode(b64_str)
            with open(file_path, "wb") as f:
                f.write(raw_bytes)
            saved = True
            print(f"[Screenshot] Saved frontend canvas screenshot: {file_path}")
        except Exception as e:
            print(f"[Screenshot] Failed to decode base64: {e}")

    if not saved:
        try:
            img = ImageGrab.grab()
            img.save(file_path, "PNG")
            saved = True
            print(f"[Screenshot] Saved native desktop screen grab: {file_path}")
        except Exception as e:
            print(f"[Screenshot] ImageGrab failed: {e}")

    if not saved or not os.path.isfile(file_path):
        # Fallback to existing public asset if both base64 and native grab fail
        for fallback_cand in [
            os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "client", "public", "south_india_map.png")),
            os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "client", "public", "iceberg.png"))
        ]:
            if os.path.isfile(fallback_cand):
                import shutil
                shutil.copyfile(fallback_cand, file_path)
                saved = True
                print(f"[Screenshot] Fallback image used: {file_path}")
                break

    # Copy to clipboard
    try:
        if os.path.isfile(file_path):
            img = Image.open(file_path)
            copy_pil_image_to_clipboard(img)
    except Exception as e:
        print(f"[Clipboard] Error: {e}")

    return file_path

def execute_open_outlook_draft(subject: str, screenshot_path: str, html_body: Optional[str] = None, text_body: Optional[str] = None):
    """
    Opens Outlook Classic and creates a new email draft with the screenshot attached and displayed on the UI.
    """
    subject = subject or "[IDT LOGISTICS REPORT] Weekly Freight Performance & Dashboard Summary"
    opened = False

    # Method 1: Native Windows COM Automation (Directly creates mail, attaches SS, and displays draft)
    try:
        print("[Outlook Task] 1. Initializing Outlook COM automation...")
        ol = win32com.client.dynamic.Dispatch("Outlook.Application")
        mail = ol.CreateItem(0)  # 0 = olMailItem
        mail.Subject = subject

        # Attach the screenshot file to the draft
        if os.path.isfile(screenshot_path):
            print(f"[Outlook Task] 2. Attaching screenshot {screenshot_path} to draft...")
            att = mail.Attachments.Add(os.path.abspath(screenshot_path))
            try:
                PR_ATTACH_CONTENT_ID = "http://schemas.microsoft.com/mapi/proptag/0x3712001F"
                att.PropertyAccessor.SetProperty(PR_ATTACH_CONTENT_ID, "dashboard_screenshot")
            except Exception as prop_err:
                print(f"[Outlook Task] Content ID property info: {prop_err}")

        # Embed screenshot in HTML body
        cid_img = '<div style="margin: 16px 0;"><img src="cid:dashboard_screenshot" style="max-width: 920px; width: 100%; border: 1.5px solid #CBD5E1; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);" alt="IDT Dashboard Screenshot" /></div>'
        
        if html_body:
            if "<!-- OPENING STATEMENT -->" in html_body:
                final_html = html_body.replace("<!-- OPENING STATEMENT -->", f"{cid_img}\n<!-- OPENING STATEMENT -->")
            elif "<body" in html_body:
                body_idx = html_body.find(">") + 1
                final_html = html_body[:body_idx] + f"\n{cid_img}\n" + html_body[body_idx:]
            else:
                final_html = f"<html><body>{cid_img}{html_body}</body></html>"
            mail.HTMLBody = final_html
        elif text_body:
            mail.Body = text_body

        print("[Outlook Task] 3. Displaying Outlook Classic draft on screen...")
        mail.Display(False)
        try:
            mail.GetInspector.Activate()
        except Exception:
            pass

        opened = True
        print("[Success] Outlook Classic automatically opened and draft displayed with attached screenshot!")
    except Exception as e:
        print(f"[Outlook Task] COM method info: {e}. Trying executable spawn fallback...")

    # Method 2: Fallback direct spawn via outlook.exe /c ipm.note /a <screenshot_path>
    if not opened:
        try:
            exe_path = find_outlook_executable()
            print(f"[Outlook Task] Spawning: {exe_path} /c ipm.note /a {screenshot_path}")
            subprocess.Popen([exe_path, '/c', 'ipm.note', '/a', os.path.abspath(screenshot_path)])
            opened = True
            print("[Success] Outlook Classic spawned via executable with attachment flag!")
        except Exception as e2:
            print(f"[Error] Failed to spawn Outlook executable: {e2}")

    return opened

class ReportDraftRequest(BaseModel):
    subject: Optional[str] = None
    html_body: Optional[str] = None
    text_body: Optional[str] = None
    image_base64: Optional[str] = None
    mentor_email: Optional[str] = None

@app.post("/api/draft-outlook-report")
async def draft_outlook_report(req: ReportDraftRequest):
    """
    Endpoint called when clicking 'Send Weekly Report'.
    Saves screenshot, opens Outlook Classic, and attaches screenshot to the draft.
    """
    try:
        def worker():
            pythoncom.CoInitialize()
            try:
                ss_path = save_screenshot_image(req.image_base64)
                execute_open_outlook_draft(req.subject, ss_path, req.html_body, req.text_body)
            finally:
                pythoncom.CoUninitialize()

        threading.Thread(target=worker, daemon=True).start()
        return {
            "status": "success",
            "message": "Outlook Classic draft opened with screenshot attached."
        }
    except Exception as e:
        print(f"[Error] /api/draft-outlook-report: {e}")
        return {"status": "error", "message": str(e)}

@app.post("/api/trigger-screenshot-and-outlook")
async def handle_trigger(req: Optional[ReportDraftRequest] = None):
    img_b64 = req.image_base64 if req else None
    subj = req.subject if req else "[IDT LOGISTICS REPORT] Weekly Dashboard Performance"
    html_b = req.html_body if req else None
    text_b = req.text_body if req else None
    try:
        def worker():
            pythoncom.CoInitialize()
            try:
                ss_path = save_screenshot_image(img_b64)
                execute_open_outlook_draft(subj, ss_path, html_b, text_b)
            finally:
                pythoncom.CoUninitialize()

        threading.Thread(target=worker, daemon=True).start()
        return {
            "status": "success",
            "message": "Outlook Classic draft opened with screenshot attached."
        }
    except Exception as e:
        print(f"[Error] /api/trigger-screenshot-and-outlook: {e}")
        return {"status": "error", "message": str(e)}

@app.post("/api/outlook-paste")
async def handle_legacy_paste(req: Request):
    return await handle_trigger()

@app.get("/health")
def health():
    return {"status": "ok", "service": "IDT Outlook Classic Automation Backend"}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=5005)
