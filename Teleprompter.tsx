import { cn } from "@/lib/_utils";
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
						className="-top-3 absolute rounded bg-primary px-3 py-1 font-semibold text-primary-foreground text-xs shadow hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring"
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
					className={cn(
						"min-h-24 w-full overflow-y-auto border border-border bg-card p-2",
						className,
					)}
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
									className={cn(
										"rounded px-2 py-1 transition-colors duration-200",
										idx === currentIndex
											? "border-primary border-l-4 bg-primary/10 font-bold text-primary shadow"
											: "text-muted-foreground",
									)}
								>
									<div className="flex items-center gap-2">
										<span className="font-extrabold text-lg text-primary leading-snug">
											{line.title}
										</span>
										<span className="ml-2 rounded bg-primary/10 px-2 py-0.5 align-middle font-normal text-primary text-xs">
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
						<div className="text-center text-muted-foreground">
							End of script
						</div>
					)}
				</div>
			</div>
		);
	},
);

export default Teleprompter;
