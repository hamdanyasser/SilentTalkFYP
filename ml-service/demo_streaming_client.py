"""
Live Streaming Sign Language Recognition Demo Client
Captures webcam video and sends frames to ML service via WebSocket
"""

import asyncio
import websockets
import cv2
import json
import argparse
import time
from datetime import datetime
import numpy as np


class StreamingRecognitionClient:
    """
    WebSocket client for real-time sign language recognition.
    Captures frames from webcam and streams to ML service.
    """

    def __init__(
        self,
        server_url: str = "ws://localhost:8000/streaming/ws/recognize",
        camera_id: int = 0,
        target_fps: int = 30,
        frame_width: int = 640,
        frame_height: int = 480
    ):
        """
        Initialize streaming client.

        Args:
            server_url: WebSocket server URL
            camera_id: Camera device ID
            target_fps: Target frames per second
            frame_width: Frame width
            frame_height: Frame height
        """
        self.server_url = server_url
        self.camera_id = camera_id
        self.target_fps = target_fps
        self.frame_width = frame_width
        self.frame_height = frame_height

        # Video capture
        self.cap = None
        self.websocket = None

        # State
        self.is_running = False
        self.session_id = None

        # Performance tracking
        self.frame_count = 0
        self.recognition_count = 0
        self.start_time = None

        # Display window
        self.window_name = "Sign Language Recognition - Live Stream"

    async def connect(self):
        """Connect to WebSocket server."""
        print(f"Connecting to {self.server_url}...")
        self.websocket = await websockets.connect(self.server_url)

        # Receive welcome message
        welcome = await self.websocket.recv()
        welcome_data = json.loads(welcome)

        self.session_id = welcome_data.get("session_id")
        print(f"Connected! Session ID: {self.session_id}")
        print(f"Message: {welcome_data.get('message')}")

    def init_camera(self):
        """Initialize camera capture."""
        print(f"Initializing camera {self.camera_id}...")
        self.cap = cv2.VideoCapture(self.camera_id)

        if not self.cap.isOpened():
            raise RuntimeError(f"Failed to open camera {self.camera_id}")

        # Set camera properties
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.frame_width)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.frame_height)
        self.cap.set(cv2.CAP_PROP_FPS, self.target_fps)

        print(f"Camera initialized: {self.frame_width}x{self.frame_height} @ {self.target_fps} FPS")

    async def send_frame(self, frame):
        """Send frame to server via WebSocket."""
        # Encode frame as JPEG
        _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
        frame_bytes = buffer.tobytes()

        # Send to server
        await self.websocket.send(frame_bytes)
        self.frame_count += 1

    async def receive_results(self):
        """Receive and process recognition results from server."""
        try:
            while self.is_running:
                # Receive message with timeout
                try:
                    message = await asyncio.wait_for(self.websocket.recv(), timeout=0.1)
                    data = json.loads(message)

                    message_type = data.get("type")

                    if message_type == "recognition":
                        self.recognition_count += 1
                        self._handle_recognition(data)

                    elif message_type == "stats":
                        self._handle_stats(data)

                    elif message_type == "error":
                        print(f"Error: {data.get('error')}")

                except asyncio.TimeoutError:
                    continue

        except websockets.exceptions.ConnectionClosed:
            print("Connection closed by server")
            self.is_running = False

    def _handle_recognition(self, data):
        """Handle recognition result."""
        sign = data.get("sign")
        confidence = data.get("confidence", 0.0)
        timestamp = data.get("timestamp")
        inference_time = data.get("inference_time_ms", 0.0)
        handedness = data.get("handedness", "Unknown")

        # Print result
        if sign:
            print(f"\n[{timestamp}]")
            print(f"  Sign: {sign}")
            print(f"  Confidence: {confidence:.2%}")
            print(f"  Handedness: {handedness}")
            print(f"  Inference: {inference_time:.2f}ms")

            # Print all predictions
            all_preds = data.get("all_predictions", [])
            if len(all_preds) > 1:
                print("  Top predictions:")
                for i, pred in enumerate(all_preds[:3], 1):
                    print(f"    {i}. {pred['class_name']}: {pred['confidence']:.2%}")

    def _handle_stats(self, data):
        """Handle performance statistics."""
        stats = data.get("stats", {})
        frame_count = data.get("frame_count", 0)

        print(f"\n=== Performance Stats (Frame {frame_count}) ===")
        print(f"Avg Inference: {stats.get('avg_inference_ms', 0):.2f}ms")
        print(f"Total Inferences: {stats.get('total_inferences', 0)}")
        print(f"Target FPS: {stats.get('target_fps', 30)}")
        print("=" * 50)

    def draw_info(self, frame, current_sign=None, confidence=0.0):
        """Draw information overlay on frame."""
        # Create overlay
        overlay = frame.copy()

        # Draw semi-transparent background for text
        cv2.rectangle(overlay, (10, 10), (400, 150), (0, 0, 0), -1)
        frame = cv2.addWeighted(overlay, 0.5, frame, 0.5, 0)

        # Draw text
        y_offset = 40
        cv2.putText(frame, f"Session: {self.session_id[:8]}...",
                   (20, y_offset), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)

        y_offset += 25
        cv2.putText(frame, f"Frames: {self.frame_count}",
                   (20, y_offset), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)

        y_offset += 25
        cv2.putText(frame, f"Recognition Count: {self.recognition_count}",
                   (20, y_offset), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)

        if current_sign:
            y_offset += 30
            # Color based on confidence
            color = (0, 255, 0) if confidence > 0.7 else (0, 255, 255) if confidence > 0.4 else (0, 0, 255)
            cv2.putText(frame, f"Sign: {current_sign} ({confidence:.1%})",
                       (20, y_offset), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

        # Draw instructions
        cv2.putText(frame, "Press 'q' to quit | 'r' to reset",
                   (10, frame.shape[0] - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)

        return frame

    async def stream(self):
        """Main streaming loop."""
        self.is_running = True
        self.start_time = time.time()

        # Create window
        cv2.namedWindow(self.window_name)

        # Variables for display
        current_sign = None
        current_confidence = 0.0
        last_update = time.time()

        # Calculate frame delay for target FPS
        frame_delay = 1.0 / self.target_fps

        # Start result receiver task
        receiver_task = asyncio.create_task(self.receive_results())

        try:
            while self.is_running:
                loop_start = time.time()

                # Capture frame
                ret, frame = self.cap.read()

                if not ret:
                    print("Failed to read frame from camera")
                    break

                # Mirror frame for better UX
                frame = cv2.flip(frame, 1)

                # Send frame to server
                await self.send_frame(frame)

                # Draw info overlay
                display_frame = self.draw_info(frame, current_sign, current_confidence)

                # Display frame
                cv2.imshow(self.window_name, display_frame)

                # Handle keyboard input
                key = cv2.waitKey(1) & 0xFF

                if key == ord('q'):
                    print("Quitting...")
                    break
                elif key == ord('r'):
                    print("Resetting session...")
                    current_sign = None
                    current_confidence = 0.0

                # Maintain target FPS
                elapsed = time.time() - loop_start
                if elapsed < frame_delay:
                    await asyncio.sleep(frame_delay - elapsed)

        finally:
            self.is_running = False
            receiver_task.cancel()

    def cleanup(self):
        """Clean up resources."""
        print("\nCleaning up...")

        if self.cap:
            self.cap.release()

        cv2.destroyAllWindows()

        # Calculate and print final statistics
        if self.start_time:
            duration = time.time() - self.start_time
            actual_fps = self.frame_count / duration if duration > 0 else 0

            print(f"\n=== Session Summary ===")
            print(f"Session ID: {self.session_id}")
            print(f"Duration: {duration:.2f}s")
            print(f"Total Frames: {self.frame_count}")
            print(f"Total Recognitions: {self.recognition_count}")
            print(f"Actual FPS: {actual_fps:.2f}")
            print("=" * 50)

    async def run(self):
        """Run the streaming client."""
        try:
            # Initialize camera
            self.init_camera()

            # Connect to server
            await self.connect()

            # Start streaming
            await self.stream()

        except KeyboardInterrupt:
            print("\nInterrupted by user")

        except Exception as e:
            print(f"Error: {e}")
            import traceback
            traceback.print_exc()

        finally:
            # Send stop message
            if self.websocket:
                try:
                    await self.websocket.send(json.dumps({"type": "stop"}))
                    await self.websocket.close()
                except:
                    pass

            # Cleanup
            self.cleanup()


async def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Live Streaming Sign Language Recognition Demo"
    )

    parser.add_argument(
        "--server",
        type=str,
        default="ws://localhost:8000/streaming/ws/recognize",
        help="WebSocket server URL"
    )

    parser.add_argument(
        "--camera",
        type=int,
        default=0,
        help="Camera device ID"
    )

    parser.add_argument(
        "--fps",
        type=int,
        default=30,
        help="Target frames per second"
    )

    parser.add_argument(
        "--width",
        type=int,
        default=640,
        help="Frame width"
    )

    parser.add_argument(
        "--height",
        type=int,
        default=480,
        help="Frame height"
    )

    args = parser.parse_args()

    print("=" * 60)
    print("Sign Language Recognition - Live Stream Demo")
    print("=" * 60)
    print(f"Server: {args.server}")
    print(f"Camera: {args.camera}")
    print(f"Target FPS: {args.fps}")
    print(f"Resolution: {args.width}x{args.height}")
    print("=" * 60)
    print("\nMake sure the ML service is running:")
    print("  uvicorn app.main:app --host 0.0.0.0 --port 8000")
    print("\nStarting in 2 seconds...")
    await asyncio.sleep(2)

    # Create and run client
    client = StreamingRecognitionClient(
        server_url=args.server,
        camera_id=args.camera,
        target_fps=args.fps,
        frame_width=args.width,
        frame_height=args.height
    )

    await client.run()


if __name__ == "__main__":
    asyncio.run(main())
