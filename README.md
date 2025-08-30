# Teleprompter Modal

Teleprompter recording modal for React/Next.js: script scrolling, microphone capture, and themeable UI via design tokens. Keyboard accessible.

Website: https://www.cybershoptech.com

## Exports

```ts
import { CloneModal, Teleprompter, VoiceRecorderCore } from "@/external/teleprompter-modal";
```

## Usage

```tsx
import { useState } from "react";
import { CloneModal } from "@/external/teleprompter-modal";

export default function Example() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" onClick={() => setOpen(true)} className="rounded bg-primary px-3 py-2 text-primary-foreground">
        Open Teleprompter
      </button>
      <CloneModal
        open={open}
        onClose={() => setOpen(false)}
        onSave={(blob) => {
          console.log("saved", blob);
          setOpen(false);
        }}
      />
    </div>
  );
}
```

## Theming

Aligns with `_docs/features/ui/theming.md` using tokens like `bg-card`, `border-border`, `ring-ring`.

## License

MIT
