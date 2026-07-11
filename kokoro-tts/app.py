import os
import platform
import subprocess
import logging
from tts import generate_speech, logger as tts_logger

# Set up logging level for the CLI app
logger = logging.getLogger("KokoroApp")
logging.getLogger().setLevel(logging.INFO)

def play_audio(file_path: str):
    """
    Plays the audio file automatically in a cross-platform manner.
    Uses winsound on Windows (no dependencies needed),
    and falls back to standard shell player commands on Linux/macOS.
    """
    if not os.path.exists(file_path):
        logger.error(f"Audio file not found for playback: {file_path}")
        return

    system = platform.system().lower()
    logger.info("Playing generated speech...")
    try:
        if system == 'windows' or os.name == 'nt':
            import winsound
            winsound.PlaySound(file_path, winsound.SND_FILENAME)
        elif system == 'darwin':  # macOS
            subprocess.run(['afplay', file_path], check=True)
        else:  # Linux / other
            # Try aplay, paplay, or play (Sox)
            for cmd in ['aplay', 'paplay', 'play']:
                try:
                    subprocess.run([cmd, file_path], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
                    break
                except FileNotFoundError:
                    continue
            else:
                logger.warning("No command-line audio player (aplay, paplay, play) found. Audio playback skipped.")
    except Exception as e:
        logger.error(f"Error during audio playback: {e}")

def main():
    # Load defaults from environment variables
    current_voice = os.getenv("DEFAULT_VOICE", "af_sarah")
    output_audio_path = "audio/output.wav"

    print("\n" + "="*60)
    print("      KOKORO OFFLINE TEXT-TO-SPEECH SERVICE (CLI)")
    print("="*60)
    print(f" * Default Voice ID : {current_voice}")
    print(f" * Target Output file: {output_audio_path}")
    print(" * Commands:")
    print("   - Type text to synthesize and play automatically.")
    print("   - Type ':voice <voice_id>' to switch the active voice.")
    print("   - Type 'exit' or 'quit' to terminate.")
    print("="*60 + "\n")

    # Pre-load/download the model on startup so the first generation is fast
    print("Pre-loading local model files... Please wait...")
    try:
        from tts import get_kokoro_model
        get_kokoro_model()
        print("Model files successfully cached and loaded!\n")
    except Exception as e:
        print(f"\nCRITICAL: Failed to load model files: {e}")
        print("Please check your internet connection or paths.")
        return

    while True:
        try:
            user_input = input(f"\n[Kokoro TTS ({current_voice})] > ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\nExiting...")
            break

        if not user_input:
            continue

        # Command handling
        lowered_input = user_input.lower()
        if lowered_input in ['exit', 'quit']:
            print("Exiting local TTS service. Goodbye!")
            break

        if user_input.startswith(':voice'):
            parts = user_input.split(maxsplit=1)
            if len(parts) < 2:
                print("Error: Please specify a voice ID. Example: :voice am_adam")
            else:
                new_voice = parts[1].strip()
                current_voice = new_voice
                print(f"Switched voice to: '{current_voice}'")
            continue

        # Synthesis
        print(f"Generating speech...")
        success = generate_speech(
            text=user_input,
            output_file=output_audio_path,
            voice=current_voice
        )

        if success:
            play_audio(output_audio_path)
        else:
            print("Error: Speech synthesis failed. Check tts.log or application logs.")

if __name__ == "__main__":
    main()
