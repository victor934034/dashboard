import { useState, useEffect, useRef } from 'react';
import { Bot, BotOff, Send, Search, Phone, User } from 'lucide-react';
import { whatsappApi } from '@/services/api';
import { initializeSocket, joinChat, leaveChat } from '@/services/socket';
import type { Chat, Message } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function WhatsAppChat() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [aiBlocked, setAiBlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [whatsappStatus, setWhatsappStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');

  const selectedChatRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  useEffect(() => {
    const socket = initializeSocket();

    const handleNewMessage = (message: Message) => {
      // Se é o chat aberto, adiciona na lista
      if (message.chatId === selectedChatRef.current?.id) {
        setMessages(prev => {
          // Evita duplicatas se o socket e a API retornarem ao mesmo tempo
          if (prev.find(m => m.id === message.id)) return prev;
          return [...prev, message];
        });
        setTimeout(scrollToBottom, 100);
      }

      // Atualiza a prévia na lista lateral e contador de não lidas
      setChats(prev => {
        const chatIndex = prev.findIndex(c => c.id === message.chatId);
        if (chatIndex === -1) return prev;

        const updatedChats = [...prev];
        const chat = { ...updatedChats[chatIndex] };

        chat.lastMessage = {
          body: message.message,
          timestamp: new Date(message.timestamp).getTime() / 1000
        };

        if (message.chatId !== selectedChatRef.current?.id && message.direction === 'incoming') {
          chat.unreadCount = (chat.unreadCount || 0) + 1;
        }

        updatedChats.splice(chatIndex, 1);
        updatedChats.unshift(chat);
        return updatedChats;
      });
    };

    socket.on('whatsapp:message', handleNewMessage);
    socket.on('whatsapp:message-sent', handleNewMessage);

    socket.on('whatsapp:ai-blocked', ({ chatId }: { chatId: string }) => {
      if (chatId === selectedChatRef.current?.id) setAiBlocked(true);
      updateChatAIStatus(chatId, true);
    });

    socket.on('whatsapp:ai-unblocked', ({ chatId }: { chatId: string }) => {
      if (chatId === selectedChatRef.current?.id) setAiBlocked(false);
      updateChatAIStatus(chatId, false);
    });

    socket.on('whatsapp:human-needed', (data: any) => {
      toast.info(`Atendimento solicitado por ${data.contactName || 'Cliente'}`, {
        description: data.message?.substring(0, 50) + '...'
      });
    });

    socket.on('whatsapp:ready', () => {
      setWhatsappStatus('connected');
      toast.success('WhatsApp conectado!');
      loadChats();
    });

    socket.on('whatsapp:disconnected', () => {
      setWhatsappStatus('disconnected');
    });

    loadChats();
    checkStatus();

    return () => {
      socket.off('whatsapp:message', handleNewMessage);
      socket.off('whatsapp:message-sent', handleNewMessage);
      socket.off('whatsapp:ai-blocked');
      socket.off('whatsapp:ai-unblocked');
      socket.off('whatsapp:human-needed');
      socket.off('whatsapp:ready');
      socket.off('whatsapp:disconnected');
    };
  }, []); // Sem dependências para não rodar ao trocar chat

  const checkStatus = async () => {
    try {
      const response = await whatsappApi.getStatus();
      setWhatsappStatus(response.data.isReady ? 'connected' : 'disconnected');
    } catch (error) {
      setWhatsappStatus('disconnected');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChats = async () => {
    try {
      setLoading(true);
      const response = await whatsappApi.getChats();
      setChats(response.data.chats || []);
    } catch (error) {
      console.error('Erro ao carregar chats:', error);
      toast.error('Erro ao carregar conversas');
    } finally {
      setLoading(false);
    }
  };

  const selectChat = async (chat: Chat) => {
    try {
      if (selectedChat) {
        leaveChat(selectedChat.id);
      }

      setSelectedChat(chat);
      setAiBlocked(chat.aiBlocked);

      const response = await whatsappApi.getMessages(chat.id);
      setMessages(response.data.messages || []);

      joinChat(chat.id);

      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      toast.error('Erro ao carregar mensagens');
    }
  };

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    try {
      await whatsappApi.sendMessage(selectedChat.id, newMessage);
      setNewMessage('');
    } catch (error) {
      toast.error('Erro ao enviar mensagem');
    }
  };

  const toggleAI = async () => {
    if (!selectedChat) return;

    try {
      if (aiBlocked) {
        await whatsappApi.unblockAI(selectedChat.id);
        setAiBlocked(false);
        toast.success('IA ativada para este chat');
      } else {
        await whatsappApi.blockAI(selectedChat.id);
        setAiBlocked(true);
        toast.info('IA bloqueada - Atendimento humano ativo');
      }
    } catch (error) {
      toast.error('Erro ao alterar status da IA');
    }
  };

  const updateChatAIStatus = (chatId: string, blocked: boolean) => {
    setChats(prev => prev.map(chat =>
      chat.id === chatId ? { ...chat, aiBlocked: blocked } : chat
    ));
  };

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTime = (timestamp: string | Date | number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background overflow-hidden">
      {/* Lista de conversas - Coluna Estática com Scroll interno */}
      <div className="w-80 bg-card border-r flex flex-col h-full overflow-hidden">
        {/* Header da Sidebar - Estático */}
        <div className="p-4 border-b shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Conversas</h2>
            <Badge variant={whatsappStatus === 'connected' ? 'default' : 'destructive'}>
              {whatsappStatus === 'connected' ? 'Online' : 'Offline'}
            </Badge>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Buscar conversa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Área de Scroll da Sidebar */}
        <ScrollArea className="flex-1 overflow-y-auto">
          {loading && chats.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">Carregando...</div>
          ) : filteredChats.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">Nenhuma conversa</div>
          ) : (
            filteredChats.map(chat => (
              <div
                key={chat.id}
                onClick={() => selectChat(chat)}
                className={`p-3 border-b cursor-pointer hover:bg-accent transition-all duration-200 ${selectedChat?.id === chat.id ? 'bg-accent border-l-4 border-l-primary' : 'border-l-4 border-l-transparent'
                  }`}
              >
                <div className="flex gap-3 items-center">
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-muted flex items-center justify-center border shadow-sm">
                      {chat.contact?.profilePicUrl ? (
                        <img
                          src={chat.contact.profilePicUrl}
                          alt={chat.name}
                          className="w-full h-full object-cover"
                          onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                      ) : chat.isGroup ? (
                        <User className="w-6 h-6 text-muted-foreground" />
                      ) : (
                        <Phone className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    {chat.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-card">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h3 className="font-semibold text-sm truncate pr-2">{chat.name}</h3>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {chat.lastMessage ? formatTime(chat.lastMessage.timestamp * 1000) : ''}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-muted-foreground truncate flex-1">
                        {chat.lastMessage?.body || 'Sem mensagens'}
                      </p>
                      <div className="ml-2">
                        {chat.aiBlocked ? (
                          <span title="IA Bloqueada">
                            <BotOff className="w-3.5 h-3.5 text-destructive opacity-80" />
                          </span>
                        ) : (
                          <span title="IA Ativa">
                            <Bot className="w-3.5 h-3.5 text-green-600 opacity-80" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </div>

      {/* Área de chat - Coluna Flexível com Scroll independente */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
        {selectedChat ? (
          <>
            {/* Header do chat - Estático */}
            <div className="bg-card p-3 border-b flex justify-between items-center shrink-0 shadow-sm z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex items-center justify-center border shadow-sm">
                  {selectedChat.contact?.profilePicUrl ? (
                    <img src={selectedChat.contact.profilePicUrl} alt={selectedChat.name} className="w-full h-full object-cover" />
                  ) : selectedChat.isGroup ? (
                    <User className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <Phone className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <h2 className="font-bold text-base leading-tight">{selectedChat.name}</h2>
                  <p className="text-xs text-muted-foreground">{selectedChat.contact?.number}</p>
                </div>
              </div>

              <Button
                onClick={toggleAI}
                variant={aiBlocked ? 'destructive' : 'outline'}
                size="sm"
                className="flex items-center gap-2 h-9"
              >
                {aiBlocked ? (
                  <>
                    <BotOff className="w-4 h-4" />
                    <span className="hidden sm:inline">IA Bloqueada - Ativar</span>
                  </>
                ) : (
                  <>
                    <Bot className="w-4 h-4 text-green-600" />
                    <span className="hidden sm:inline">IA Ativa - Bloquear</span>
                  </>
                )}
              </Button>
            </div>

            {/* Mensagens - Área com Scroll Independente */}
            <ScrollArea className="flex-1 overflow-y-auto px-4 py-6 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="space-y-4 max-w-4xl mx-auto">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] px-4 py-2 rounded-lg shadow-sm ${msg.direction === 'outgoing'
                        ? 'bg-primary text-primary-foreground rounded-br-none'
                        : 'bg-card text-foreground border rounded-bl-none'
                        }`}
                    >
                      <p className="break-words text-sm leading-relaxed">{msg.message}</p>
                      <div className="flex items-center gap-2 mt-1 justify-end opacity-70">
                        <p className="text-[10px]">
                          {formatTime(msg.timestamp)}
                        </p>
                        {msg.fromBot && (
                          <Badge variant="outline" className="text-[10px] py-0 px-1 border-primary/30">
                            🤖 IA
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} className="h-2" />
              </div>
            </ScrollArea>

            {/* Input de mensagem - Estático em baixo */}
            <div className="bg-card p-4 border-t shrink-0">
              <form onSubmit={sendMessage} className="flex gap-2 max-w-4xl mx-auto">
                <Input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 bg-muted/50 border-none focus-visible:ring-1"
                />
                <Button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="shadow-md"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Enviar
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground bg-muted/5">
            <div className="text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bot className="w-10 h-10 opacity-30 text-primary" />
              </div>
              <h3 className="text-xl font-medium text-foreground mb-2">Selecione uma conversa</h3>
              <p className="max-w-xs mx-auto text-sm opacity-60">
                Selecione um contato na lista lateral para iniciar ou continuar o atendimento.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
