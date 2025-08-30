import type React from "react";
import { useEffect, useRef, useState } from "react";
import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import VoiceClone from "@/public/lottie/RecordingButton.json";
import Teleprompter, { type TeleprompterHandle } from "./Teleprompter";
import type { ScriptLine } from "@/constants/_faker/_api/eleven_labs/scripts";

interface VoiceRecorderCoreProps {
  open: boolean;
  onClose: () => void;
  onSave: (audioBlob: Blob) => void;
  minRecordingLength: number;
  maxRecordingLength: number; // ! Required max length in seconds
  scriptText?: ScriptLine[];
  showTeleprompter?: boolean;
  modalTitle: React.ReactNode;
  extraContent?: React.ReactNode;
}

const VoiceRecorderCore: React.FC<VoiceRecorderCoreProps> = ({
  open,
  onClose,
  onSave,
  minRecordingLength,
  maxRecordingLength,
  scriptText,
  showTeleprompter = false,
  modalTitle,
  extraContent,
}) => {
  // * Teleprompter auto-scroll state
  const [teleprompterScrolling, setTeleprompterScrolling] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [maxLengthReached, setMaxLengthReached] = useState<boolean>(false);
  // * Indicates if a valid recording is available for finishing
  const [showFinishButton, setShowFinishButton] = useState(false);
  // * Holds the blob URL for playback
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  // * Ref for auto-playing audio
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const lottieRef = useRef<LottieRefCurrentProps | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const teleprompterRef = useRef<TeleprompterHandle | null>(null);

  // Start/stop recording
  const handleRecordingToggle = async () => {
    if (isRecording) {
      stopRecording();
      setTeleprompterScrolling(false); // Stop auto-scroll when recording stops
    } else {
      try {
        // Always reset teleprompter to top when starting recording
        if (
          teleprompterRef.current &&
          typeof teleprompterRef.current.scrollToTop === "function"
        ) {
          teleprompterRef.current.scrollToTop();
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        startRecording(stream);
        setTeleprompterScrolling(true); // Start auto-scroll when recording starts
        lottieRef.current?.play();
      } catch {
        setRecordingError("Microphone access denied or unavailable.");
      }
    }
  };

  const startRecording = (stream: MediaStream) => {
    setIsRecording(true);
    setRecordingDuration(0);
    setRecordingError(null);
    setMaxLengthReached(false);
    audioChunksRef.current = [];
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.ondataavailable = (event) => {
      audioChunksRef.current.push(event.data);
    };
    mediaRecorder.start();
    recordingIntervalRef.current = setInterval(() => {
      setRecordingDuration((prev) => {
        if (prev + 1 >= maxRecordingLength) {
          setMaxLengthReached(true);
          setTeleprompterScrolling(false); // Stop auto-scroll at max duration
          stopRecording();
          return maxRecordingLength;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const stopRecording = () => {
    const mediaRecorder = mediaRecorderRef.current;
    if (mediaRecorder && mediaRecorder.state === "recording") {
      // Set onstop handler BEFORE stopping
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });
        if (recordingDuration >= minRecordingLength) {
          setRecordingError(null);
          if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
          }
          const url = URL.createObjectURL(audioBlob);
          setAudioUrl(url);
          setShowFinishButton(true);
        } else {
          setRecordingError(
            `Recording too short. Please record at least ${minRecordingLength} seconds.`,
          );
          setShowFinishButton(false);
          if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
            setAudioUrl(null);
          }
        }
      };
      mediaRecorder.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      lottieRef.current?.pause();
    }
  };

  // Pause Lottie at start
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    lottieRef.current?.goToAndStop(0, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Clean up audio URL on modal close
  useEffect(() => {
    if (!open && audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
  }, [open, audioUrl]);

  // Auto-play audio for preview
  useEffect(() => {
    if (audioUrl && showFinishButton && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  }, [audioUrl, showFinishButton]);

  const handleFinishRecording = () => {
    const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
    onSave(audioBlob);
    setShowFinishButton(false);
    setRecordingDuration(0);
    setMaxLengthReached(false);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          aria-label="Close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
            className="h-6 w-6"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        <h2 className="mb-2 text-center font-semibold text-gray-900 text-lg dark:text-gray-100">
          {modalTitle}
        </h2>
        {extraContent}
        <div className="mb-4 flex justify-center">
          <button
            type="button"
            onClick={handleRecordingToggle}
            className="outline-none focus:outline-none"
          >
            <Lottie
              lottieRef={lottieRef}
              animationData={VoiceClone}
              loop
              autoplay={false}
            />
          </button>
        </div>
        <div className="mb-2 text-center text-gray-700 dark:text-gray-200">
          Duration: {recordingDuration}s / {maxRecordingLength}s
        </div>
        {maxLengthReached && (
          <p className="mb-2 text-center font-semibold text-orange-600 text-sm">
            ! Maximum recording length reached. Recording stopped automatically.
          </p>
        )}
        {showTeleprompter && scriptText && (
          <Teleprompter
            ref={teleprompterRef}
            scriptText={scriptText}
            isScrolling={teleprompterScrolling}
            onPauseChange={setTeleprompterScrolling}
            scrollSpeed={2000}
            showPauseResume={isRecording}
          />
        )}
        {audioUrl && showFinishButton && (
          <div className="mb-2 flex flex-col items-center">
            <audio
              ref={audioRef}
              src={audioUrl}
              controls
              className="w-full"
              autoPlay
            >
              <track kind="captions" label="English captions" srcLang="en" />
            </audio>
            <span className="mt-1 text-gray-500 text-xs">
              Preview your recording before saving.
            </span>
            <button
              type="button"
              onClick={() => {
                if (audioUrl) URL.revokeObjectURL(audioUrl);
                setAudioUrl(null);
                setShowFinishButton(false);
                setRecordingDuration(0);
                setRecordingError(null);
              }}
              className="mt-2 w-full rounded bg-yellow-500 px-4 py-2 text-white hover:bg-yellow-600"
            >
              Re-record
            </button>
          </div>
        )}
        {!(audioUrl && showFinishButton) && (
          <button
            type="button"
            onClick={handleRecordingToggle}
            className={`mt-2 w-full rounded px-4 py-2 text-white ${
              isRecording
                ? "bg-red-600 hover:bg-red-700"
                : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            }`}
            disabled={!!audioUrl && !isRecording}
          >
            {isRecording ? "Stop Recording" : "Start Recording"}
          </button>
        )}
        {showFinishButton && (
          <button
            type="button"
            onClick={handleFinishRecording}
            className="mt-4 w-full rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          >
            Finish Recording
          </button>
        )}
        {recordingError && (
          <p className="mt-2 text-center text-red-500 text-sm">
            {recordingError}
          </p>
        )}
      </div>
    </div>
  );
};

export default VoiceRecorderCore;
