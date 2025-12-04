"use client";

import React, { useEffect, useState, useRef } from "react";
import Vapi from "@vapi-ai/web";

interface Message {
  content: string;
  role: "assistant" | "user";
  type: "received" | "sent";
}

interface AgentCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  assistantId: string;
  agentName: string;
  agentImage?: string;
}

class MessageBlock {
  private readonly messages: Message[] = [];
  private readonly messageQueue: Message[] = [];
  private typedContent = '';
  private isTyping = false;
  private currentCharIndex = 0;
  readonly role: string;
  private readonly subscribers: Set<() => void> = new Set();

  constructor(initialMessage: Message) {
    this.role = initialMessage.role;
    this.messageQueue.push(initialMessage);
    this.startTyping();
  }

  appendMessage(message: Message): boolean {
    if (message.role !== this.role) return false;
    this.messageQueue.push(message);
    if (!this.isTyping) {
      this.startTyping();
    }
    return true;
  }

  private notifySubscribers() {
    this.subscribers.forEach(callback => callback());
  }

  subscribe(callback: () => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
      return void 0;
    };
  }

  private async startTyping() {
    if (this.isTyping) return;
    this.isTyping = true;

    const processQueue = async () => {
      const currentMessage = this.messageQueue[0];
      if (!currentMessage) {
        this.isTyping = false;
        this.notifySubscribers();
        return;
      }

      for (let i = this.currentCharIndex; i < currentMessage.content.length; i++) {
        this.typedContent += currentMessage.content[i];
        this.currentCharIndex++;
        this.notifySubscribers();

        await new Promise(resolve => setTimeout(resolve, 35));
      }

      const message = this.messageQueue.shift();
      if (message) {
        this.messages.push(message);
        this.typedContent += ' ';
        this.currentCharIndex = 0;
      }
      this.notifySubscribers();

      if (this.messageQueue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 50));
        await processQueue();
      } else {
        this.isTyping = false;
        this.notifySubscribers();
      }
    };

    try {
      await processQueue();
    } catch (error) {
      this.isTyping = false;
      this.notifySubscribers();
    }
  }

  getDisplayContent(): string {
    return this.typedContent;
  }

  isCurrentlyTyping(): boolean {
    return this.isTyping;
  }
}

const MessageBlockView: React.FC<{ block: MessageBlock }> = ({ block }) => {
  const [displayText, setDisplayText] = useState(block.getDisplayContent());

  useEffect(() => {
    const unsubscribe = block.subscribe(() => {
      setDisplayText(block.getDisplayContent());
    });
    return () => {
      unsubscribe();
    };
  }, [block]);

  return (
    <div className={`nv-message-block nv-message-block-${block.role}`}>
      <div className="nv-message-content">
        {displayText}
      </div>
    </div>
  );
};

const TranscriptFeed: React.FC<{ addTranscript: (fn: (message: Message) => void) => void }> = ({ addTranscript }) => {
  const feedRef = useRef<HTMLDivElement>(null);
  const [messageBlocks, setMessageBlocks] = useState<MessageBlock[]>([]);

  const scrollToBottom = () => {
    if (feedRef.current?.parentElement) {
      feedRef.current.parentElement.scrollTop = feedRef.current.parentElement.scrollHeight;
    }
  };

  useEffect(() => {
    const feed = feedRef.current;
    if (!feed) return;

    const observer = new MutationObserver(scrollToBottom);
    observer.observe(feed, { childList: true, subtree: true, characterData: true });

    return () => observer.disconnect();
  }, []);

  const handleNewMessage = (message: Message) => {
    setMessageBlocks(prevBlocks => {
      const lastBlock = prevBlocks[prevBlocks.length - 1];
      return !lastBlock?.appendMessage(message)
        ? [...prevBlocks, new MessageBlock(message)]
        : [...prevBlocks];
    });
  };

  useEffect(() => {
    addTranscript(handleNewMessage);
  }, [addTranscript]);

  return (
    <div className="nv-transcript-feed" ref={feedRef}>
      {messageBlocks.map((block, index) => (
        <MessageBlockView key={`${block.role}-${index}`} block={block} />
      ))}
    </div>
  );
};

// Vapi instance should be singleton
const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || "");

export function AgentCallModal({
  isOpen,
  onClose,
  assistantId,
  agentName,
  agentImage,
}: AgentCallModalProps) {
  const [loadingAnimation, setLoadingAnimation] = useState(false);
  const [callStarted, setCallStarted] = useState(false);
  const [hasCallEnded, setHasCallEnded] = useState(false);
  const [vapiCallId, setVapiCallId] = useState<string | null>(null);
  const addTranscriptRef = useRef<((message: Message) => void) | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    setLoadingAnimation(true);
    setCallStarted(false);
    setHasCallEnded(false);

    // Start the call
    vapi.start(assistantId).then(call => {
      if (!call) {
        throw new Error('Failed to start call');
      }
      setVapiCallId(call.id);
    }).catch(err => {
      console.error("Failed to start call:", err);
      setLoadingAnimation(false);
    });

    // Event listeners
    const onCallEnd = () => {
      setCallStarted(false);
      setHasCallEnded(true);
      vapi.stop();
    };

    const onError = (error: any) => {
      console.error("Vapi error:", error);
      setHasCallEnded(true);
    };

    const onMessage = (msg: any) => {
      if (msg.type === 'speech-update' && !callStarted) {
        setCallStarted(true);
        setLoadingAnimation(false);
      }

      if (msg.type === 'transcript' && msg.transcriptType === 'final' && msg.role) {
        const message: Message = {
          content: msg.transcript,
          role: msg.role,
          type: msg.role === 'assistant' ? 'received' : 'sent',
        };

        addTranscriptRef.current?.(message);
      }
    };

    vapi.on("call-end", onCallEnd);
    vapi.on("error", onError);
    vapi.on("message", onMessage);

    return () => {
      vapi.off("call-end", onCallEnd);
      vapi.off("error", onError);
      vapi.off("message", onMessage);
    };
  }, [isOpen, assistantId, callStarted]);

  const handleClose = () => {
    vapi.stop();
    setCallStarted(false);
    setHasCallEnded(true);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="nv-widget">
      <div className="nv-blur-background" onClick={handleClose}></div>
      <div className="nv-popup-container">
        <div className="nv-container">
          <img className="nv-background-image" src={agentImage || '/defaultcharacter.png'} alt={agentName} />
          <button className="nv-close-button" onClick={handleClose}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h2 className="nv-title">
            You are now chatting with AI <span className="nv-character-name">{agentName}</span>
          </h2>
          <p className="nv-description">Please make sure you enable your microphone</p>
          <div className="nv-message-box">
            <div className="nv-messages">
              {loadingAnimation && (
                <div className="nv-loader-box">
                  <div className="nv-loader-text">Loading</div>
                  <div className="nv-loader" />
                </div>
              )}
              {!loadingAnimation && (
                <TranscriptFeed
                  addTranscript={fn => {
                    addTranscriptRef.current = fn;
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        /* Variables */
        .nv-widget {
          --color-caribbean-blue: #28c1e5;
          --color-blue-raspberry: #08c1e3;
          --color-dark-eclipse: #0e1c3d;
          --color-white: #fff;
          --color-error: #bf1650;
          --color-grey: #d9d9d980;
          --color-grey-dark: #999b9c;
        }

        /* Widget */
        .nv-widget {
          font-family: 'Rubik', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
        }

        .nv-blur-background {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(5px);
          z-index: 9999999998;
        }

        .nv-popup-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999999999;
          pointer-events: none;
        }

        .nv-container {
          width: min(850px, 96vw);
          box-sizing: border-box;
          padding: 35px 45px;
          border-radius: 20px;
          overflow: auto;
          background: rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.65);
          flex-direction: column;
          margin: 0;
          scrollbar-width: thin;
          scrollbar-color: var(--color-caribbean-blue) rgba(255, 255, 255, 0.29);
          position: relative;
          pointer-events: auto;
        }

        .nv-container .nv-background-image {
          z-index: -1;
          position: absolute;
          height: 95%;
          width: auto;
          object-fit: contain;
          bottom: 0;
          left: 85%;
          transform: translateX(-50%);
        }

        .nv-container .nv-close-button {
          position: absolute;
          top: 20px;
          right: 20px;
          border: 0;
          cursor: pointer;
          transition: all 0.3s;
          width: 35px;
          height: 35px;
          padding: 5px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-dark-eclipse);
        }

        .nv-container .nv-close-button:hover {
          color: var(--color-caribbean-blue);
          background: rgba(255, 255, 255, 0.3);
        }

        .nv-container .nv-title {
          color: var(--color-dark-eclipse);
          font-size: 24px;
          font-weight: 700;
          letter-spacing: 0;
          line-height: 28px;
          margin-bottom: 0.5rem;
        }

        .nv-container .nv-character-name {
          color: var(--color-caribbean-blue);
        }

        .nv-container .nv-description {
          color: var(--color-dark-eclipse);
          font-size: 1.4rem;
          letter-spacing: 0;
          line-height: 1.7rem;
        }

        .nv-container .nv-message-box {
          position: relative;
          width: min(570px, 100%);
          box-sizing: border-box;
          margin-top: 1.5rem;
          height: 220px;
          overflow: hidden;
          background: rgba(167, 167, 167, 0.25);
          border-radius: 16px;
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(8.7px);
          -webkit-backdrop-filter: blur(8.7px);
          border: 1px solid rgba(167, 167, 167, 0.63);
          scrollbar-width: thin;
          scrollbar-color: var(--color-caribbean-blue) #f2fcff;
        }

        .nv-container .nv-messages {
          width: 100%;
          height: 100%;
          box-sizing: border-box;
          padding: 20px;
          display: block;
          gap: 8px;
          overflow-y: auto;
          scroll-behavior: smooth;
          scrollbar-width: thin;
          scrollbar-color: var(--color-caribbean-blue) rgba(255, 255, 255, 0.29);
        }

        .nv-container .nv-messages::-webkit-scrollbar {
          width: 8px;
        }

        .nv-container .nv-messages::-webkit-scrollbar-track {
          background-color: rgba(255, 255, 255, 0.29);
          border-radius: 5px;
          backdrop-filter: blur(7.8px);
          -webkit-backdrop-filter: blur(7.8px);
          border: 1px solid rgba(255, 255, 255, 0.65);
        }

        .nv-container .nv-messages::-webkit-scrollbar-thumb {
          background-color: var(--color-caribbean-blue);
          border-radius: 5px;
          cursor: pointer;
        }

        /* Transcript Feed */
        .nv-transcript-feed {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .nv-message-block {
          padding: 12px 16px;
          max-width: 80%;
          width: fit-content;
          color: var(--color-white);
          font-size: 14px;
          font-weight: 500;
          letter-spacing: 0;
          line-height: 1.4;
          margin-bottom: 12px;
          white-space: pre-wrap;
          word-wrap: break-word;
          word-break: break-word;
          border-radius: 15px;
        }

        .nv-transcript-feed .nv-message-block-assistant {
          border-radius: 15px 15px 15px 0;
          background-color: var(--color-dark-eclipse);
          align-self: flex-start;
        }

        .nv-transcript-feed .nv-message-block-user {
          border-radius: 15px 15px 0 15px;
          background-color: var(--color-caribbean-blue);
          align-self: flex-end;
        }

        .nv-message-block .nv-message-content {
          display: inline;
        }

        /* Loader */
        .nv-loader-box {
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
        }

        .nv-loader-text {
          font-size: 24px;
          color: var(--color-dark-eclipse);
        }

        .nv-loader {
          margin-top: 30px;
          width: 30px;
          height: 16px;
          --_g: no-repeat radial-gradient(farthest-side, var(--color-dark-eclipse) 94%, #0000);
          background:
            var(--_g) 50% 0,
            var(--_g) 100% 0;
          background-size: 6px 6px;
          position: relative;
          animation: nv-loader-move 1.5s linear infinite;
        }

        .nv-loader:before {
          content: '';
          position: absolute;
          height: 6px;
          aspect-ratio: 1;
          border-radius: 50%;
          background: var(--color-dark-eclipse);
          left: 0;
          top: 0;
          animation:
            nv-loader-jump-move 1.5s linear infinite,
            nv-loader-jump 0.5s cubic-bezier(0, 200, 0.8, 200) infinite;
        }

        @keyframes nv-loader-move {
          0%, 5% { background-position: 0 0, 50% 0; }
          10% { background-position: 0 0, 50% 0; }
          25% { background-position: 50% 0, 50% 0; }
          30% { background-position: 50% 0, 100% 0; }
          45% { background-position: 50% 0, 100% 0; }
          50%, 55% { background-position: 50% 0, 100% 0; }
          70% { background-position: 100% 0, 100% 0; }
          80% { background-position: 100% 0, 50% 0; }
          95%, 100% { background-position: 50% 0, 50% 0; }
        }

        @keyframes nv-loader-jump-move {
          0%, 5% { left: 0; }
          10% { left: 0; }
          25% { left: 50%; }
          30% { left: 50%; }
          45% { left: 50%; }
          50%, 55% { left: 50%; }
          70% { left: 100%; }
          80% { left: 100%; }
          95%, 100% { left: 50%; }
        }

        @keyframes nv-loader-jump {
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}
