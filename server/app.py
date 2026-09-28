import io
import time
import base64
import ctypes
import threading
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import win32clipboard
from PIL import Image

app = FastAPI(title="IDT Dashboard Outlook Automation Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

user32 = ctypes.windll.user32

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

def send_ctrl_v():
    """Sends Ctrl+V hotkey at hardware level."""
    user32.keybd_event(VK_CONTROL, 0, 0, 0)
    time.sleep(0.06)
    user32.keybd_event(VK_V, 0, 0, 0)
    time.sleep(0.08)
    user32.keybd_event(VK_V, 0, KEYEVENTF_KEYUP, 0)
    time.sleep(0.06)
    user32.keybd_event(VK_CONTROL, 0, KEYEVENTF_KEYUP, 0)
    time.sleep(0.06)

def copy_image_to_clipboard(image_bytes: bytes):
    """Places raw bitmap data onto Windows clipboard in CF_DIB format."""
    try:
        img = Image.open(io.BytesIO(image_bytes))
        output = io.BytesIO()
        img.convert("RGB").save(output, "BMP")
        data = output.getvalue()[14:]  # Strip 14-byte BMP header for CF_DIB
        output.close()

        win32clipboard.OpenClipboard()
        win32clipboard.EmptyClipboard()
        win32clipboard.SetClipboardData(win32clipboard.CF_DIB, data)
        win32clipboard.CloseClipboard()
        print("[Clipboard] Successfully set image to Windows system clipboard.")
        return True
    except Exception as e:
        print(f"[Error] Failed to set clipboard image: {e}")
        return False

def auto_navigate_and_paste(delay: float = 4.0):
    """
    Waits for Outlook Compose to load in the current active Chrome window,
    presses Tab 3 times (To -> Cc -> Subject -> Body),
    and sends Ctrl+V to paste the screenshot directly into the email body.
    Leaves the browser window size and maximized state 100% untouched.
    """
    print(f"[Automation] Waiting {delay}s for Outlook Web Compose to load...")
    time.sleep(delay)

    # Press TAB 3 times with clear spacing
    for i in range(1, 4):
        print(f"[Automation] Pressing TAB ({i}/3)...")
        send_key_tap(VK_TAB)
        time.sleep(0.22)

    # Settle cursor into body editor and execute Paste (Ctrl + V)
    time.sleep(0.3)
    print("[Automation] Pasting screenshot (Ctrl + V) into Outlook message body...")
    send_ctrl_v()
    print("[Automation] Done! Screenshot successfully pasted into Outlook body.")

@app.post("/api/outlook-paste")
async def handle_outlook_paste(req: Request):
    try:
        payload = await req.json()
        raw_b64 = payload.get("image", "")
        delay = float(payload.get("delay", 4.0))

        if "," in raw_b64:
            raw_b64 = raw_b64.split(",", 1)[1]
        
        img_bytes = base64.b64decode(raw_b64)
        copied = copy_image_to_clipboard(img_bytes)

        # Launch background paste thread
        threading.Thread(target=auto_navigate_and_paste, args=(delay,), daemon=True).start()

        return {
            "status": "success",
            "clipboard_set": copied,
            "message": f"Clipboard set. Pressing 3x Tab and pasting in {delay}s."
        }
    except Exception as e:
        print(f"[Error] in /api/outlook-paste: {e}")
        return {"status": "error", "message": str(e)}

@app.get("/health")
def health():
    return {"status": "ok", "service": "IDT Outlook Automation Backend"}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=5005)

