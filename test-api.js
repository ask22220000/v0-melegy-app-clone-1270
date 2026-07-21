// Simple API test script
const testChat = async () => {
  try {
    console.log("🧪 Testing Chat API...");
    
    const response = await fetch("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: "السلام عليكم، كيفك؟",
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let result = "";

    console.log("📨 Receiving response...\n");

    let done = false;
    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) {
        const chunk = decoder.decode(value);
        result += chunk;
        process.stdout.write(chunk);
      }
    }

    console.log("\n\n✅ Chat API working correctly!");
    console.log("Response length:", result.length, "characters");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

testChat();
