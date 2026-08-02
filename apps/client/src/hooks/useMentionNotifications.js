// ============================================================
// useMentionNotifications.js — Hook para notificaciones WS de menciones
// ============================================================
// Escucha el evento 'mention:new' del servidor Socket.IO y
// muestra un toast de shadcn/ui cuando alguien menciona al
// usuario actual en una nota.
// ============================================================

import { useEffect } from 'react';
import { useSocket } from '@/hooks/useSocket';
// El proyecto usa shadcn toast (use-toast.js), no sonner
import { useToast } from '@/components/ui/use-toast';
import { EVENTS } from '@/services/socketService';

export const useMentionNotifications = () => {
  const { socket } = useSocket();
  const { toast } = useToast();

  useEffect(() => {
    // Si no hay socket (usuario no autenticado), no escuchar eventos
    if (!socket) return;

    // Handler para evento mention:new
    // El servidor emite esto cuando alguien menciona al usuario actual
    // en una nota a través de notificationBus.emit('mention:new', payload)
    // (ver nivel 06 — integración con EventEmitter)
    const handleMention = (data) => {
      console.log('💬 Mención recibida:', data);
      // El payload puede venir directo o dentro de data.payload
      // según cómo el servidor lo empaquete
      const { noteTitle, excerpt } = data.payload || data;

      // Mostrar notificación usando shadcn/ui useToast
      // Toaster ya está montado en App.jsx (línea 121)
      toast({
        title: `Nueva mención en "${noteTitle || 'Nota'}"`,
        description: excerpt || 'Te mencionaron en una nota',
        // Al hacer clic en la notificación, navegar a la página de notas
        onClick: () => {
          window.location.href = '/home/notes';
        },
      });
    };

    // Handler para backlog de menciones perdidas durante desconexión
    // El servidor envía mention:backlog al reconectar si hay menciones
    // pendientes que no se entregaron en tiempo real
    const handleBacklog = (data) => {
      const mentions = data.mentions || [];
      if (mentions.length === 0) return;

      console.log(
        `📦 Backlog: ${mentions.length} menciones perdidas recibidas`
      );

      // Toast agrupado — en lugar de N toasts individuales, mostramos uno
      // con el conteo total para no saturar al usuario
      toast({
        title: `Tienes ${mentions.length} menciones nuevas`,
        description: 'Ocurrieron mientras estabas desconectado',
        // Al hacer clic en la notificación, marcar todas como leídas
        onClick: () => {
          if (socket && mentions.length > 0) {
            const mentionIds = mentions.map((m) => m.id);
            socket.emit('message', {
              type: 'mention:read',
              payload: { mentionIds },
            });
          }
          window.location.href = '/home/notes';
        },
      });
    };

    // Registrar listener para mention:new
    socket.on(EVENTS.MENTION_NEW, handleMention);
    // Registrar listener para mention:backlog (offline recovery)
    socket.on(EVENTS.MENTION_BACKLOG, handleBacklog);

    // Cleanup: remover listener al desmontar el componente
    return () => {
      socket.off(EVENTS.MENTION_NEW, handleMention);
      socket.off(EVENTS.MENTION_BACKLOG, handleBacklog);
    };
  }, [socket, toast]);

  // Este hook no retorna estado — solo gestiona listeners
};
