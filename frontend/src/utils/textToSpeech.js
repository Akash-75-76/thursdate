/**
 * Text-to-Speech utility using Web Speech API
 */

let currentUtterance = null;
let isSpeaking = false;

export const textToSpeechUtils = {
  /**
   * Speak the given text
   * @param {string} text - Text to speak
   * @param {function} onStart - Callback when speaking starts
   * @param {function} onEnd - Callback when speaking ends
   */
  speak: (text, onStart = null, onEnd = null) => {
    // Cancel any existing speech
    textToSpeechUtils.stop();

    // Check browser support
    const SpeechSynthesisUtterance = window.SpeechSynthesisUtterance;
    if (!SpeechSynthesisUtterance) {
      console.warn('Text-to-Speech not supported in this browser');
      alert('Your browser does not support text-to-speech.');
      return;
    }

    currentUtterance = new SpeechSynthesisUtterance(text);
    currentUtterance.rate = 1; // Normal speed
    currentUtterance.pitch = 1;
    currentUtterance.volume = 1;

    currentUtterance.onstart = () => {
      isSpeaking = true;
      if (onStart) onStart();
    };

    currentUtterance.onend = () => {
      isSpeaking = false;
      if (onEnd) onEnd();
    };

    currentUtterance.onerror = (e) => {
      console.error('Speech synthesis error:', e);
      isSpeaking = false;
      if (onEnd) onEnd();
    };

    window.speechSynthesis.cancel(); // Clear any pending utterance
    window.speechSynthesis.speak(currentUtterance);
  },

  /**
   * Stop speaking
   */
  stop: () => {
    window.speechSynthesis.cancel();
    currentUtterance = null;
    isSpeaking = false;
  },

  /**
   * Check if currently speaking
   */
  isSpeaking: () => isSpeaking,

  /**
   * Pause speaking
   */
  pause: () => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
    }
  },

  /**
   * Resume speaking
   */
  resume: () => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  }
};
