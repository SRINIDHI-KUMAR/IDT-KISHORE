import io
import time
import ctypes
import threading
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import win32clipboard
import pyautogui
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

def press_win_printscreen():
    """Simulates pressing Win + PrintScreen at the hardware keyboard level."""
    print("[Action] 1. Pressing Win + PrintScreen...")
    user32.keybd_event(VK_LWIN, 0, 0, 0)
    time.sleep(0.06)
    user32.keybd_event(VK_SNAPSHOT, 0, 0, 0)
    time.sleep(0.08)
    user32.keybd_event(VK_SNAPSHOT, 0, KEYEVENTF_KEYUP, 0)
    time.sleep(0.06)
    user32.keybd_event(VK_LWIN, 0, KEYEVENTF_KEYUP, 0)
    time.sleep(0.1)

def copy_native_screen_to_clipboard():
    """Grabs full native desktop screen and places DIB bitmap onto Windows clipboard."""
    try:
        img = ImageGrab.grab()
        output = io.BytesIO()
        img.convert("RGB").save(output, "BMP")
        data = output.getvalue()[14:]  # Strip 14-byte BMP header for CF_DIB
        output.close()

        win32clipboard.OpenClipboard()
        win32clipboard.EmptyClipboard()
        win32clipboard.SetClipboardData(win32clipboard.CF_DIB, data)
        win32clipboard.CloseClipboard()
        print("[Clipboard] Screen successfully copied to Windows system clipboard.")
        return True
    except Exception as e:
        print(f"[Error] Failed to copy screen to clipboard: {e}")
        return False

def execute_screenshot_and_open_outlook():
    """
    1. Presses Win + PrintScreen and copies image to clipboard.
    2. Opens Windows Start -> Types 'outlook' -> Presses Enter.
    3. Waits for Outlook to load and presses Ctrl + N (Clicks 'New' mail).
    4. Navigates to email body and pastes screenshot (Ctrl + V).
    """
    # 1. Take native screenshot via Win + PrintScreen and copy to clipboard
    press_win_printscreen()
    copy_native_screen_to_clipboard()

    # 2. Open Start Menu, type outlook, press enter
    time.sleep(0.4)
    print("[Action] 2. Pressing Windows Key...")
    pyautogui.press('win')

    time.sleep(0.4)
    print("[Action] 3. Typing 'outlook'...")
    pyautogui.write('outlook', interval=0.04)

    time.sleep(0.4)
    print("[Action] 4. Pressing Enter to launch Outlook...")
    pyautogui.press('enter')

    # 3. Wait for Outlook App to open
    print("[Action] 5. Waiting 3.5s for Outlook App to open...")
    time.sleep(3.5)

    # 4. Click 'New' mail button via Ctrl + N shortcut
    print("[Action] 6. Triggering 'New' Mail (Ctrl + N)...")
    pyautogui.hotkey('ctrl', 'n')

    # 5. Wait for Compose editor to focus 'To' field
    time.sleep(1.8)
    print("[Action] 7. Navigating 3x Tab to Email Body...")
    for i in range(1, 4):
        send_key_tap(VK_TAB)
        time.sleep(0.2)

    # 6. Paste screenshot into body
    time.sleep(0.3)
    print("[Action] 8. Pasting screenshot (Ctrl + V) into email body...")
    pyautogui.hotkey('ctrl', 'v')

    print("[Success] Completed: Win+PrintScreen -> Outlook -> New Mail -> Auto-pasted.")

@app.post("/api/trigger-screenshot-and-outlook")
async def handle_trigger():
    try:
        # Run in background thread so HTTP response returns instantly to React
        threading.Thread(target=execute_screenshot_and_open_outlook, daemon=True).start()
        return {
            "status": "success",
            "message": "Win + PrintScreen triggered, Outlook opened, and New Mail clicked."
        }
    except Exception as e:
        print(f"[Error] in /api/trigger-screenshot-and-outlook: {e}")
        return {"status": "error", "message": str(e)}

@app.post("/api/outlook-paste")
async def handle_legacy_paste(req: Request):
    """Fallback endpoint."""
    return await handle_trigger()

@app.get("/health")
def health():
    return {"status": "ok", "service": "IDT Outlook Automation Backend"}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=5005)
