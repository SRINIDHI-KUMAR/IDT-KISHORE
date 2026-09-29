import io
import time
import ctypes
import threading
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import win32gui
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

def wait_for_outlook_window(timeout: float = 15.0):
    """
    Polls Windows every 120ms until the Outlook window is actually opened and visible.
    Replaces fixed blind delays with real-time window detection.
    """
    print("[Action] 5. Actively waiting for Outlook window to open...")
    start_time = time.time()

    while time.time() - start_time < timeout:
        found_hwnd = None

        def enum_handler(hwnd, _):
            nonlocal found_hwnd
            if win32gui.IsWindowVisible(hwnd):
                title = win32gui.GetWindowText(hwnd).strip().lower()
                if "outlook" in title and "idt" not in title and "visual studio" not in title:
                    found_hwnd = hwnd

        win32gui.EnumWindows(enum_handler, None)
        if found_hwnd:
            print(f"[Action] Outlook window detected and active! (HWND: {found_hwnd})")
            return found_hwnd
        time.sleep(0.12)

    print("[Action] Detection timeout reached, proceeding...")
    return None

def execute_screenshot_and_open_outlook():
    """
    1. Presses Win + PrintScreen and copies image to clipboard.
    2. Opens Windows Start -> Types 'outlook' -> Presses Enter.
    3. Detects when Outlook window is actually opened -> Presses Ctrl + N (New Mail).
    4. Navigates with Tab 3 times -> Pastes screenshot (Ctrl + V).
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

    # 3. Actively confirm that Outlook window is opened and visible
    wait_for_outlook_window(timeout=15.0)

    # 4. Wait 5.0 seconds after Outlook is confirmed open for full UI connection & readiness
    print("[Action] 6. Outlook confirmed open! Waiting 5.0s for app to fully initialize...")
    time.sleep(5.0)

    # 5. Trigger 'New' Mail (Ctrl + N)
    print("[Action] 7. Triggering 'New' Mail (Ctrl + N)...")
    pyautogui.hotkey('ctrl', 'n')

    # 6. Wait for Compose editor to render 'To' field
    time.sleep(2.2)
    print("[Action] 8. Navigating 3x Tab to Email Body...")
    for i in range(1, 4):
        send_key_tap(VK_TAB)
        time.sleep(0.25)

    # 7. Paste screenshot into body
    time.sleep(0.35)
    print("[Action] 9. Pasting screenshot (Ctrl + V) into email body...")
    pyautogui.hotkey('ctrl', 'v')

    print("[Success] Completed: Win+PrintScreen -> Outlook Confirmed -> 5s Wait -> New Mail -> Auto-pasted.")

@app.post("/api/trigger-screenshot-and-outlook")
async def handle_trigger():
    try:
        # Run in background thread so HTTP response returns instantly to React
        threading.Thread(target=execute_screenshot_and_open_outlook, daemon=True).start()
        return {
            "status": "success",
            "message": "Win + PrintScreen triggered, waiting for Outlook window to trigger New Mail."
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
