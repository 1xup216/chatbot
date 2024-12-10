const express = require("express");
const axios = require("axios");
const QS = require("qs");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Local database for chatbot
const localDatabase = [
  { name: "展覽理念", description: "本次畢展的理念是協同效應，強調科技與人文的協作，透過資訊傳播系統、創新技術以及學術研究的融合，展現人類與AI之間的協調互動。展覽命名為「協同效應」，寓意不同領域的技術與人類智慧共同促進的整體效能提升​。" },
  { name: "未來領航", description: "透過生成式AI開發沉浸式遊戲，結合文字和圖片生成技術，使遊戲體驗更加生動有趣，並應用API整合模型來增強互動。" },
  { name: "負Food得正", description: "利用AI推薦食材和生成個性化菜譜，透過拍照辨識使用者的食材庫存，減少食物浪費，並提高烹飪靈感。" },
  { name: "媒人所", description: "應用AI故事生成技術來創作適合兒童的教育故事，幫助家長與孩子一起提升媒體識讀能力，並培養對資訊的正確判斷。" },
  { name: "花 Happen", description: "利用AI分析用戶需求，提供適合的花卉推薦與資訊，搭建線上平台普及花卉知識，讓用戶更加了解花卉。" },
  { name: "旅行的翼逸", description: "藉由AI數據分析為大學生提供個性化的旅遊推薦和行程規劃，幫助用戶更輕鬆規劃旅行。" },
  { name: "界限 Boundaries", description: "通過AI資料收集與篩選，設計互動情境與桌遊，推動性別平等教育，並提升使用者的性別意識與理解。" },
  { name: "哩豆", description: "推廣膠囊咖啡的環保知識，並提供即時回收資訊，結合AI技術來增強膠囊回收意識，促進循環利用。" },
  { name: "JOMO (Joy of Missing Out)", description: "透過AI生成學習資源，協助兒童和青少年正確使用社群媒體，並建立數位素養和網路安全意識。" },
  { name: "時光抱報", description: "使用AI數位化處理過往報紙，將歷史報紙數位保存並提供線上瀏覽，為讀者呈現豐富的歷史資訊。" },
  { name: "Co-Sign", description: "應用AI技術實現手語與文字的雙向轉換，改善聾啞人士與聽人之間的溝通，提升社會包容性。" },
  { name: "用進廢退", description: "探討AI在職場的應用影響，並提醒人們過度依賴AI的潛在風險，倡導理性使用AI技術，以防止職業價值降低和就業減少。" }
];

// Fetch Notion Data (if needed)
const fetchNotionData = async () => {
    try {
        const response = await axios.post('http://localhost:3000/notion', {
            // Your Notion query payload here
        }, {
            headers: {
                Authorization: `Bearer YOUR_NOTION_API_KEY`,
                "Content-Type": "application/json"
            }
        });
        return response.data.results;
    } catch (error) {
        console.error("Error fetching data from Notion:", error.message);
        return [];
    }
};

// Combine local and Notion data
const getCombinedContext = async (query) => {
    // Search local database
    const matchingItems = localDatabase.filter(item =>
        item.name.includes(query) || item.description.includes(query)
    );

    if (matchingItems.length > 0) {
        return matchingItems.map(item => `${item.name}: ${item.description}`).join("\n");
    }

    // Fallback to Notion if no local match
    const notionData = await fetchNotionData();
    return notionData.map(item => `${item.name}: ${item.description}`).join("\n");
};

// Chatbot Route
app.post("/chat", async (req, res) => {
    const { message } = req.body;

    try {
        const context = await getCombinedContext(message);
        const prompt = `以下是與您的問題相關的資訊：\n${context}\n用戶提問：${message}`;
        
        const response = await axios.post("https://api.openai.com/v1/chat/completions", {
            model: "gpt-4o-mini",
            messages: [{ role: "system", content: "You are a helpful assistant." }, { role: "user", content: prompt }],
            max_tokens: 150,
            temperature: 0.7
        }, {
            headers: {
                Authorization: `Bearer YOUR_OPENAI_API_KEY`,
                "Content-Type": "application/json"
            }
        });

        res.json({ reply: response.data.choices[0].message.content });
    } catch (error) {
        console.error("Error in Chatbot:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Other Routes (e.g., Test Route)
app.get("/test", (req, res) => {
    res.json({ message: "API is running!" });
});

// Start the server
const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
