const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');

class WhatsAppService {
  constructor() {
    this.client = null;
    this.isReady = false;
    this.blockedChats = new Map();
    this.messages = new Map();
    this.chatsCache = [];
    this.contactsCache = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  async initialize() {
    try {
      this.client = new Client({
        authStrategy: new LocalAuth({
          dataPath: process.env.WHATSAPP_SESSION_PATH || './whatsapp-session'
        }),
        authTimeoutMs: 60000,
        puppeteer: {
          executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-extensions',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-features=IsolateOrigins,site-per-process'
          ]
        }
      });

      this.client.on('qr', (qr) => {
        console.log('📱 QR Code recebido. Escaneie com WhatsApp:');
        qrcode.generate(qr, { small: true });

        if (global.io) {
          global.io.emit('whatsapp:qr', qr);
        }
      });

      this.client.on('loading_screen', (percent, message) => {
        console.log(`📱 Carregando WhatsApp: ${percent}% - ${message}`);
        if (global.io) {
          global.io.emit('whatsapp:loading', { percent, message });
        }
      });

      this.client.on('ready', () => {
        this.setReady('connected');
      });

      this.client.on('authenticated', () => {
        console.log('✅ WhatsApp autenticado! Iniciando sincronização de dados...');

        // Safety fallback: Se não ficar "ready" em 20 segundos após autenticar, forçamos o ready
        // para permitir que o dashboard abra mesmo se a sincronização de chats travar
        setTimeout(() => {
          if (!this.isReady) {
            console.warn('⚠️ Sincronização demorando mais que o esperado. Forçando estado PRONTO para liberar o dashboard.');
            this.setReady('connected', true);
          }
        }, 20000);
      });

      this.client.on('auth_failure', (msg) => {
        console.error('❌ Falha na autenticação WhatsApp:', msg);
        if (global.io) {
          global.io.emit('whatsapp:auth-failure', { error: msg });
        }
      });

      this.client.on('message', async (message) => {
        await this.handleIncomingMessage(message);
      });

      this.client.on('disconnected', async (reason) => {
        console.log('❌ WhatsApp desconectado:', reason);
        this.isReady = false;

        if (global.io) {
          global.io.emit('whatsapp:disconnected', { reason });
        }

        // Tentar reconectar automaticamente se não for um logout intencional
        if (reason !== 'NAVIGATION') {
          console.log('🔄 Iniciando recuperação automática do WhatsApp...');
          await this.recover();
        }
      });

      // Capturar erros globais do Puppeteer/WWebJS para evitar crash do Node
      this.client.on('error', (err) => {
        console.error('🔥 Erro crítico no Cliente WhatsApp:', err.message);
      });

      // Implementação de retry para inicialização (evita erro de navigation/context destroyed)
      let retries = 3;
      while (retries > 0) {
        try {
          console.log(`🔄 Tentando inicializar WhatsApp Web (Tentativas restantes: ${retries})...`);
          await this.client.initialize();
          break;
        } catch (err) {
          retries--;
          console.error(`❌ Tentativa de inicialização falhou: ${err.message}`);
          if (retries === 0) throw err;
          console.log('⏳ Aguardando 5 segundos para nova tentativa...');
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }

    } catch (error) {
      console.error('❌ Erro fatal ao inicializar WhatsApp:', error);
      throw error;
    }
  }

  async recover() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Limite de tentativas de reconexão atingido. Verifique sua conexão.');
      return;
    }

    this.reconnectAttempts++;
    console.log(`🛠️ Tentativa de recuperação ${this.reconnectAttempts}...`);

    try {
      if (this.client) {
        await this.client.destroy().catch(() => { });
      }
      this.isReady = false;
      await new Promise(resolve => setTimeout(resolve, 5000));
      await this.initialize();
      this.reconnectAttempts = 0; // Resetar se tiver sucesso
    } catch (err) {
      console.error('❌ Falha na recuperação:', err.message);
      setTimeout(() => this.recover(), 10000);
    }
  }

  async setReady(status, forced = false) {
    if (this.isReady && !forced) return;

    console.log(forced ? '✅ WhatsApp forçado para PRONTO!' : '✅ WhatsApp Web conectado com sucesso!');
    this.isReady = true;

    // Trigger initial cache load
    this.refreshChatsCache().catch(err => console.error('❌ Erro ao carregar cache inicial:', err.message));

    if (global.io) {
      global.io.emit('whatsapp:ready', {
        status: status,
        forced: forced,
        timestamp: new Date().toISOString()
      });
    }
  }

  async handleIncomingMessage(message) {
    try {
      const chatId = message.from;
      const contact = await message.getContact();

      const messageData = {
        id: message.id.id,
        chatId,
        contactName: contact.pushname || contact.number,
        contactNumber: contact.number,
        message: message.body,
        timestamp: new Date(message.timestamp * 1000),
        direction: 'incoming',
        fromBot: false,
        hasMedia: message.hasMedia,
        type: message.type
      };

      if (!this.messages.has(chatId)) {
        this.messages.set(chatId, []);
      }
      this.messages.get(chatId).push(messageData);

      if (global.io) {
        global.io.emit('whatsapp:message', messageData);
      }

      // Update cache for this chat (move to top)
      this.updateChatInCache(chatId, message.body);

      if (this.isAIBlocked(chatId)) {
        console.log(`🚫 IA bloqueada para ${chatId} - Requer atendimento humano`);

        if (global.io) {
          global.io.emit('whatsapp:human-needed', {
            chatId,
            contactName: contact.pushname,
            contactNumber: contact.number,
            message: message.body,
            reason: 'IA bloqueada manualmente'
          });
        }

        return;
      }

      await this.sendToN8N(chatId, message.body, contact);

    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
    }
  }

  async sendToN8N(chatId, messageBody, contact) {
    try {
      console.log(`🤖 Enviando para N8N: ${messageBody.substring(0, 50)}...`);

      const response = await axios.post(
        process.env.N8N_AGENTE_WEBHOOK || 'http://localhost:5678/webhook/agente',
        {
          data: {
            key: {
              remoteJid: chatId
            }
          },
          message: messageBody,
          contact: {
            name: contact.pushname || contact.number,
            number: contact.number
          },
          timestamp: new Date().toISOString()
        },
        {
          timeout: 30000
        }
      );

      const aiResponse = response.data;

      if (aiResponse.response) {
        await this.sendMessage(chatId, aiResponse.response, true);
      }

      if (aiResponse.solicitar_atendente === true) {
        console.log('🆘 IA solicitou atendente humano');

        if (global.io) {
          global.io.emit('whatsapp:human-needed', {
            chatId,
            contactName: contact.pushname,
            contactNumber: contact.number,
            message: messageBody,
            aiMessage: aiResponse.mensagem,
            reason: 'Solicitado pela IA'
          });
        }

        if (aiResponse.mensagem) {
          await this.sendMessage(chatId, aiResponse.mensagem, true);
        }
      }

    } catch (error) {
      console.error('❌ Erro ao enviar para N8N:', error.message);

      const fallbackMessage = 'Desculpe, estou com dificuldades técnicas. Um atendente humano irá te ajudar em breve.';
      await this.sendMessage(chatId, fallbackMessage, true);

      if (global.io) {
        global.io.emit('whatsapp:human-needed', {
          chatId,
          message: messageBody,
          reason: 'Erro na IA'
        });
      }
    }
  }

  async sendMessage(chatId, message, fromBot = false) {
    try {
      if (!this.isReady) {
        throw new Error('WhatsApp não está conectado');
      }

      await this.client.sendMessage(chatId, message);

      const messageData = {
        id: Date.now().toString(),
        chatId,
        message,
        timestamp: new Date(),
        direction: 'outgoing',
        fromBot
      };

      if (!this.messages.has(chatId)) {
        this.messages.set(chatId, []);
      }
      this.messages.get(chatId).push(messageData);

      if (global.io) {
        global.io.emit('whatsapp:message-sent', messageData);
      }

      return { success: true, messageData };
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      throw error;
    }
  }

  blockAI(chatId) {
    this.blockedChats.set(chatId, true);
    console.log(`🚫 IA BLOQUEADA para chat: ${chatId}`);

    if (global.io) {
      global.io.emit('whatsapp:ai-blocked', {
        chatId,
        blocked: true,
        timestamp: new Date().toISOString()
      });
    }

    return { success: true, chatId, blocked: true };
  }

  unblockAI(chatId) {
    this.blockedChats.delete(chatId);
    console.log(`✅ IA DESBLOQUEADA para chat: ${chatId}`);

    if (global.io) {
      global.io.emit('whatsapp:ai-unblocked', {
        chatId,
        blocked: false,
        timestamp: new Date().toISOString()
      });
    }

    return { success: true, chatId, blocked: false };
  }

  isAIBlocked(chatId) {
    return this.blockedChats.has(chatId) && this.blockedChats.get(chatId) === true;
  }

  getAIStatus(chatId) {
    return {
      chatId,
      blocked: this.isAIBlocked(chatId)
    };
  }

  async getChats() {
    try {
      if (!this.isReady) {
        return this.chatsCache;
      }

      // Se temos cache, retornamos imediatamente e atualizamos em bg
      if (this.chatsCache.length > 0) {
        this.refreshChatsCache().catch(() => { });
        return this.chatsCache;
      }

      // Primeira vez após boot: tenta carregar rápido (max 2.5s)
      console.log('🔄 Sincronizando chats pela primeira vez...');
      const refreshPromise = this.refreshChatsCache();
      const timeoutPromise = new Promise(resolve => setTimeout(() => resolve([]), 2500));

      return await Promise.race([refreshPromise, timeoutPromise]);
    } catch (error) {
      console.error('Erro ao buscar chats:', error.message);
      return [];
    }
  }

  async refreshChatsCache() {
    try {
      if (!this.client || !this.isReady) return this.chatsCache;

      // Garantir que a página do Puppeteer ainda está viva
      const page = this.client.pupPage;
      if (!page || page.isClosed()) return this.chatsCache;

      const rawChats = await this.client.getChats();
      const formattedChats = await Promise.all(
        rawChats.map(async (chat) => {
          try {
            if (!chat || !chat.id) return null;

            // Use contact cache for performance
            let contact = this.contactsCache.get(chat.id._serialized);
            if (!contact) {
              contact = {
                number: chat.id.user,
                pushname: chat.name || "",
                isMyContact: false,
                profilePicUrl: null
              };
              this.contactsCache.set(chat.id._serialized, contact);

              // Enriquecimento em background sem travar o loop
              chat.getContact()
                .then(rawContact => {
                  if (rawContact) {
                    contact.pushname = rawContact.pushname || contact.pushname;
                    contact.isMyContact = rawContact.isMyContact || false;
                    contact.number = rawContact.number || contact.number;
                  }
                })
                .catch(() => { });

              this.client.getProfilePicUrl(chat.id._serialized)
                .then(url => { if (url) contact.profilePicUrl = url; })
                .catch(() => { });
            }

            return {
              id: chat.id._serialized,
              name: chat.name || contact.pushname || contact.number || "Desconhecido",
              isGroup: chat.isGroup,
              unreadCount: chat.unreadCount || 0,
              lastMessage: chat.lastMessage ? {
                body: chat.lastMessage.body,
                timestamp: chat.lastMessage.timestamp
              } : null,
              aiBlocked: this.isAIBlocked(chat.id._serialized),
              contact
            };
          } catch (err) {
            console.error(`⚠️ Erro ao formatar chat ${chat?.id?._serialized}:`, err.message);
            return null;
          }
        })
      );

      this.chatsCache = formattedChats
        .filter(c => c !== null)
        .sort((a, b) => (b.lastMessage?.timestamp || 0) - (a.lastMessage?.timestamp || 0));

      return this.chatsCache;
    } catch (err) {
      console.error('❌ Erro ao atualizar cache de chats:', err.message);
      return this.chatsCache;
    }
  }

  updateChatInCache(chatId, lastMessageBody) {
    const chatIndex = this.chatsCache.findIndex(c => c.id === chatId);
    if (chatIndex > -1) {
      const chat = this.chatsCache[chatIndex];
      chat.lastMessage = {
        body: lastMessageBody,
        timestamp: Date.now() / 1000
      };
      // Move to top
      this.chatsCache.splice(chatIndex, 1);
      this.chatsCache.unshift(chat);
    } else {
      // If not in cache, refresh full list
      this.refreshChatsCache();
    }
  }

  getTestChat(customMessage = null) {
    console.log('💡 Retornando chat de teste para verificação do frontend.');
    return [{
      id: 'test_chat',
      name: 'Suporte BR Dashboard (Teste)',
      isGroup: false,
      unreadCount: 1,
      lastMessage: {
        body: customMessage || 'Sistema conectado! Se você vê esta mensagem, a comunicação está OK.',
        timestamp: Date.now() / 1000
      },
      aiBlocked: false,
      contact: {
        number: '00000000000',
        pushname: 'Teste',
        isMyContact: true
      }
    }];
  }

  async getChatMessages(chatId, limit = 50) {
    try {
      if (!this.isReady) {
        return [];
      }

      console.log(`📱 Buscando mensagens para ${chatId}...`);
      const chat = await this.client.getChatById(chatId);
      const messages = await chat.fetchMessages({ limit });
      console.log(`✅ ${messages.length} mensagens encontradas`);

      const formattedMessages = messages.map(msg => ({
        id: msg.id.id,
        chatId: msg.from,
        message: msg.body,
        timestamp: new Date(msg.timestamp * 1000),
        direction: msg.fromMe ? 'outgoing' : 'incoming',
        fromBot: false,
        hasMedia: msg.hasMedia,
        type: msg.type
      }));

      return formattedMessages.reverse();
    } catch (error) {
      console.error('Erro ao buscar mensagens do chat:', error);
      return this.messages.get(chatId) || [];
    }
  }

  getStatus() {
    return {
      isReady: this.isReady && this.client !== null,
      status: this.isReady ? 'connected' : 'disconnected',
      connectedChats: this.chatsCache.length,
      blockedChats: this.blockedChats.size
    };
  }
}

module.exports = new WhatsAppService();
