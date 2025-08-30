import type React from "react";
import VoiceRecorderCore from "./VoiceRecorderCore";
import { scriptCloneTextDefault } from "@/constants/_faker/_api/eleven_labs/scripts";

const MIN_RECORDING_LENGTH = 60;
const MAX_RECORDING_LENGTH = 120;

interface CloneModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (audioBlob: Blob) => void;
}

const CloneModal: React.FC<CloneModalProps> = ({ open, onClose, onSave }) => {
  if (!open) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={handleOverlayClick}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          onClose();
        }
      }}
      aria-modal="true"
    >
      <div className="w-full max-w-md" style={{ pointerEvents: "auto" }}>
        <VoiceRecorderCore
          open={open}
          onClose={onClose}
          onSave={onSave}
          minRecordingLength={MIN_RECORDING_LENGTH}
          maxRecordingLength={MAX_RECORDING_LENGTH}
          scriptText={scriptCloneTextDefault}
          showTeleprompter={true}
          modalTitle={"Clone Your Voice"}
          extraContent={
            <div className="mb-4 text-muted-foreground text-sm">
              <strong>Guidelines for best results:</strong>
              <ul className="mt-2 list-disc pl-5">
                Approximately 1-2 minutes of clear audio without any reverb,
                artifacts, or background noise of any kind is recommended. When
                we speak of “audio or recording quality,” we do not mean the
                codec, such as MP3 or WAV; we mean how the audio was captured
                <li className="mt-2">
                  <a
                    href="https://elevenlabs.io/docs/product-guides/voices/voice-cloning/instant-voice-cloning#record-at-least-1-minute-of-audio"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Read full documentation
                  </a>
                </li>
              </ul>
            </div>
          }
        />
      </div>
    </div>
  );
};

export default CloneModal;
