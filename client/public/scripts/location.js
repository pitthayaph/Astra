document.addEventListener("DOMContentLoaded", () => {
  const placeInput = document.getElementById('placeOfBirth');
  const suggestionsList = document.getElementById('suggestions');
  const latInput = document.getElementById('latitude');
  const lonInput = document.getElementById('longitude');
  let debounceTimer;

  const userLang = navigator.language.startsWith('th') ? 'th' : 'en';

  placeInput.addEventListener('input', () => {
    const query = placeInput.value.trim();
    clearTimeout(debounceTimer);

    if (query.length < 2) {
      suggestionsList.style.display = "none";
      return;
    }

    debounceTimer = setTimeout(async () => {
      try {
        const res = await fetch(`https://astra-one-coral.vercel.app/api/geo/autocomplete?q=${encodeURIComponent(query)}`);

        const data = await res.json();

        suggestionsList.innerHTML = "";
        if (!data.results || data.results.length === 0) {
          suggestionsList.style.display = "none";
          return;
        }

        data.results.forEach(place => {
          const li = document.createElement("li");
          li.textContent = place.formatted;
          li.style.padding = "5px";
          li.style.cursor = "pointer";
          li.onclick = () => {
            placeInput.value = place.formatted;
            latInput.value = place.lat;
            lonInput.value = place.lon;
            placeInput.dataset.lat = place.lat;
            placeInput.dataset.lon = place.lon;
            suggestionsList.style.display = "none";
            console.log("Selected:", place);
          };
          suggestionsList.appendChild(li);
        });

        suggestionsList.style.display = "block";
      } catch (err) {
        console.error("Geo backend error:", err);
      }
    }, 300);
  });

  document.addEventListener('click', (e) => {
    if (!placeInput.contains(e.target) && !suggestionsList.contains(e.target)) {
      suggestionsList.style.display = "none";
    }
    });
});
