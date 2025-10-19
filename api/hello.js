const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // Разрешаем CORS для всех источников
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Обрабатываем OPTIONS запрос для CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Логируем запрос для отладки
  console.log('📨 Received request:', {
    method: req.method,
    path: req.url,
    headers: req.headers,
    body: req.body
  });

  // Для тестового endpoint
  if (req.method === 'GET') {
    return res.status(200).json({ 
      success: true,
      message: '✅ Прокси сервер работает!',
      webhook_configured: !!process.env.DISCORD_WEBHOOK_URL,
      timestamp: new Date().toISOString(),
      note: 'Для Яндекс Форм используйте POST запрос'
    });
  }

  // Для POST запросов от Яндекс Форм
  if (req.method === 'POST') {
    try {
      const formData = req.body;
      
      if (!process.env.DISCORD_WEBHOOK_URL) {
        return res.status(500).json({ 
          success: false, 
          error: 'Discord webhook not configured' 
        });
      }

      // Отправляем в Discord
      const discordResponse = await fetch(process.env.DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: "🔔 **Новая заявка с Яндекс Формы!**",
          embeds: [
            {
              title: "📝 Данные заявки",
              color: 5814783,
              fields: [
                {
                  name: "👤 Имя",
                  value: formData.name || "Не указано",
                  inline: true
                },
                {
                  name: "📧 Email",
                  value: formData.email || "Не указано",
                  inline: true
                },
                {
                  name: "📞 Телефон",
                  value: formData.phone || "Не указано",
                  inline: true
                },
                {
                  name: "💬 Сообщение",
                  value: formData.message || formData.comment || "Не указано"
                }
              ],
              timestamp: new Date().toISOString()
            }
          ]
        }),
      });

      if (discordResponse.ok) {
        console.log('✅ Данные отправлены в Discord');
        return res.status(200).json({ 
          success: true, 
          message: 'Данные отправлены в Discord' 
        });
      } else {
        const errorText = await discordResponse.text();
        console.error('❌ Discord error:', errorText);
        throw new Error('Ошибка отправки в Discord');
      }

    } catch (error) {
      console.error('❌ Error:', error);
      return res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
