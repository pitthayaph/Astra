// api.js
export async function sendMessage(section, userMessage, options = {}) {
  try {
    const res = await fetch(`https://astra-one-coral.vercel.app/api/${section}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userMessage, options }),
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    return data.reply;
  } catch (err) {
    console.error("API Error:", err);
    alert("❌ พนักงานไม่อยู่ ขออภัยในความไม่สะดวก โปรดกลับมาใหม่ในภายหลัง");
  }
}
