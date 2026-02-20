import { useEffect, useRef } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import NoChatHistoryPlaceholder from "./NoChatHistoryPlaceholder";
import MessageInput from "./MessageInput";
import MessagesLoadingSkeleton from "./MessagesLoadingSkeleton";

function ChatContainer() {
  const {
    selectedUser,
    getMessagesByUserId,
    messages,
    isMessagesLoading,
    subscribeToMessages,
    unsubscribeFromMessages,
    markMessagesAsRead,
  } = useChatStore();

  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);

  /* ================= LOAD + READ ================= */
  useEffect(() => {
    if (!selectedUser?._id) return;

    getMessagesByUserId(selectedUser._id);
    subscribeToMessages();
    markMessagesAsRead(); // ✅ mark unread messages as read

    return () => {
      unsubscribeFromMessages();
    };
  }, [selectedUser?._id]); // ✅ SAFE dependency

  /* ================= AUTO SCROLL ================= */
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <>
      <ChatHeader />

      <div className="flex-1 px-6 overflow-y-auto py-8">
        {isMessagesLoading ? (
          <MessagesLoadingSkeleton />
        ) : messages.length > 0 ? (
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg) => {
              const isMine = msg.senderId === authUser._id;

              return (
                <div
                  key={msg._id}
                  className={`chat ${isMine ? "chat-end" : "chat-start"}`}
                >
                  <div
                    className={`chat-bubble relative ${
                      isMine
                        ? "bg-cyan-600 text-white"
                        : "bg-slate-800 text-slate-200"
                    }`}
                  >
                    {msg.image && (
                      <img
                        src={msg.image}
                        alt="Shared"
                        className="rounded-lg h-48 object-cover mb-2"
                      />
                    )}

                    {msg.text && <p>{msg.text}</p>}

                    {/* TIME + TICKS */}
                    <p className="text-xs mt-1 opacity-75 flex items-center gap-1 justify-end">
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}

                      {/* ✅ TICKS */}
                      {isMine && (
                        <span
                          className={`ml-1 text-sm ${
                            msg.isRead ? "text-blue-400" : "text-gray-300"
                          }`}
                        >
                          {msg.isRead ? "✓✓" : "✓"}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              );
            })}

            <div ref={messageEndRef} />
          </div>
        ) : (
          <NoChatHistoryPlaceholder />
        )}
      </div>

      <MessageInput />
    </>
  );
}

export default ChatContainer;