import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Icon } from '../../components/icons/Icon';
import { hhmm } from '../../utils/formatters';
import { api } from '../../services/api';

export const MessagesView: React.FC = () => {
  const {
    route,
    go,
    threads,
    setThreads,
    activeThread,
    setActiveThread,
    toast
  } = useApp();

  const { account } = useAuth();

  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const chatScRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasParam = route.a !== undefined && threads[+route.a] !== undefined;
  const selectedIdx = hasParam ? +route.a! : activeThread;

  useEffect(() => {
    setActiveThread(selectedIdx);
    // Mark as read
    setThreads(prev => {
      const updated = [...prev];
      if (updated[selectedIdx] && updated[selectedIdx].unread > 0) {
        updated[selectedIdx] = { ...updated[selectedIdx], unread: 0 };
      }
      return updated;
    });
  }, [selectedIdx, setActiveThread, setThreads]);

  useEffect(() => {
    if (chatScRef.current) {
      chatScRef.current.scrollTop = chatScRef.current.scrollHeight;
    }
  }, [selectedIdx, threads]);

  const activeConv = threads[selectedIdx] || threads[0];

  const handleSend = async () => {
    const text = inputMessage.trim();
    if (!text || !activeConv || sending) return;

    setSending(true);
    try {
      const senderId = String(account?.userId || account?.id || 'usr_resident');
      const senderName = account?.name || 'Resident';
      const validRecipient = activeConv.nm.includes('Command') ? '24/7 Command Center'
        : activeConv.nm.includes('Gate') ? 'Gate Guards'
        : activeConv.nm.includes('Response') ? 'Rapid Response Unit 4'
        : 'Estate Control';

      await api.sendMessage({
        sender_id: senderId,
        sender_name: senderName,
        recipient_group: validRecipient,
        content: text
      });

      setThreads(prev => {
        const updated = [...prev];
        const conv = { ...updated[selectedIdx] };
        conv.msgs = [
          ...conv.msgs,
          {
            f: 'me' as const,
            t: text,
            tm: hhmm()
          }
        ];
        conv.last = text;
        conv.time = 'now';
        updated[selectedIdx] = conv;
        return updated;
      });

      setInputMessage('');
      inputRef.current?.focus();
    } catch (err: any) {
      toast(err?.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div>
      <div className="page-hd">
        <div>
          <h1>Messages</h1>
          <p className="sub">
            Your conversations with ENDRA operators and responders.
          </p>
        </div>
      </div>

      {threads.length === 0 ? (
        <div className="card flush" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ color: 'var(--g300)', fontSize: '15px', fontWeight: 600, marginBottom: '8px' }}>
            No active conversations
          </div>
          <p className="sub" style={{ margin: 0, fontSize: '13px' }}>
            When operators or on-site security send alerts or updates, they will appear here.
          </p>
        </div>
      ) : (
        <div className={`split ${hasParam ? 'has-detail' : ''}`.trim()}>
          {/* Thread List Master Pane */}
          <div className="pane-list card flush" id="thrList">
            {threads.map((t, idx) => {
              const isSelected = idx === selectedIdx;
              return (
                <button
                  key={t.nm}
                  type="button"
                  className={`thr ${isSelected ? 'on' : ''}`}
                  style={{ width: '100%', textAlign: 'left' }}
                  onClick={() => {
                    setActiveThread(idx);
                    go(`messages/${idx}`);
                  }}
                >
                  <div className={`mav ${t.cmd ? 'cmd' : ''}`}>{t.av}</div>
                  <div className="mn">
                    <div className="nm">
                      <span>{t.nm}</span>
                      <time>{t.time}</time>
                    </div>
                    <div className="rl">{t.role}</div>
                    <div className={`ls ${t.unread > 0 ? 'un' : ''}`}>{t.last}</div>
                  </div>
                  {t.unread > 0 && <span className="unb">{t.unread}</span>}
                </button>
              );
            })}
          </div>

          {/* Conversation Detail Pane */}
          {activeConv && (
            <div className="pane-detail">
              <div className="card flush msgs">
                <div className="chatc" id="chatPane">
                  <div className="chat-hd">
                    <button
                      type="button"
                      className="back"
                      style={{ margin: 0 }}
                      onClick={() => go('messages')}
                    >
                      <Icon name="chevl" size={18} />
                    </button>
                    <div className={`mav ${activeConv.cmd ? 'cmd' : ''}`}>
                      {activeConv.av}
                    </div>
                    <div>
                      <b>{activeConv.nm}</b>
                      <span>{activeConv.role}</span>
                    </div>
                  </div>

                  <div className="chat-sc" ref={chatScRef}>
                    <div className="chat-day">Today</div>
                    {activeConv.msgs.map((m, idx) => (
                      <div key={idx} className={`bub ${m.f}`}>
                        {m.t}
                        <small>{m.tm}</small>
                      </div>
                    ))}
                  </div>

                  <div className="chat-in">
                    <input
                      ref={inputRef}
                      className="in"
                      placeholder={`Message ${activeConv.nm.split(' ')[0]}…`}
                      value={inputMessage}
                      disabled={sending}
                      onChange={e => setInputMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      aria-label="Message"
                    />
                    <button
                      type="button"
                      className="send"
                      disabled={sending}
                      onClick={handleSend}
                      aria-label="Send"
                    >
                      <Icon name="send" size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
