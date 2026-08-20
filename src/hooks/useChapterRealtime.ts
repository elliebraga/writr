import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "../supabaseClient";
import type { UserPresence } from "../types/collaborator";
import { ensureValidUuid } from "../utils/uuidUtils";

const AVATAR_COLORS = [
  "#6366F1", // Indigo
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#EC4899", // Pink
  "#8B5CF6", // Purple
  "#14B8A6", // Teal
  "#EF4444", // Red
  "#3B82F6", // Blue
];

function getRandomColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

interface UseChapterRealtimeOptions {
  chapterId: string;
  userId?: string;
  userName?: string;
  onRemoteContentChange?: (payload: { html: string; title?: string; senderId: string }) => void;
}

export function useChapterRealtime({
  chapterId,
  userId,
  userName = "Escritor",
  onRemoteContentChange,
}: UseChapterRealtimeOptions) {
  const safeChapterId = ensureValidUuid(chapterId);
  const currentUserId = userId || ensureValidUuid();
  const userColor = getRandomColor(currentUserId);

  const [activeUsers, setActiveUsers] = useState<UserPresence[]>([]);
  const channelRef = useRef<any>(null);
  const onRemoteContentChangeRef = useRef(onRemoteContentChange);

  useEffect(() => {
    onRemoteContentChangeRef.current = onRemoteContentChange;
  }, [onRemoteContentChange]);

  useEffect(() => {
    if (!safeChapterId) return;

    const channelName = `chapter_${safeChapterId}`;
    const channel = supabase.channel(channelName, {
      config: {
        presence: { key: currentUserId },
        broadcast: { self: false },
      },
    });

    channelRef.current = channel;

    // Escutar eventos de Presença (Usuários Online)
    channel
      .on("presence", { event: "sync" }, () => {
        const presenceState = channel.presenceState();
        const users: UserPresence[] = [];

        Object.keys(presenceState).forEach((key) => {
          const presences = presenceState[key] as any[];
          if (presences && presences.length > 0) {
            const p = presences[presences.length - 1];
            users.push({
              user_id: p.user_id || key,
              user_name: p.user_name || "Co-Autor",
              color: p.color || getRandomColor(key),
              active_at: p.active_at || new Date().toISOString(),
            });
          }
        });

        setActiveUsers(users);
      })
      .on("broadcast", { event: "content_change" }, ({ payload }) => {
        if (payload && payload.senderId !== currentUserId) {
          onRemoteContentChangeRef.current?.(payload);
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            user_id: currentUserId,
            user_name: userName,
            color: userColor,
            active_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [safeChapterId, currentUserId, userName, userColor]);

  // Transmitir alteração de conteúdo para outros autores na sala em tempo real
  const broadcastContentChange = useCallback(
    (html: string, title?: string) => {
      if (channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "content_change",
          payload: {
            html,
            title,
            senderId: currentUserId,
          },
        });
      }
    },
    [currentUserId]
  );

  return {
    activeUsers,
    currentUserId,
    userColor,
    broadcastContentChange,
  };
}
