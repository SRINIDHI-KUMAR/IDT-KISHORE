import io
import time
import base64
import threading
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import win32clipboard
import pyautogui
from PIL import Image

app = FastAPI(title="IDT Dashboard Outlook Automation Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
        print("[Clipboard] Successfully set screenshot to Windows system clipboard.")
        return True
    except Exception as e:
        print(f"[Error] Failed to set clipboard image: {e}")
        return False

def open_outlook_via_windows_search():
    """
    Presses Win key, types 'outlook', and presses Enter.
    """
    time.sleep(0.3)
    print("[Action] 1. Pressing Windows Key...")
    pyautogui.press('win')
    
    time.sleep(0.4)
    print("[Action] 2. Typing 'outlook'...")
    pyautogui.write('outlook', interval=0.04)
    
    time.sleep(0.4)
    print("[Action] 3. Pressing Enter...")
    pyautogui.press('enter')
    
    print("[Success] Windows search -> 'outlook' -> Enter completed.")

@app.post("/api/outlook-paste")
async def handle_outlook_paste(req: Request):
    try:
        payload = await req.json()
        raw_b64 = payload.get("image", "")

        if "," in raw_b64:
            raw_b64 = raw_b64.split(",", 1)[1]
        
        img_bytes = base64.b64decode(raw_b64)
        copied = copy_image_to_clipboard(img_bytes)

        # Trigger Win key -> 'outlook' -> Enter
        threading.Thread(target=open_outlook_via_windows_search, daemon=True).start()

        return {
            "status": "success",
            "clipboard_set": copied,
            "message": "Screenshot copied to clipboard. Pressing Win -> typing outlook -> Enter."
        }
    except Exception as e:
        print(f"[Error] in /api/outlook-paste: {e}")
        return {"status": "error", "message": str(e)}

@app.get("/health")
def health():
    return {"status": "ok", "service": "IDT Outlook Automation Backend"}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=5005)
