"""
GRO10X Desktop Macro Runner for Google Flow & AI Generators
Uses Windows OS-level input hardware simulation — 100% reliable.
"""

import sys
import time
import os
import ctypes
from ctypes import wintypes
import tkinter as tk

# Fix Windows console encoding
try:
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
except Exception:
    pass

# Windows API Constants for hardware key events
VK_CONTROL = 0x11
VK_V = 0x56
VK_RETURN = 0x0D
KEYEVENTF_KEYUP = 0x0002

user32 = ctypes.windll.user32

def set_clipboard_text(text):
    """Sets the Windows system clipboard safely."""
    try:
        root = tk.Tk()
        root.withdraw()
        root.clipboard_clear()
        root.clipboard_append(text)
        root.update()
        root.destroy()
    except Exception:
        # Fallback via PowerShell clipboard
        import subprocess
        subprocess.run(["powershell", "-command", f"Set-Clipboard -Value @'\n{text}\n'@"], capture_output=True)

def send_paste():
    """Simulates physical Ctrl+V hardware keystroke."""
    # Ctrl down
    user32.keybd_event(VK_CONTROL, 0, 0, 0)
    time.sleep(0.06)
    # V down
    user32.keybd_event(VK_V, 0, 0, 0)
    time.sleep(0.06)
    # V up
    user32.keybd_event(VK_V, 0, KEYEVENTF_KEYUP, 0)
    time.sleep(0.06)
    # Ctrl up
    user32.keybd_event(VK_CONTROL, 0, KEYEVENTF_KEYUP, 0)

def send_enter():
    """Simulates physical Enter hardware keystroke."""
    time.sleep(0.3)
    user32.keybd_event(VK_RETURN, 0, 0, 0)
    time.sleep(0.06)
    user32.keybd_event(VK_RETURN, 0, KEYEVENTF_KEYUP, 0)

# Default 16 Spreads for PLA-14 (PlannerQueenGro)
DEFAULT_PROMPTS = [
    "3:4 portrait luxury botanical minimalist planner front cover for PlannerQueenGro, #8B5A7A on #FAF3E8 background, Playfair Display typography, Daily and Weekly Planners #1, ownership card.",
    "3:4 portrait 3-card morning, timeblock, and evening planning ritual walkthrough, clean vector cards, warm cream aesthetic.",
    "3:4 portrait 12-month calendar mini-grid matrix with quarterly focus blocks and annual important dates.",
    "3:4 portrait 4-quadrant 90-day sprint goal map with top 3 needle-mover outcomes and reward milestones.",
    "3:4 portrait 5-week un-dated open monthly calendar grid with upcoming bills and 5 monthly habit anchors.",
    "3:4 portrait 4 vertical day columns for Monday through Thursday with 6:00 AM - 9:00 PM hourly schedule and top 3 priorities.",
    "3:4 portrait vertical schedule for Friday to Sunday with 7-day meal planning and weekly win reflection.",
    "3:4 portrait detailed 6AM-9PM daily timeblock with Eisenhower priority triage and gratitude.",
    "3:4 portrait 2-column spread for morning energizer checklist and evening wind-down screen-off routine.",
    "3:4 portrait 20-row habit matrix with 31 circular check bubbles and shaded milestone dividers.",
    "3:4 portrait 3-phase milestone roadmap Foundation, Build, Launch with 15-point action checklist.",
    "3:4 portrait financial snapshot with fixed recurring bills checklist and variable daily expense thermometer.",
    "3:4 portrait 4-dimension wellness wheel Physical, Emotional, Mental, Spiritual with 15-min self-care ideas.",
    "3:4 portrait visual bookshelf tracker for 12 books with 5-star rating lines and takeaway notes.",
    "3:4 portrait 90-day outcome review with milestone checkpoint logs and contingency solution cards.",
    "3:4 portrait clean 5mm vector dot grid notes spread with minimalist botanical header and action items footer."
]

def load_prompts(filepath="prompts.txt"):
    if os.path.exists(filepath):
        with open(filepath, "r", encoding="utf-8") as f:
            lines = [line.strip() for line in f if line.strip() and not line.strip().startswith("#")]
        if lines:
            return lines
    return DEFAULT_PROMPTS

def countdown(seconds, label="Starting in"):
    for i in range(seconds, 0, -1):
        print(f"\r  [*] {label}: {i} second(s)... (Press Ctrl+C to abort) ", end="", flush=True)
        time.sleep(1)
    print("\r" + " " * 75 + "\r", end="", flush=True)

def main():
    print("=" * 68)
    print(" [GRO10X] OS-LEVEL MACRO RUNNER FOR GOOGLE FLOW / AI PLATFORMS")
    print("=" * 68)
    
    prompt_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "prompts_pla14.txt")
    prompts = load_prompts(prompt_file)
    delay_seconds = 35  # Increased to 35s to give Chrome GPU time to render without freezing
    
    print(f" Loaded {len(prompts)} prompts for SKU: PLA-14")
    print(f" Generation delay: {delay_seconds} seconds between prompts")
    print("=" * 68)
    print("\n Instructions:")
    print("  1. Switch to your Google Flow / AI Generator browser window.")
    print("  2. CLICK ONCE inside the prompt input box so your cursor is blinking.")
    print("  3. Relax — the macro will paste each prompt, hit Enter, and loop.\n")
    
    try:
        countdown(6, "Switch to Google Flow & Click the Prompt Box")
        
        print("\n>>> Macro Started! Processing queue...\n")
        
        for idx, prompt in enumerate(prompts, start=1):
            print(f"[{idx}/{len(prompts)}] Injecting: {prompt[:65]}...")
            
            # 1. Set Windows clipboard
            set_clipboard_text(prompt)
            time.sleep(0.3)
            
            # 2. Simulate hardware paste (Ctrl+V)
            send_paste()
            time.sleep(0.6)
            
            # 3. Simulate hardware Enter
            send_enter()
            print(f"      --> Submitted! Rendering in Google Flow...")
            
            # 4. Wait for render if not last prompt
            if idx < len(prompts):
                for remaining in range(delay_seconds, 0, -1):
                    print(f"\r      [..] Waiting {remaining}s for render before next prompt... ", end="", flush=True)
                    time.sleep(1)
                print("\r" + " " * 65 + "\r", end="", flush=True)
                
        print("\n" + "=" * 68)
        print(" ALL PROMPTS COMPLETED SUCCESSFULLY!")
        print("=" * 68)
        
    except KeyboardInterrupt:
        print("\n\n[!] Macro stopped by user (Emergency Abort).")

if __name__ == "__main__":
    main()
