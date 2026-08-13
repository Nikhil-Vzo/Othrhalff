import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { X, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface PlaygroundChatOverlayProps {
  localSessionId: string;
  chatPartnerId: string;
  chatPartnerName: string;
  onLeave: () => void;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
}

export const PlaygroundChatOverlay: React.FC<PlaygroundChatOverlayProps> = ({
  localSessionId,
  chatPartnerId,
  chatPartnerName,
  onLeave
}) => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [chatChannel, setChatChannel] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Generate a unique room ID by sorting the two SESSION IDs so both users get the same string
  const roomId = [localSessionId, chatPartnerId].sort().join('-');

  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase.channel(`playground-chat:${roomId}`);

    channel.on('broadcast', { event: 'chat_message' }, ({ payload }) => {
      setMessages(prev => [...prev, payload as ChatMessage]);
    });

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        setChatChannel(channel);
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !chatChannel || !currentUser) return;

    const newMessage: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      senderId: currentUser.id,
      senderName: currentUser.realName || currentUser.anonymousId || 'Me',
      text: inputText.trim(),
      timestamp: new Date().toISOString()
    };

    // Optimistically add to UI
    setMessages(prev => [...prev, newMessage]);
    setInputText('');

    // Broadcast to partner
    chatChannel.send({
      type: 'broadcast',
      event: 'chat_message',
      payload: newMessage
    }).catch(console.error);
  };

  return (
    <div className="absolute inset-0 z-40 pointer-events-none flex items-end justify-center pb-24 px-4">
      <div className="w-full max-w-md bg-black/80 backdrop-blur-md rounded-2xl border border-gray-800 shadow-2xl pointer-events-auto flex flex-col overflow-hidden" style={{ height: '400px' }}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900/50">
          <div>
            <h3 className="text-white font-bold">Chat with {chatPartnerName}</h3>
            <p className="text-neon text-xs">Live in Playground</p>
          </div>
          <button 
            onClick={onLeave}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-full transition-colors text-gray-300 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-500 text-sm italic">
              Say hi to {chatPartnerName}!
            </div>
          ) : (
            messages.map(msg => {
              const isMe = msg.senderId === currentUser?.id;
              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <span className="text-[10px] text-gray-500 mb-1 px-1">
                    {isMe ? 'You' : msg.senderName}
                  </span>
                  <div className={`px-4 py-2 rounded-2xl max-w-[85%] break-words ${isMe ? 'bg-neon text-white rounded-br-sm' : 'bg-gray-800 text-gray-200 rounded-bl-sm'}`}>
                    {msg.text}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 bg-gray-900/80 border-t border-gray-800">
          <form onSubmit={sendMessage} className="flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-gray-800 text-white rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-neon"
            />
            <button 
              type="submit"
              disabled={!inputText.trim()}
              className="p-2 bg-neon text-white rounded-full hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={16} className="ml-1" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
