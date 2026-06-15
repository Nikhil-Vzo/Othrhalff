import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Copy, Smartphone, MessageSquare, Send, Check, Loader2, Share2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { getOptimizedUrl } from '../utils/image';

// Icons for social networks
const WhatsappIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
);

interface ShareRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomUrl: string;
}

interface MatchPartner {
  id: string;
  realName: string;
  anonymousId: string;
  avatar: string | null;
  matchId: string;
}

export const ShareRoomModal: React.FC<ShareRoomModalProps> = ({ isOpen, onClose, roomUrl }) => {
  const { currentUser } = useAuth();
  const [copied, setCopied] = useState(false);
  const [matches, setMatches] = useState<MatchPartner[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [sentMessages, setSentMessages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen && currentUser) {
      fetchMatches();
    }
  }, [isOpen, currentUser]);

  const fetchMatches = async () => {
    if (!currentUser) return;
    setLoadingMatches(true);
    try {
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('id, user_a, user_b')
        .or(`user_a.eq.${currentUser.id},user_b.eq.${currentUser.id}`);

      if (matchesError) {
        console.error('Error fetching matches for share:', matchesError);
        return;
      }

      if (matchesData && matchesData.length > 0) {
        const rawPartnerIds = matchesData.map((m: any) => m.user_a === currentUser.id ? m.user_b : m.user_a);
        const partnerIds = rawPartnerIds.filter((val, idx, self) => self.indexOf(val) === idx);
        
        let profilesMap = new Map();
        if (partnerIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, anonymous_id, real_name, avatar')
            .in('id', partnerIds);
            
          if (profiles) {
            profiles.forEach(p => profilesMap.set(p.id, p));
          }
        }

        const partners = matchesData.map((m: any) => {
          const partnerId = m.user_a === currentUser.id ? m.user_b : m.user_a;
          const partnerProfile = profilesMap.get(partnerId);
          if (!partnerProfile) return null;

          return {
            id: partnerProfile.id,
            realName: partnerProfile.real_name,
            anonymousId: partnerProfile.anonymous_id,
            avatar: partnerProfile.avatar,
            matchId: m.id
          };
        }).filter(Boolean) as MatchPartner[];

        setMatches(partners);
      }
    } catch (err) {
      console.error('Failed to fetch matches:', err);
    } finally {
      setLoadingMatches(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(roomUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`Join my Othrhalff room! ${roomUrl}`)}`, '_blank');
  };

  const handleFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(roomUrl)}`, '_blank');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my Othrhalff Room',
          text: 'Come hang out with me in this virtual room!',
          url: roomUrl,
        });
      } catch (err) {
        console.error('Native share failed', err);
      }
    } else {
      alert("Native share is not supported on this browser.");
    }
  };

  const handleSendToMatch = async (matchId: string, partnerId: string) => {
    if (!currentUser) return;
    
    // Optimistic UI update
    setSentMessages(prev => ({ ...prev, [matchId]: true }));
    
    try {
      const inviteData = {
        type: roomUrl.includes('/music') ? 'music' : 'cinema',
        url: new URL(roomUrl).pathname + new URL(roomUrl).search + new URL(roomUrl).hash
      };
      
      const { error } = await supabase.from('messages').insert({
        match_id: matchId,
        sender_id: currentUser.id,
        text: `[SYSTEM] [INVITE:v1] ${JSON.stringify(inviteData)}`
      });

      if (error) {
        throw error;
      }
    } catch (err) {
      console.error('Failed to send message to match:', err);
      setSentMessages(prev => ({ ...prev, [matchId]: false }));
    }
  };

  if (!isOpen) return null;

  const content = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4" onClick={onClose}>
      <div 
        className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Share2 className="w-5 h-5 text-neon" /> Share Room
          </h2>
          <button onClick={onClose} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-full transition-colors text-gray-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto custom-scrollbar flex-1">
          {/* External Share Section */}
          <div className="mb-6">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Share Externally</p>
            <div className="grid grid-cols-4 gap-3">
              <button 
                onClick={handleCopy}
                className="flex flex-col items-center justify-center gap-2 p-3 bg-gray-800 hover:bg-gray-700 rounded-2xl transition-colors group"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${copied ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 group-hover:bg-gray-600 text-white'}`}>
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </div>
                <span className="text-xs text-gray-400 font-medium">{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button 
                onClick={handleWhatsApp}
                className="flex flex-col items-center justify-center gap-2 p-3 bg-gray-800 hover:bg-gray-700 rounded-2xl transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-[#25D366]/20 text-[#25D366] group-hover:bg-[#25D366]/30 flex items-center justify-center transition-colors">
                  <WhatsappIcon />
                </div>
                <span className="text-xs text-gray-400 font-medium">WhatsApp</span>
              </button>

              <button 
                onClick={handleFacebook}
                className="flex flex-col items-center justify-center gap-2 p-3 bg-gray-800 hover:bg-gray-700 rounded-2xl transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-[#1877F2]/20 text-[#1877F2] group-hover:bg-[#1877F2]/30 flex items-center justify-center transition-colors">
                  <FacebookIcon />
                </div>
                <span className="text-xs text-gray-400 font-medium">Facebook</span>
              </button>

              <button 
                onClick={handleNativeShare}
                className="flex flex-col items-center justify-center gap-2 p-3 bg-gray-800 hover:bg-gray-700 rounded-2xl transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-neon/20 text-neon group-hover:bg-neon/30 flex items-center justify-center transition-colors">
                  <Smartphone className="w-5 h-5" />
                </div>
                <span className="text-xs text-gray-400 font-medium text-center leading-tight">More<br/>Options</span>
              </button>
            </div>
          </div>

          <div className="w-full h-px bg-gray-800 my-4" />

          {/* Internal Matches Section */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Send to Matches</p>
            
            {loadingMatches ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-neon animate-spin" />
              </div>
            ) : matches.length === 0 ? (
              <div className="text-center py-8 bg-gray-800/50 rounded-2xl border border-gray-800 border-dashed">
                <MessageSquare className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No active matches found.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {matches.map(match => (
                  <div key={match.id} className="flex items-center justify-between p-3 bg-gray-800/50 hover:bg-gray-800 rounded-2xl transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden border border-gray-600">
                        {match.avatar ? (
                          <img src={getOptimizedUrl(match.avatar, 64)} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-lg font-bold text-gray-400">
                            {(match.realName || match.anonymousId)[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                      <span className="text-sm font-bold text-gray-200">
                        {match.realName || match.anonymousId}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => handleSendToMatch(match.matchId, match.id)}
                      disabled={sentMessages[match.matchId]}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                        sentMessages[match.matchId] 
                          ? 'bg-green-500/20 text-green-400 cursor-not-allowed'
                          : 'bg-neon text-black hover:bg-pink-400 active:scale-95'
                      }`}
                    >
                      {sentMessages[match.matchId] ? (
                        <>Sent <Check className="w-3.5 h-3.5" /></>
                      ) : (
                        <>Send <Send className="w-3.5 h-3.5" /></>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};
