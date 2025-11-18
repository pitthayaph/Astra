document.addEventListener("DOMContentLoaded", () => {

  // ---------------- NAV MENU TOGGLE ----------------
  const navToggle = document.querySelector(".nav-toggle");
  const navMenu = document.querySelector(".nav-menu");

  navToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    navMenu.classList.toggle("active");
  });

  const navLinks = document.querySelectorAll(".nav-menu a");
  navLinks.forEach(link => {
    link.addEventListener("click", () => {
      navMenu.classList.remove("active");
    });
  });

  document.addEventListener("click", (e) => {
    if (navMenu.classList.contains("active") &&
        !navMenu.contains(e.target) &&
        !navToggle.contains(e.target)) {
      navMenu.classList.remove("active");
    }
  });

  // ---------------- BACKGROUND ----------------
  const heroSection = document.querySelector('.hero-section');
  const bgDiv = document.createElement('div');
  bgDiv.classList.add('hero-bg');
  heroSection.appendChild(bgDiv);

  async function fetchRandomImage() {
    try {
      const res = await fetch("https://astra-one-coral.vercel.app/api/background");
      const data = await res.json();
      return data.imageUrl; // ตรวจว่า backend ส่ง imageUrl กลับมาจริงไหม
    } catch (err) {
      console.error("เกิดข้อผิดพลาดในการโหลดภาพ:", err);
      return null;
    }
  }

  async function changeBackground() {
    const imageUrl = await fetchRandomImage();
    if (imageUrl) {
      bgDiv.style.backgroundImage = `url(${imageUrl})`;
    }
  }

  changeBackground();
  setInterval(changeBackground, 30000); // เปลี่ยนทุก 30 วิ
});

// ---------------- ฟังก์ชันเปลี่ยนภาษา ----------------
function getLang() {
  return localStorage.getItem("lang") || "th";
}

function applyLang(lang) {
  localStorage.setItem("lang", lang);
  document.documentElement.setAttribute("lang", lang);

  const elements = document.querySelectorAll("[data-lang]");
  elements.forEach(el => {
    const text = el.getAttribute(`data-${lang}`);
    if (text) el.textContent = text;
  });
}
