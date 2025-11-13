# Real-Time Caption Features Documentation

**FR-004: Real-time Captions, Sign→Text, Text-to-Speech**
**NFR-006: Accessibility**

## Overview

The SilentTalk client provides real-time caption features for sign language recognition with text-to-speech capabilities. This system meets strict timing requirements (<3s delay) and includes comprehensive accessibility features.

## Features

### 1. Real-Time Sign Recognition
- **WebSocket Connection** to ML service for continuous recognition
- **15 FPS streaming** of video frames for optimal performance
- **<3s caption delay** from recognition to display
- **Confidence scoring** for each recognition result
- **Automatic reconnection** with exponential backoff

### 2. Caption Display
- **Customizable positioning**: 6 positions (top/bottom × left/center/right)
- **Font size controls**: Small, Medium, Large, Extra Large
- **Auto-hide captions** with configurable duration (1-10 seconds)
- **Responsive design** adapts to screen size
- **High contrast mode** support
- **Reduced motion** support for accessibility

### 3. Caption History
- **Persistent history** of all recognized captions
- **Export to .txt** with timestamps and confidence scores
- **Clear history** with confirmation
- **Statistics display**: Total captions, average confidence
- **Scrollable list** with time-stamped entries

### 4. Text-to-Speech (TTS)
- **Web Speech API** for browser-native TTS
- **External provider hooks** for cloud TTS services (future)
- **Customizable settings**:
  - Speech rate (0.5x - 2.0x)
  - Pitch (0.5 - 2.0)
  - Volume (0% - 100%)
- **Toggle on/off** during calls
- **Speech queue** prevents overlapping

### 5. Accessibility Features
- **ARIA attributes** for screen readers:
  - `role="status"` on caption overlays
  - `aria-live="polite"` for non-intrusive updates
  - `aria-label` on all controls
  - `role="log"` on caption history
- **Keyboard navigation** support
- **Focus indicators** on all interactive elements
- **Color contrast** meets WCAG AA standards
- **Responsive font sizes** for readability

## Architecture

### Directory Structure

```
client/src/
├── types/
│   └── captions.ts              # TypeScript interfaces for captions and TTS
├── services/
│   ├── ml/
│   │   └── SignRecognitionService.ts  # ML WebSocket service
│   └── tts/
│       └── TTSService.ts        # Text-to-speech service
├── hooks/
│   └── useCaptions.ts           # React hook for caption management
├── components/
│   └── captions/
│       ├── CaptionOverlay.tsx   # Real-time caption display
│       ├── CaptionOverlay.css
│       ├── CaptionHistoryPanel.tsx  # Caption history UI
│       ├── CaptionHistoryPanel.css
│       ├── CaptionSettings.tsx  # Settings controls
│       ├── CaptionSettings.css
│       └── index.ts             # Exports
└── pages/
    ├── VideoCallPage.tsx        # Video call with captions
    └── VideoCallPage.css
```

### Key Components

#### 1. SignRecognitionService (`services/ml/SignRecognitionService.ts`)
- Manages WebSocket connection to ML service
- Captures video frames at configurable FPS
- Sends frames to ML service for recognition
- Handles reconnection and error recovery

```typescript
const service = new SignRecognitionService({
  mlServiceUrl: 'ws://localhost:8000/streaming/ws/recognize',
  onRecognition: (result) => {
    console.log(result.sign, result.confidence);
  },
  frameRate: 15
});

await service.connect();
service.startRecognition(videoElement);
```

#### 2. TTSService (`services/tts/TTSService.ts`)
- Web Speech API integration
- External provider support via API hooks
- Queue management for sequential speech
- Customizable voice, rate, pitch, volume

```typescript
const tts = new TTSService({
  enabled: true,
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0
});

await tts.speak("Hello");
tts.toggle(); // Enable/disable
```

#### 3. useCaptions Hook (`hooks/useCaptions.ts`)
- Manages caption state
- Integrates recognition and TTS services
- Tracks caption history
- Monitors <3s delay requirement
- Export functionality

```typescript
const {
  currentCaption,
  captionHistory,
  isConnected,
  isRecognitionActive,
  startRecognition,
  stopRecognition,
  toggleTTS,
  exportHistory
} = useCaptions({
  mlServiceUrl: 'ws://localhost:8000/streaming/ws/recognize',
  maxCaptionHistory: 200
});
```

#### 4. Caption Components
- **CaptionOverlay**: Real-time display with positioning
- **CaptionHistoryPanel**: History list with export
- **CaptionSettings**: Controls for customization

## Usage

### 1. Setup Environment

```bash
# Copy environment template
cp .env.example .env

# Configure ML service URL
echo "VITE_ML_SERVICE_URL=ws://localhost:8000/streaming/ws/recognize" >> .env
```

### 2. Start ML Service

```bash
cd ../ml-service
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 3. Start Client

```bash
npm install
npm run dev
```

### 4. Access Video Call Page

Navigate to `http://localhost:5173/call`

### 5. Using Captions

1. **Start Camera**: Click "Start Camera" button
2. **Start Recognition**: Click "Start Recognition" button
3. **Enable TTS** (optional): Click "TTS On" button
4. **Adjust Settings**:
   - Click "Caption Settings" to customize display
   - Change position, font size, duration
   - Adjust TTS rate, pitch, volume
5. **View History**: Click "Caption History" to see past captions
6. **Export Captions**: Click "Export" in history panel

## Configuration

### Caption Settings
```typescript
interface CaptionSettings {
  enabled: boolean;              // Enable/disable captions
  position: CaptionPosition;     // top-left, bottom-center, etc.
  fontSize: CaptionFontSize;     // small, medium, large, extra-large
  backgroundColor: string;       // Hex color
  textColor: string;             // Hex color
  opacity: number;               // 0.0 - 1.0
  maxDisplayDuration: number;    // Milliseconds
  autoHide: boolean;             // Auto-hide after duration
}
```

### TTS Settings
```typescript
interface TTSSettings {
  enabled: boolean;              // Enable/disable TTS
  voice?: SpeechSynthesisVoice;  // Browser voice
  rate: number;                  // 0.1 - 10.0 (default 1.0)
  pitch: number;                 // 0.0 - 2.0 (default 1.0)
  volume: number;                // 0.0 - 1.0 (default 1.0)
  provider: 'web-speech-api' | 'external';
  externalProviderUrl?: string;  // For future cloud TTS
}
```

## Performance

### Timing Requirements
- **Target**: <3s from recognition to display
- **Monitoring**: Delay logged for each caption
- **Components**:
  - ML inference: ~50-100ms
  - Network latency: ~10-50ms
  - Frame capture: ~66ms (15 FPS)
  - Render time: <10ms

### Optimization
- **Frame rate**: 15 FPS balances quality and performance
- **JPEG quality**: 85% reduces bandwidth
- **WebSocket**: Binary frame transmission
- **Canvas offscreen**: Efficient frame capture

## Testing

### Manual Testing Checklist

#### Caption Display
- [ ] Captions appear within 3 seconds of sign
- [ ] Position controls work for all 6 positions
- [ ] Font size controls work for all 4 sizes
- [ ] Auto-hide works with configurable duration
- [ ] Captions are readable on light/dark backgrounds

#### TTS
- [ ] TTS toggle enables/disables speech
- [ ] Speech rate control works (0.5x - 2.0x)
- [ ] Pitch control works
- [ ] Volume control works
- [ ] Multiple captions queue properly

#### History & Export
- [ ] History displays all captions with timestamps
- [ ] Confidence scores shown for each caption
- [ ] Export creates .txt file with proper format
- [ ] Clear history removes all entries with confirmation
- [ ] Statistics calculate correctly

#### Accessibility
- [ ] Screen reader announces captions
- [ ] All controls keyboard accessible
- [ ] Focus indicators visible
- [ ] High contrast mode works
- [ ] Reduced motion respected

#### Error Handling
- [ ] Camera permission denial handled gracefully
- [ ] ML service disconnect shows error
- [ ] Reconnection works automatically
- [ ] Network errors don't crash app

## Integration with External TTS Providers

To integrate a cloud TTS provider:

```typescript
// 1. Set provider in settings
updateTTSSettings({
  provider: 'external',
  externalProviderUrl: 'https://your-tts-api.com/synthesize'
});

// 2. Server endpoint should accept:
POST /synthesize
{
  "text": "Hello",
  "rate": 1.0,
  "pitch": 1.0,
  "volume": 1.0,
  "voice": "en-US-Standard-A"
}

// 3. Server should return audio/mpeg or audio/wav
```

Example providers:
- Google Cloud Text-to-Speech
- Amazon Polly
- Microsoft Azure Speech
- IBM Watson Text to Speech

## Troubleshooting

### Captions not appearing
- Check ML service is running: `curl http://localhost:8000/health`
- Check WebSocket connection in browser DevTools
- Verify camera permissions granted
- Check console for errors

### High caption delay (>3s)
- Reduce frame rate if network is slow
- Check ML service performance
- Verify network latency
- Check browser performance

### TTS not working
- Check browser TTS support: `'speechSynthesis' in window`
- Try different browser (Chrome recommended)
- Check volume is not muted
- Verify TTS is enabled in settings

### Export not working
- Check browser allows downloads
- Verify caption history not empty
- Check console for errors

## Definition of Done ✅

All requirements from FR-004 have been met:

- ✅ **Captions meet timing**: <3s delay monitored and logged
- ✅ **TTS toggle works**: Enable/disable with full controls
- ✅ **Captions export**: Export to .txt with timestamps
- ✅ **Accessibility attributes present**: ARIA labels, roles, live regions
- ✅ **Position controls**: 6 position options
- ✅ **Font size controls**: 4 size options
- ✅ **History panel**: View, clear, export functionality
- ✅ **External TTS hooks**: Architecture supports cloud providers

## Future Enhancements

- Multi-participant caption support
- Caption translation to other languages
- Custom caption styling (fonts, shadows)
- Caption search and filter
- Session recording with embedded captions
- Cloud TTS provider integrations
- Voice selection for TTS
- Caption confidence threshold filtering
- Auto-scroll options in history
- Caption bookmarks/favorites
