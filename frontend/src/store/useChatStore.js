import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  /* ================= STATE ================= */
  allContacts: [],
  chats: [],
  messages: [],
  activeTab: "chats",
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  isSoundEnabled: JSON.parse(localStorage.getItem("isSoundEnabled")) === true,

  /* ================= UI ================= */
  toggleSound: () => {
    const next = !get().isSoundEnabled;
    localStorage.setItem("isSoundEnabled", next);
    set({ isSoundEnabled: next });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedUser: (user) => set({ selectedUser: user }),

  /* ================= USERS ================= */
  getAllContacts: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/contacts");
      set({ allContacts: res.data });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load contacts");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMyChatPartners: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/chats");
      set({ chats: res.data });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load chats");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  /* ================= MESSAGES ================= */
  getMessagesByUserId: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser } = get();
    const { authUser } = useAuthStore.getState();

    const tempId = `temp-${Date.now()}`;

    const optimisticMessage = {
      _id: tempId,
      senderId: authUser._id,
      receiverId: selectedUser._id,
      text: messageData.text,
      image: messageData.image,
      createdAt: new Date().toISOString(),
      isRead: false,
      isOptimistic: true,
    };

    set((state) => ({
      messages: [...state.messages, optimisticMessage],
    }));

    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData
      );

      set((state) => ({
        messages: state.messages
          .filter((m) => m._id !== tempId)
          .concat(res.data),
      }));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send message");
      set((state) => ({
        messages: state.messages.filter((m) => m._id !== tempId),
      }));
    }
  },

  /* ================= SOCKET ================= */
  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    // ❗ clear previous listeners (important)
    socket.off("newMessage");
    socket.off("messagesRead");

    // ✅ NEW MESSAGE
    socket.on("newMessage", (newMessage) => {
      const { selectedUser, isSoundEnabled } = get();

      // only handle current open chat
      if (newMessage.senderId !== selectedUser?._id) return;

      set((state) => ({
        messages: [...state.messages, newMessage],
      }));

      // 🔥 KEY FIX: chat is open → mark immediately as read
      socket.emit("markMessagesAsRead", {
        senderId: newMessage.senderId,
      });

      if (isSoundEnabled) {
        const sound = new Audio("/sounds/notification.mp3");
        sound.currentTime = 0;
        sound.play().catch(() => {});
      }
    });

    // ✅ READ RECEIPT (✓✓ real-time)
    socket.on("messagesRead", ({ readerId }) => {
      const { authUser } = useAuthStore.getState();

      set((state) => {
        const index = [...state.messages]
          .reverse()
          .findIndex(
            (m) =>
              m.senderId === authUser._id &&
              m.receiverId === readerId &&
              !m.isRead
          );

        if (index === -1) return state;

        const realIndex = state.messages.length - 1 - index;
        const updated = [...state.messages];
        updated[realIndex] = {
          ...updated[realIndex],
          isRead: true,
        };

        return { messages: updated };
      });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.off("newMessage");
    socket.off("messagesRead");
  },

  /* ================= READ RECEIPT EMIT ================= */
  markMessagesAsRead: () => {
    const socket = useAuthStore.getState().socket;
    const { selectedUser } = get();

    if (!socket || !selectedUser) return;

    socket.emit("markMessagesAsRead", {
      senderId: selectedUser._id,
    });
  },
}));