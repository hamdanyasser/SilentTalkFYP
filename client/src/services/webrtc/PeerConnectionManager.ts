import SimplePeer from 'simple-peer';
import type { Instance as SimplePeerInstance, Options as SimplePeerOptions } from 'simple-peer';
import { CallSignalingClient, IceConfiguration } from '../signalr/CallSignalingClient';

/**
 * Manages WebRTC peer connections using simple-peer
 * Handles offer/answer/ICE candidate exchange via SignalR
 */
export class PeerConnectionManager {
  private peers: Map<string, SimplePeerInstance> = new Map();
  private localStream: MediaStream | null = null;
  private iceConfiguration: RTCConfiguration | null = null;

  constructor(
    private signalingClient: CallSignalingClient,
    private callId: string,
    private userId: string,
    private onStreamReceived?: (userId: string, stream: MediaStream) => void,
    private onPeerDisconnected?: (userId: string) => void,
    private onError?: (userId: string, error: Error) => void
  ) {
    this.setupSignalingHandlers();
  }

  /**
   * Initialize with local media stream
   */
  async initialize(stream: MediaStream): Promise<void> {
    this.localStream = stream;

    // Get ICE server configuration
    const iceConfig = await this.signalingClient.getIceConfiguration();
    this.iceConfiguration = this.convertIceConfiguration(iceConfig);

    console.log('PeerConnectionManager initialized with ICE configuration:', this.iceConfiguration);
  }

  /**
   * Create peer connection (initiator sends offer)
   */
  async createPeerConnection(remoteUserId: string, initiator: boolean = true): Promise<void> {
    if (this.peers.has(remoteUserId)) {
      console.warn(`Peer connection already exists for user ${remoteUserId}`);
      return;
    }

    const peerOptions: SimplePeerOptions = {
      initiator,
      stream: this.localStream ?? undefined,
      trickle: true,
      config: this.iceConfiguration ?? undefined,
    };

    const peer = new SimplePeer(peerOptions);

    // Handle signals (offer/answer/ICE candidates)
    peer.on('signal', async (data: SimplePeer.SignalData) => {
      try {
        if (data.type === 'offer') {
          await this.signalingClient.sendOffer({
            callId: this.callId,
            fromUserId: this.userId,
            toUserId: remoteUserId,
            sdp: data.sdp,
            type: 'offer',
          });
        } else if (data.type === 'answer') {
          await this.signalingClient.sendAnswer({
            callId: this.callId,
            fromUserId: this.userId,
            toUserId: remoteUserId,
            sdp: data.sdp,
            type: 'answer',
          });
        } else if (data.candidate) {
          await this.signalingClient.sendIceCandidate({
            callId: this.callId,
            fromUserId: this.userId,
            toUserId: remoteUserId,
            candidate: data.candidate,
            sdpMid: data.sdpMid ?? '',
            sdpMLineIndex: data.sdpMLineIndex,
          });
        }
      } catch (error) {
        console.error('Error sending signal:', error);
        this.onError?.(remoteUserId, error as Error);
      }
    });

    // Handle incoming stream
    peer.on('stream', (stream: MediaStream) => {
      console.log(`Received stream from user ${remoteUserId}`);
      this.onStreamReceived?.(remoteUserId, stream);
    });

    // Handle connection
    peer.on('connect', () => {
      console.log(`Peer connection established with user ${remoteUserId}`);
    });

    // Handle errors
    peer.on('error', (error: Error) => {
      console.error(`Peer connection error with user ${remoteUserId}:`, error);
      this.onError?.(remoteUserId, error);
      this.removePeer(remoteUserId);
    });

    // Handle close
    peer.on('close', () => {
      console.log(`Peer connection closed with user ${remoteUserId}`);
      this.onPeerDisconnected?.(remoteUserId);
      this.removePeer(remoteUserId);
    });

    this.peers.set(remoteUserId, peer);
    console.log(`Created peer connection for user ${remoteUserId} (initiator: ${initiator})`);
  }

  /**
   * Handle incoming offer
   */
  async handleOffer(fromUserId: string, sdp: string): Promise<void> {
    console.log(`Received offer from user ${fromUserId}`);

    // Create peer connection as non-initiator
    await this.createPeerConnection(fromUserId, false);

    const peer = this.peers.get(fromUserId);
    if (peer) {
      peer.signal({ type: 'offer', sdp });
    }
  }

  /**
   * Handle incoming answer
   */
  handleAnswer(fromUserId: string, sdp: string): void {
    console.log(`Received answer from user ${fromUserId}`);

    const peer = this.peers.get(fromUserId);
    if (peer) {
      peer.signal({ type: 'answer', sdp });
    } else {
      console.warn(`No peer connection found for user ${fromUserId}`);
    }
  }

  /**
   * Handle incoming ICE candidate
   */
  handleIceCandidate(fromUserId: string, candidate: string, sdpMid: string, sdpMLineIndex?: number): void {
    const peer = this.peers.get(fromUserId);
    if (peer) {
      peer.signal({ candidate, sdpMid, sdpMLineIndex });
    } else {
      console.warn(`No peer connection found for user ${fromUserId}`);
    }
  }

  /**
   * Remove peer connection
   */
  removePeer(userId: string): void {
    const peer = this.peers.get(userId);
    if (peer) {
      peer.destroy();
      this.peers.delete(userId);
      console.log(`Removed peer connection for user ${userId}`);
    }
  }

  /**
   * Remove all peer connections
   */
  removeAllPeers(): void {
    for (const [userId, peer] of this.peers.entries()) {
      peer.destroy();
      console.log(`Destroyed peer connection for user ${userId}`);
    }
    this.peers.clear();
  }

  /**
   * Toggle audio track
   */
  toggleAudio(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = enabled;
      });

      this.signalingClient.updateMediaState({
        callId: this.callId,
        userId: this.userId,
        audioEnabled: enabled,
      });
    }
  }

  /**
   * Toggle video track
   */
  toggleVideo(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = enabled;
      });

      this.signalingClient.updateMediaState({
        callId: this.callId,
        userId: this.userId,
        videoEnabled: enabled,
      });
    }
  }

  /**
   * Replace local stream (e.g., screen sharing)
   */
  async replaceStream(newStream: MediaStream): Promise<void> {
    this.localStream = newStream;

    for (const [userId, peer] of this.peers.entries()) {
      try {
        peer.removeStream(this.localStream!);
        peer.addStream(newStream);
      } catch (error) {
        console.error(`Error replacing stream for user ${userId}:`, error);
      }
    }
  }

  /**
   * Get peer connection statistics
   */
  async getPeerStats(userId: string): Promise<RTCStatsReport | null> {
    const peer = this.peers.get(userId);
    if (peer && (peer as any)._pc) {
      return await (peer as any)._pc.getStats();
    }
    return null;
  }

  /**
   * Monitor network quality for all peers
   */
  startNetworkQualityMonitoring(intervalMs: number = 5000): void {
    setInterval(async () => {
      for (const [userId, peer] of this.peers.entries()) {
        try {
          const stats = await this.getPeerStats(userId);
          if (stats) {
            const quality = this.calculateNetworkQuality(stats);
            const networkStats = this.extractNetworkStats(stats);

            await this.signalingClient.updateNetworkQuality({
              callId: this.callId,
              userId: this.userId,
              quality,
              stats: networkStats,
            });
          }
        } catch (error) {
          console.error(`Error monitoring network quality for user ${userId}:`, error);
        }
      }
    }, intervalMs);
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.removeAllPeers();

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  private setupSignalingHandlers(): void {
    this.signalingClient.onReceiveOffer(async (offer) => {
      if (offer.toUserId === this.userId) {
        await this.handleOffer(offer.fromUserId, offer.sdp);
      }
    });

    this.signalingClient.onReceiveAnswer((answer) => {
      if (answer.toUserId === this.userId) {
        this.handleAnswer(answer.fromUserId, answer.sdp);
      }
    });

    this.signalingClient.onReceiveIceCandidate((candidate) => {
      if (candidate.toUserId === this.userId) {
        this.handleIceCandidate(
          candidate.fromUserId,
          candidate.candidate,
          candidate.sdpMid,
          candidate.sdpMLineIndex
        );
      }
    });

    this.signalingClient.onUserJoined(async (participant) => {
      // Create peer connection as initiator for new participants
      console.log(`User ${participant.userId} joined, creating peer connection`);
      await this.createPeerConnection(participant.userId, true);
    });

    this.signalingClient.onUserLeft((data) => {
      console.log(`User ${data.userId} left, removing peer connection`);
      this.removePeer(data.userId);
    });

    this.signalingClient.onUserDisconnected((data) => {
      console.log(`User ${data.userId} disconnected: ${data.reason}`);
      // Don't remove immediately, wait for reconnection
    });

    this.signalingClient.onUserReconnected((data) => {
      console.log(`User ${data.userId} reconnected`);
      // Peer connection should be reestablished automatically
    });
  }

  private convertIceConfiguration(iceConfig: IceConfiguration): RTCConfiguration {
    return {
      iceServers: iceConfig.iceServers.map((server) => ({
        urls: server.urls,
        username: server.username,
        credential: server.credential,
      })),
      iceTransportPolicy: iceConfig.iceTransportPolicy as RTCIceTransportPolicy,
    };
  }

  private calculateNetworkQuality(stats: RTCStatsReport): number {
    // Simple quality calculation based on packet loss and RTT
    let packetLoss = 0;
    let rtt = 0;

    stats.forEach((report) => {
      if (report.type === 'inbound-rtp' && report.kind === 'video') {
        const packetsLost = report.packetsLost || 0;
        const packetsReceived = report.packetsReceived || 0;
        packetLoss = packetsLost / (packetsLost + packetsReceived);
      }
      if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        rtt = report.currentRoundTripTime || 0;
      }
    });

    // Network quality levels (matching NetworkQuality enum)
    if (packetLoss < 0.01 && rtt < 0.1) return 0; // Excellent
    if (packetLoss < 0.03 && rtt < 0.2) return 1; // Good
    if (packetLoss < 0.05 && rtt < 0.3) return 2; // Fair
    if (packetLoss < 0.1 && rtt < 0.5) return 3; // Poor
    return 4; // VeryPoor
  }

  private extractNetworkStats(stats: RTCStatsReport): any {
    const networkStats: any = {};

    stats.forEach((report) => {
      if (report.type === 'inbound-rtp') {
        networkStats.bytesReceived = report.bytesReceived;
      }
      if (report.type === 'outbound-rtp') {
        networkStats.bytesSent = report.bytesSent;
      }
      if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        networkStats.latency = report.currentRoundTripTime * 1000; // Convert to ms
      }
    });

    return networkStats;
  }
}
