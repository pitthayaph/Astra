// draw-card.js
import { sendMessage } from "./api.js";
import { gsap } from "https://cdn.skypack.dev/gsap@3.13.0";

// ==== ฟังก์ชันดึงข้อความแปลภาษา ====
function getTranslation(key) {
  const I18N_CACHE = {
    en: {
      "form.drawBtn": "Draw a Card",
      "form.confirmBtn": "Confirm",
      "form.resetBtn": "Reset"
    },
    th: {
      "form.drawBtn": "จั่วไพ่",
      "form.confirmBtn": "ยืนยัน",
      "form.resetBtn": "รีเซ็ต"
    }
  };

  const lang = localStorage.getItem("siteLang") || "en";
  return I18N_CACHE[lang]?.[key] || key;
}

// ==== GSAP Shuffle Setup ====
const cards = document.querySelectorAll(".card");
let selectedCards = [];
let selectedCardsData = [];
let selectedCardNames = [];
let selectedCardNumbers = [];
let cardsMidIndex = Math.floor(cards.length / 2);
let yOffset = 60;
let scaleOffset = 0.02;
let duration = 0.8;
let scaleDuration = duration / 3;
const loading = document.getElementById("loading-answer");
const drawBtn = document.getElementById("draw-btn");

let tl = gsap.timeline({ repeat: -1, yoyoEase: true });

// ฟังก์ชัน driftIn, driftOut, scaleCards, shuffleCards, shuffleDeck
function driftIn() { return gsap.timeline().from(".cards", { xPercent: -yOffset / 3, duration, ease: "power2.inOut", yoyoEase: true }); }
function driftOut() { return gsap.timeline().to(".cards", { xPercent: yOffset / 3, duration, ease: "power2.inOut", yoyoEase: true }); }
function scaleCards() {
  return gsap.timeline()
    .to(".card", {
      scale: (i) => i <= cardsMidIndex ? 1 - i * scaleOffset : 1 - (cards.length - 1 - i) * scaleOffset,
      delay: duration / 3,
      duration: scaleDuration,
      ease: "expo.inOut",
      yoyoEase: true
    })
    .to(".card", { scale: 1, duration: scaleDuration });
}
function shuffleCards() {
  return gsap.timeline()
    .set(".card", { y: (i) => -i * 0.5 })
    .fromTo(".card",
      { rotate: -20, xPercent: -yOffset },
      { duration, rotate: 20, xPercent: yOffset, stagger: duration * 0.03, ease: "expo.inOut", yoyoEase: true }
    );
}
function shuffleDeck() {
  tl.add(driftIn()).add(shuffleCards(), "<").add(scaleCards(), "<").add(driftOut(), "<55%");
}
shuffleDeck();

// ==== Load Tarot Data ====
let tarotData = [];
document.addEventListener("DOMContentLoaded", () => {
  fetch("assets/data/tarot-images.json")
    .then(res => res.json())
    .then(data => tarotData = data.cards)
    .catch(err => console.error("Error loading tarot JSON:", err));
});

// ==== เช็คว่าเป็น Mobile หรือไม่ ====
function isMobileView() {
  return window.innerWidth <= 1000;
}

// ==== Draw Button ====
drawBtn.addEventListener("click", () => {
  // 🔥 สำหรับ Mobile: ถ้าปุ่มเป็น "Confirm" ให้เรียก handleConfirmClick
  const confirmText = getTranslation("form.confirmBtn");
  if (isMobileView() && drawBtn.textContent === confirmText) {
    handleConfirmClick();
    return;
  }

  // 🔥 ถ้าเป็น "Draw" ให้ทำการสับไพ่ปกติ
  selectedCards = [];
  selectedCardsData = [];
  selectedCardNames = [];
  selectedCardNumbers = [];

  hideConfirmButton(); // ซ่อนปุ่ม Confirm แยก (Desktop)

  tl.pause();
  cards.forEach(card => {
    gsap.set(card, { clearProps: "x,y,rotate,scale" });
  });

  gsap.to(cards, {
    x: () => gsap.utils.random(-80, 80),
    y: 0,
    rotate: () => gsap.utils.random(-15, 15),
    duration: 0.35,
    ease: "power1.inOut",
    stagger: {
      each: 0.03,
      yoyo: true,
      repeat: 2
    },
     onComplete: () => {
      // ---------- ขั้นตอนที่ 2: รวมไพ่แน่นชิดซ้าย ----------
      gsap.to(cards, {
        x: (i) => -i * 2,
        y: 0,
        rotate: 0,
        duration: 0.45,
        ease: "power2.inOut",
        stagger: 0.02,
        onComplete: () => {
          // ---------- ขั้นตอนที่ 3: คลี่ไพ่ออกทางขวา ----------
          const isMobile = window.innerWidth <= 1000;
          const ratio = -50  / 1180;
          const baseLeft = window.innerWidth * ratio;
          const spreadFactor = isMobile ? 45 : 60; // ระยะห่างแต่ละใบ
          const firstCard = isMobile ? -300 : baseLeft;

          gsap.to(cards, {
            x: (i) => firstCard + i * spreadFactor,
            y: 0,
            rotate: (i) => gsap.utils.random(-5, 5),
            duration: 0.8,
            stagger: 0.05,
            ease: "power2.out",
          });
        }
      });
    }
  });

  cards.forEach(card => card.onclick = pickCard);
});

// ==== Pick Card ====
function pickCard(e) {
  const cardEl = e.currentTarget;
  const cardCount = parseInt(document.getElementById("card-count").value);
  const mobile = isMobileView();

  if (selectedCards.includes(cardEl) || selectedCards.length >= cardCount) return;
  selectedCards.push(cardEl);

  gsap.to(cardEl, {
    y: mobile ? 30 : -200,
    scale: mobile ? 1.05 : 1.2,
    rotate: 0,
    duration: 0.5,
    ease: "power2.out"
  });

  const remainingCards = tarotData.filter(c => !selectedCardsData.includes(c));
  const pickedTarot = remainingCards[Math.floor(Math.random() * remainingCards.length)];
  selectedCardsData.push(pickedTarot);

  if (selectedCards.length === cardCount) {
    selectedCardNames = selectedCardsData.map(c => c.name);
    selectedCardNumbers = selectedCardsData.map(c => c.number);

    if (mobile) {
      // 🔥 Mobile: เปลี่ยนปุ่ม Draw → Confirm
      changeButtonToConfirm();
    } else {
      // 🔥 Desktop: แสดงปุ่ม Confirm แยก
      createConfirmButton();
    }
  }
}

// ==== เปลี่ยนปุ่ม Draw → Confirm (Mobile Only) ====
function changeButtonToConfirm() {
  drawBtn.textContent = getTranslation("form.confirmBtn");
  drawBtn.setAttribute("data-i18n", "form.confirmBtn");

  gsap.fromTo(drawBtn,
    { scale: 0.9, opacity: 0.7 },
    { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(1.7)" }
  );
}

// ==== เปลี่ยนปุ่ม Confirm → Draw (Mobile Only) ====
function changeButtonToDraw() {
  drawBtn.textContent = getTranslation("form.drawBtn");
  drawBtn.setAttribute("data-i18n", "form.drawBtn");

  gsap.fromTo(drawBtn,
    { scale: 0.9, opacity: 0.7 },
    { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(1.7)" }
  );
}

// ==== สร้างปุ่ม Confirm แยก (Desktop Only) ====
function createConfirmButton() {
  let confirmBtn = document.getElementById("confirm-btn");

  if (!confirmBtn) {
    confirmBtn = document.createElement("button");
    confirmBtn.id = "confirm-btn";
    confirmBtn.className = "btn";

    confirmBtn.textContent = getTranslation("form.confirmBtn");
    confirmBtn.setAttribute("data-i18n", "form.confirmBtn");

    const btnContainer = document.getElementById("btn-container");
    if (btnContainer) {
      btnContainer.appendChild(confirmBtn);
    } else {
      const drawBtn = document.getElementById("draw-btn");
      if (drawBtn && drawBtn.parentNode) {
        drawBtn.parentNode.insertBefore(confirmBtn, drawBtn.nextSibling);
      } else {
        document.body.appendChild(confirmBtn);
      }
    }

    confirmBtn.addEventListener("click", handleConfirmClick);
  }

  confirmBtn.style.display = "inline-block";
  confirmBtn.style.opacity = "0";
  confirmBtn.style.transform = "translateY(20px)";

  gsap.to(confirmBtn, {
    opacity: 1,
    y: 0,
    duration: 0.3,
    ease: "power2.out"
  });
}

// ==== ซ่อนปุ่ม Confirm แยก (Desktop Only) ====
function hideConfirmButton() {
  const confirmBtn = document.getElementById("confirm-btn");
  if (confirmBtn) {
    gsap.to(confirmBtn, {
      opacity: 0,
      y: 20,
      duration: 0.2,
      ease: "power2.in",
      onComplete: () => {
        confirmBtn.style.display = "none";
      }
    });
  }
}

// ==== Confirm Click Handler ====
async function handleConfirmClick() {
  if (selectedCardsData.length === 0) return;

  loading.style.setProperty("display", "flex", "important");

  const userMessage = document.getElementById("quest").value.trim();
  if (!userMessage) {
    alert("กรุณากรอกคำถามก่อนกด Confirm");
    loading.style.display = "none";
    return;
  }

  gsap.to(cards, { opacity: 0, duration: 0.5 });

  try {
    const aiReply = await sendMessage("tarot", userMessage, {
      cards: { selectedCardNames, selectedCardNumbers }
    });

    displayCards(selectedCardsData);
    showPopup(aiReply, userMessage);

  } catch (err) {
    console.error(err);
    alert("เกิดข้อผิดพลาดขณะเชื่อมต่อ Gemini");
  } finally {
    loading.style.display = "none";
  }

  cards.forEach(c => c.onclick = null);

  // รีเซ็ตปุ่มหลังจากยืนยัน
  if (isMobileView()) {
    changeButtonToDraw();
  } else {
    hideConfirmButton();
  }
}

// ==== Reset Button ====
document.getElementById("reset").addEventListener("click", () => {
  selectedCards = [];
  selectedCardsData = [];
  selectedCardNames = [];
  selectedCardNumbers = [];

  if (isMobileView()) {
    // 🔥 Mobile: เปลี่ยนปุ่มกลับเป็น Draw
    changeButtonToDraw();
  } else {
    // 🔥 Desktop: ซ่อนปุ่ม Confirm แยก
    hideConfirmButton();
  }

  gsap.to(cards, {
    x: 0,
    y: (i) => -i * 0.5,
    rotate: () => gsap.utils.random(-20, 20),
    scale: 1,
    opacity: 1,
    duration: 1,
    stagger: 0.01,
    ease: "power2.inOut",
    onComplete: () => tl.restart()
  });

  cards.forEach(c => c.onclick = null);
  document.getElementById("card-result").innerHTML = "";
});

// ==== Show Popup ====
function showPopup(aiMessage, userMessage = "") {
  const popup = document.getElementById("popup");
  const popupMessage = document.getElementById("popup-message");

  popupMessage.innerHTML = "";

  if (userMessage) {
    const userEl = document.createElement("p");
    userEl.className = "user-question";
    userEl.textContent = "คำถามของคุณ: " + userMessage;
    userEl.style.fontWeight = "bold";
    popupMessage.appendChild(userEl);
  }

  const aiEl = document.createElement("p");
  aiEl.className = "ai-answer";
  aiEl.textContent = aiMessage;
  aiEl.style.marginTop = "8px";
  popupMessage.appendChild(aiEl);

  popup.style.display = "block";

  window.onclick = (event) => {
    if (event.target === popup) popup.style.display = "none";
  };
}

// ==== Display Cards ====
function displayCards(cards) {
  const container = document.getElementById("card-result");
  container.innerHTML = "";

  const topRow = document.createElement("div");
  const bottomRow = document.createElement("div");
  topRow.className = "tarot-image-row";
  bottomRow.className = "tarot-image-row";

  const nameRow = document.createElement("div");
  nameRow.className = "tarot-name-row";

  const meaningList = document.createElement("ol");
  meaningList.className = "tarot-meaning-list";

  cards.forEach((card, index) => {
    const img = document.createElement("img");
    img.src = `assets/images/cards/${card.img}`;
    img.alt = card.name;
    img.className = "tarot-img";

    if (cards.length === 5) {
      if (index < 3) {
        topRow.appendChild(img);
      } else {
        bottomRow.appendChild(img);
      }
    } else {
      topRow.appendChild(img);
    }

    const rotate = Math.floor(Math.random() * 31) - 15;
    img.style.setProperty("--rotate", `${rotate}deg`);

    setTimeout(() => {
      img.classList.add("animate-in");
    }, index * 150);

    const meaningItem = document.createElement("li");
    const light = card.meanings?.light?.join(", ") || "No light meanings.";
    const shadow = card.meanings?.shadow?.join(", ") || "No shadow meanings.";

    const title = document.createElement("h4");
    title.textContent = card.name;
    const lightP = document.createElement("p");
    lightP.innerText = `Light: ${light}`;
    const shadowP = document.createElement("p");
    shadowP.innerText = `Shadow: ${shadow}`;
    meaningItem.appendChild(title);
    meaningItem.appendChild(lightP);
    meaningItem.appendChild(shadowP);
    meaningList.appendChild(meaningItem);
  });

  const nameText = cards.map(c => c.name).join(" / ");
  const nameLabel = document.createElement("p");
  nameLabel.className = "tarot-name-list";
  nameLabel.textContent = nameText;
  nameRow.appendChild(nameLabel);

  setTimeout(() => {
    nameLabel.classList.add("animate-name");
  }, 300);

  container.appendChild(nameRow);
  container.appendChild(topRow);
  if (cards.length === 5) container.appendChild(bottomRow);
}

// ==== เพิ่ม Event Listener สำหรับการเปลี่ยนภาษา ====
window.addEventListener('storage', (e) => {
  if (e.key === 'siteLang') {
    updateButtonTexts();
  }
});

// ฟังก์ชัน Update ข้อความปุ่มเมื่อเปลี่ยนภาษา
function updateButtonTexts() {
  // อัพเดทปุ่ม Draw/Confirm (Mobile)
  const currentDataI18n = drawBtn.getAttribute("data-i18n");
  if (currentDataI18n) {
    drawBtn.textContent = getTranslation(currentDataI18n);
  }

  // อัพเดทปุ่ม Confirm แยก (Desktop)
  const confirmBtn = document.getElementById("confirm-btn");
  if (confirmBtn && confirmBtn.style.display !== "none") {
    confirmBtn.textContent = getTranslation("form.confirmBtn");
  }
}