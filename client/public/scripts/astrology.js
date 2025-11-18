import { sendMessage } from "./api.js"; // relative path


document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("planet-btn");

  async function sendAstrology() {
    const day = document.getElementById("dob-day").value;
    const month = document.getElementById("dob-month").value;
    const year = document.getElementById("dob-year").value;
    const hour = document.getElementById("hour").value;
    const minute = document.getElementById("minute").value;
    const place = document.getElementById("placeOfBirth").value;
    const lat = document.getElementById("latitude").value;
    const lon = document.getElementById("longitude").value;

    if (!day || !month || !year || !hour || !minute || !place || !lat || !lon) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    const userMessage = `
วันเกิด: ${day}/${month}/${year}
เวลาเกิด: ${hour}:${minute}
สถานที่เกิด: ${place}
พิกัด: latitude ${lat}, longitude ${lon}
ตีความแบบ Western Astrology
    `;

    try {   
      btn.textContent = "Loading...";
      btn.disabled = true;

      // 👉 ใช้ Gemini API
      const reply = await sendMessage("astrology", userMessage);
      showPopup(reply);

    } catch (err) {
      console.error("Error:", err);
      alert("เกิดข้อผิดพลาด: " + err.message);
    } finally {
      btn.textContent = "See Your Chart";
      btn.disabled = false;
    }
  }

  btn.addEventListener("click", sendAstrology);
});

function showPopup(message) {
  const popup = document.getElementById("popup");
  const popupMessage = document.getElementById("popup-message");

  popupMessage.innerHTML = message.replace(/\n/g, "<br>");

  popup.style.display = "block";

  window.onclick = (event) => { if (event.target === popup) popup.style.display = "none"; };
}

