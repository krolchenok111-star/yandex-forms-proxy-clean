const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // Разрешаем CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Обрабатываем OPTIONS запрос для CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Для тестового endpoint
  if (req.method === 'GET') {
    return res.status(200).json({ 
      success: true,
      message: '✅ Прокси сервер работает!',
      webhook_configured: !!process.env.DISCORD_WEBHOOK_URL,
      timestamp: new Date().toISOString()
    });
  }

  // Для POST запросов от Яндекс Форм
  if (req.method === 'POST') {
    try {
      const formData = req.body;
      
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
        return res.status(200).json({ 
          success: true, 
          message: 'Данные отправлены в Discord' 
        });
      } else {
        throw new Error('Ошибка отправки в Discord');
      }

    } catch (error) {
      return res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Для других методов
  return res.status(405).json({ error: 'Method not allowed' });
};
