Feature: Extract voice recording modal with teleprompter into a reusable submodule

  Background:
    Given the current voice recording and teleprompter components live at
      | filePath                                                                                                       | lines   |
      | components/forms/steppers/profile-form/steps/knowledge/voice/VoiceRecorderCore.tsx                            | 1-299   |
      | components/forms/steppers/profile-form/steps/knowledge/voice/CloneModal.tsx                                   | 1-72    |
      | components/forms/steppers/profile-form/steps/knowledge/voice/utils/Teleprompter.tsx                           | 1-155   |
      | components/forms/steppers/utils/voice/cloneModal.tsx (legacy alternative modal)                               | 1-227   |
      | components/forms/steppers/utils/voice/dynamicVoiceRecord.tsx (legacy dynamic modal)                           | 1-239   |

  Scenario: Create external/teleprompter-modal submodule and move modal + teleprompter
    Given a new folder "external/teleprompter-modal" exists
    And a new file "external/teleprompter-modal/VoiceRecorderCore.tsx" is created by copying
      "components/forms/steppers/profile-form/steps/knowledge/voice/VoiceRecorderCore.tsx" (lines 1-299)
    And a new file "external/teleprompter-modal/Teleprompter.tsx" is created by copying
      "components/forms/steppers/profile-form/steps/knowledge/voice/utils/Teleprompter.tsx" (lines 1-155)
    And a new file "external/teleprompter-modal/CloneModal.tsx" is created by copying
      "components/forms/steppers/profile-form/steps/knowledge/voice/CloneModal.tsx" (lines 1-72)
    And a new file "external/teleprompter-modal/index.ts" exports
      "export { default as VoiceRecorderCore } from './VoiceRecorderCore';\nexport { default as CloneModal } from './CloneModal';\nexport { default as Teleprompter } from './Teleprompter';"

    # Normalize asset and import paths
    When I update imports inside "external/teleprompter-modal/VoiceRecorderCore.tsx"
    Then replace
      "import VoiceClone from '@/public/lottie/RecordingButton.json';" with the same path under the app alias
    And replace
      "import Teleprompter, { type TeleprompterHandle } from './utils/Teleprompter';" with
      "import Teleprompter, { type TeleprompterHandle } from './Teleprompter';"

  Scenario: Replace in-app imports to use the new submodule
    Given any feature using the clone modal imports from
      "components/forms/steppers/profile-form/steps/knowledge/voice/CloneModal.tsx"
    When I switch to submodule imports
    Then replace with
      "import { CloneModal } from '@/external/teleprompter-modal';"
    And where the core component is used directly replace with
      "import { VoiceRecorderCore } from '@/external/teleprompter-modal';"

  Scenario: Teleprompter behavior parity
    Then Auto-scroll starts when recording starts and pauses when recording stops
    And `scrollToTop()` is called before a new recording
    And `showPauseResume` toggles scrolling state and updates focus styles
    And The highlighted line follows `currentIndex` based on `timing`

  Scenario: Modal behavior parity and a11y
    Then Lottie animation is paused initially and plays during recording
    And Recording enforces `minRecordingLength` and stops at `maxRecordingLength`
    And Preview audio auto-plays when a valid recording completes
    And Buttons include explicit `type="button"` where applicable to satisfy lint rules

  Scenario: Acceptance criteria
    Then TypeScript builds with no errors
    And Biome lints and formats cleanly
    And Clone Voice flow works identically after the refactor
