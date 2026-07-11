import os
import urllib.request
import logging
from typing import Optional
from dotenv import load_dotenv

# Set up logging configuration
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("KokoroTTS")

# Load environment variables
load_dotenv()

MODEL_URL = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx"
VOICES_URL = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin"

# Cached model instance (Singleton)
_kokoro_instance: Optional['Kokoro'] = None

def _download_with_progress(url: str, destination: str):
    """
    Downloads a file with visual progress updates to the terminal console.
    """
    logger.info(f"Downloading required file: {url} -> {destination}")
    os.makedirs(os.path.dirname(destination), exist_ok=True)

    def progress_hook(block_num, block_size, total_size):
        if total_size > 0:
            percent = min(100, int(block_num * block_size * 100 / total_size))
            if percent % 10 == 0:
                downloaded_mb = (block_num * block_size) // (1024 * 1024)
                total_mb = total_size // (1024 * 1024)
                print(f"Downloading progress: {percent}% ({downloaded_mb}MB / {total_mb}MB)", end="\r")

    try:
        urllib.request.urlretrieve(url, destination, reporthook=progress_hook)
        print()  # Finalize carriage return line
        logger.info(f"File successfully saved: {destination}")
    except Exception as e:
        logger.error(f"Download failed: {e}")
        if os.path.exists(destination):
            os.remove(destination)
        raise

def get_kokoro_model() -> 'Kokoro':
    """
    Singleton wrapper to initialize and cache the Kokoro model instance.
    Checks and downloads model files automatically if missing.
    """
    global _kokoro_instance
    if _kokoro_instance is not None:
        return _kokoro_instance

    # Load paths from environment or default locations
    model_path = os.getenv("MODEL_PATH", "models/kokoro-v1.0.onnx")
    voices_path = os.getenv("VOICES_PATH", "models/voices-v1.0.bin")

    # Check and download Kokoro ONNX model weights
    if not os.path.exists(model_path):
        logger.warning(f"Model file not found at {model_path}. Starting automatic download...")
        _download_with_progress(MODEL_URL, model_path)

    # Check and download Kokoro voice embeddings binary
    if not os.path.exists(voices_path):
        logger.warning(f"Voice embedding binary not found at {voices_path}. Starting automatic download...")
        _download_with_progress(VOICES_URL, voices_path)

    # Import libraries inside the function to keep initial load latency low
    try:
        from kokoro_onnx import Kokoro
    except ImportError:
        logger.critical("Failed to import 'kokoro-onnx'. Ensure you have installed the requirements.")
        raise

    logger.info("Initializing Kokoro ONNX Model (first time loading)...")
    try:
        _kokoro_instance = Kokoro(model_path, voices_path)
        logger.info("Kokoro ONNX Model successfully initialized and cached.")
    except Exception as e:
        logger.error(f"Failed to instantiate Kokoro ONNX: {e}")
        raise

    return _kokoro_instance

def generate_speech(text: str, output_file: str, voice: str = "af_sarah") -> bool:
    """
    Generates offline Speech synthesis using the Kokoro ONNX model and saves it as a WAV file.

    Parameters:
        text (str): The input text to read.
        output_file (str): Absolute or relative file path to save the generated wav.
        voice (str): Voice ID from the model (e.g. af_sarah, af_bella, am_adam, bm_lewis).
    
    Returns:
        bool: True if generation succeeded, False otherwise.
    """
    logger.info(f"Requesting speech generation for voice: '{voice}'")
    if not text or not text.strip():
        logger.warning("Empty text string provided. Speech generation skipped.")
        return False

    try:
        # Resolve target folder for the output audio
        output_dir = os.path.dirname(output_file)
        if output_dir:
            os.makedirs(output_dir, exist_ok=True)

        # Get loaded model instance
        kokoro = get_kokoro_model()

        # Generate audio samples
        # For English, the language tag is 'en-us'
        logger.info(f"Synthesizing text: '{text[:40]}...'")
        samples, sample_rate = kokoro.create(
            text=text,
            voice=voice,
            speed=float(os.getenv("DEFAULT_SPEED", "1.0")),
            lang="en-us"
        )

        # Save to WAV format file
        import soundfile as sf
        sf.write(output_file, samples, sample_rate)
        logger.info(f"Successfully saved generated audio to: {output_file}")
        return True
    except Exception as e:
        logger.error(f"Error occurred during generate_speech(): {e}", exc_info=True)
        return False
