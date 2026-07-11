# Local Kokoro TTS Service

A fully offline, high-quality, local Text-to-Speech (TTS) service using the **Kokoro-82M ONNX model**. This project is optimized for low-latency voice generation suitable for local AI assistants, running entirely on CPU (or GPU) with zero cloud dependencies.

---

## Project Structure

```text
project/
│
├── models/             # Auto-downloaded model weights and voice embeds
├── audio/              # Generated WAV audio outputs
├── app.py              # Interactive terminal application and player
├── tts.py              # Core reusable speech generation module
├── requirements.txt    # Package dependencies
├── README.md           # This documentation
└── .env.example        # Configuration template
```

---

## System Requirements & Pre-requisites

Kokoro utilizes phonemization which requires **espeak-ng** installed on the host operating system.

### 1. Windows Installation
1. Download the latest `.msi` installer from [espeak-ng GitHub Releases](https://github.com/espeak-ng/espeak-ng/releases).
2. Run the installer.
3. Add the installation folder to your Windows system Environment variables `PATH`:
   - Typically: `C:\Program Files\eSpeak NG`
4. Verify by running `espeak-ng --version` in PowerShell/CMD.

### 2. Linux Installation (Ubuntu/Debian)
```bash
sudo apt-get update && sudo apt-get install -y espeak-ng
```

### 3. macOS Installation
```bash
brew install espeak-ng
```

---

## Installation Steps

### Step 1: Clone or Open Project
Navigate to the project root directory:
```bash
cd kokoro-tts
```

### Step 2: Create a Virtual Environment
We recommend using a Python virtual environment to manage dependencies:
```bash
# On Windows / Linux / macOS
python -m venv .venv
```

### Step 3: Activate the Virtual Environment
* **Windows (PowerShell):**
  ```powershell
  .venv\Scripts\Activate.ps1
  ```
* **Windows (CMD):**
  ```cmd
  .venv\Scripts\activate.bat
  ```
* **Linux / macOS:**
  ```bash
  source .venv/bin/activate
  ```

### Step 4: Install Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### Step 5: Configure Environment
Copy `.env.example` to `.env` and adjust variables if desired:
```bash
# Windows
copy .env.example .env

# Linux / macOS
cp .env.example .env
```

---

## Running the Application

Launch the interactive CLI tool:
```bash
python app.py
```

### Automatic Model Download
On the first run, if the model files are missing from the `models/` directory, the program will **automatically download** them:
1. `kokoro-v1.0.onnx` (~300MB) from GitHub releases.
2. `voices-v1.0.bin` (~20MB) from GitHub releases.

Once downloaded, the model will initialize in-memory and you can interact with it offline.

### CLI Usage
* **Synthesize Speech:** Type any text and press **Enter**. The program will synthesize speech and play the generated `.wav` file automatically.
* **Switch Active Voice:** Type `:voice <voice_id>` (e.g. `:voice am_adam`) to switch the voice.
* **Exit:** Type `exit` or `quit`.

---

## Integrating Kokoro with Another Python Application

To use Kokoro TTS in another module or project, simply import the `generate_speech` function:

```python
import os
from tts import generate_speech

# Set output path
output_path = "audio/assistant_reply.wav"

# Generate WAV audio
success = generate_speech(
    text="Hello, I am your local AI companion. How can I help you today?",
    output_file=output_path,
    voice="af_sarah"
)

if success:
    print(f"Speech saved to {output_path}")
    # Play or stream the audio using your application playbacks
else:
    print("Speech generation failed.")
```

---

## Supported Voices

Kokoro supports multiple high-quality voices. Below is a list of default built-in voice IDs:

| Voice ID | Description | Gender | Accent |
| :--- | :--- | :--- | :--- |
| **`af_sarah`** (Default) | Sarah | Female | American English (US) |
| **`af_bella`** | Bella | Female | American English (US) |
| **`af_sky`** | Sky | Female | American English (US) |
| **`af_heart`** | Heart | Female | American English (US) |
| **`am_adam`** | Adam | Male | American English (US) |
| **`am_michael`** | Michael | Male | American English (US) |
| **`bf_emma`** | Emma | Female | British English (UK) |
| **`bf_isabella`** | Isabella | Female | British English (UK) |
| **`bm_george`** | George | Male | British English (UK) |
| **`bm_lewis`** | Lewis | Male | British English (UK) |

### How to Change the Default Voice
To change the default voice across runs, modify the `DEFAULT_VOICE` variable inside your `.env` file:
```ini
DEFAULT_VOICE=am_adam
```

---

## Troubleshooting & FAQ

### Error: `FileNotFoundError: [Errno 2] No such file or directory: 'espeak-ng'`
**Cause:** The `espeak` tool is either not installed or not present in your system's Environment Variables `PATH`.
**Fix:** 
- **Windows**: Install the `.msi` from GitHub, then search "env" in Windows start menu -> Edit system environment variables -> double click `Path` under User/System variables -> click **New** -> add path to folder containing `espeak-ng.exe` (e.g. `C:\Program Files\eSpeak NG`) -> restart terminal.
- **Linux**: Install via `sudo apt-get install espeak-ng`.

### Slow Initial Generation / Startup Latency
**Cause:** The first execution download weights, and subsequent starts require parsing the ONNX binary into memory.
**Fix:** The model initialization is written as a cached Singleton, so it is loaded **only once** on startup. Future generations in the same session will run with sub-100ms latency.

### Audio is Stuttering or Static
**Cause:** Soundfile library writes 16-bit PCM WAV. Ensure your local audio playback rate matches `24000Hz` (Kokoro native output sample rate).
