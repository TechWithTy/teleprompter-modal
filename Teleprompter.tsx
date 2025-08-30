import type { ScriptLine } from "@/constants/_faker/_api/eleven_labs/scripts";
import React, {
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useState,
} from "react";

export interface TeleprompterProps {
  scriptText: ScriptLine[];
  isScrolling: boolean;
  scrollSpeed?: number;
  className?: string;
  paused?: boolean;
  onPauseChange?: (paused: boolean) => void;
  showPauseResume?: boolean;
}

export interface TeleprompterHandle {
  scrollToTop: () => void;
  scrollToBottom: () => void;
}

const Teleprompter = forwardRef<TeleprompterHandle, TeleprompterProps>(
  (
    {
      scriptText,
      isScrolling,
      scrollSpeed = 2000,
      className = "",
      onPauseChange,
      showPauseResume,
    },
    ref,
  ) => {
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [elapsed, setElapsed] = useState(0);

    useImperativeHandle(ref, () => ({
      scrollToTop: () => {
        setCurrentIndex(0);
        setElapsed(0);
      },
      scrollToBottom: () => {
        setCurrentIndex(scriptText.length - 1);
        setElapsed(scriptText[scriptText.length - 1]?.timing || 0);
      },
    }));

    // Main timer effect: advances elapsed time while scrolling/recording
    useEffect(() => {
      if (!isScrolling || scriptText.length === 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        return;
      }
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setElapsed((prev) => prev + 0.2);
      }, 200);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }, [isScrolling, scriptText.length]);

    // Effect: update currentIndex based on elapsed time
    useEffect(() => {
      if (!scriptText.length) return;
      // Find the highest step whose timing <= elapsed
      let idx = 0;
      for (let i = 0; i < scriptText.length; i++) {
        if (scriptText[i].timing <= elapsed) {
          idx = i;
        } else {
          break;
        }
      }
      setCurrentIndex(idx);
    }, [elapsed, scriptText]);

    // Reset on new script
    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
      setCurrentIndex(0);
      setElapsed(0);
    }, [scriptText]);

    return (
      <div className="relative">
        {showPauseResume && (
          <button
            type="button"
            className=" -top-3 ute absolute rounded bg-blue-500 px-3 py-1 font-semibold text-white text-xs shadow hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
            style={{ transform: "translateY(-100%)" }}
            onClick={() => {
              onPauseChange?.(!isScrolling);
            }}
            aria-label={
              isScrolling ? "Pause Teleprompter" : "Resume Teleprompter"
            }
          >
            {isScrolling ? "Pause" : "Resume"}
          </button>
        )}
        <div
          className={`min-h-24 w-full overflow-y-auto border bg-white p-2 dark:border-gray-600 dark:bg-gray-900 ${className}`}
          style={{ height: "auto", maxHeight: "32rem" }}
          aria-label="Teleprompter transcript"
        >
          {scriptText.length > 0 ? (
            <ul className="space-y-2">
              {scriptText.map((line, idx) => (
                <li
                  // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                  key={idx}
                  ref={(el) => {
                    if (idx === currentIndex && el && isScrolling) {
                      el.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      });
                    }
                  }}
                  className={`rounded px-2 py-1 transition-colors duration-200 ${
                    idx === currentIndex
                      ? "border-blue-500 border-l-4 bg-blue-50 font-bold text-blue-700 shadow dark:bg-blue-950 dark:text-blue-200"
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-blue-700 text-lg leading-snug dark:text-blue-300">
                      {line.title}
                    </span>
                    <span className="ml-2 rounded bg-blue-100 px-2 py-0.5 align-middle font-normal text-blue-700 text-xs">
                      {line.timing}s
                    </span>
                  </div>
                  <div className="mt-1 whitespace-pre-line text-base">
                    {line.text}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center text-gray-400">End of script</div>
          )}
        </div>
      </div>
    );
  },
);

export default Teleprompter;
