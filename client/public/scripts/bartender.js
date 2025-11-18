import { sendMessage } from "./api.js";

const chatHistoryArray = []; // จะเก็บเป็น object {role: 'user'|'bartender', text: '...'}
const MAX_HISTORY = 5;

function addToHistory(role, text) {
  chatHistoryArray.push({ role, text });
  if (chatHistoryArray.length > MAX_HISTORY) {
    chatHistoryArray.shift(); // เอาข้อความเก่าที่สุดออก
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("quest");
  const button = document.getElementById("draw-btn");
  const chatHistory = document.getElementById("chat-history");

  function appendUserBubble(text) {
    const userBubble = document.createElement("div");
    userBubble.className = "chat-bubble user";
    userBubble.textContent = text;
    chatHistory.appendChild(userBubble);
    gsap.fromTo(userBubble, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5 });
    chatHistory.scrollTop = chatHistory.scrollHeight;
  }

  function appendBartenderBubble(text) {
    const botBubble = document.createElement("div");
    botBubble.className = "chat-bubble bartender";
    botBubble.textContent = text;
    chatHistory.appendChild(botBubble);
    gsap.fromTo(botBubble, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5 });
    chatHistory.scrollTop = chatHistory.scrollHeight;
  }

  async function handleSend() {
  const userText = input.value.trim();
  if (!userText) return;

  appendUserBubble(userText);
  addToHistory('user', userText); // เก็บ user message

  input.value = "";
  button.disabled = true;
  button.textContent = "Loading...";

  try {
    // ส่ง history ไปด้วย
    const reply = await sendMessage("bartender", userText, { history: chatHistoryArray });
    if (reply) {
      appendBartenderBubble(reply);
      addToHistory('bartender', reply); // เก็บ bartender reply
    }
  } catch (err) {
    console.error("Error sending message:", err);
    appendBartenderBubble("เกิดข้อผิดพลาดขณะเชื่อมต่อ backend.");
    addToHistory('bartender', "เกิดข้อผิดพลาดขณะเชื่อมต่อ backend.");
  } finally {
    button.disabled = false;
    button.textContent = "Send";
  }
}


  button.addEventListener("click", handleSend);

  // กด Enter ส่งข้อความได้
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleSend();
  });
});
