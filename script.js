// Uzupełnia timestamp (ISO) do CSV/meta
document.addEventListener('DOMContentLoaded', () => {
  const submittedAt = document.getElementById('submitted_at');
  if (submittedAt) {
    submittedAt.value = new Date().toISOString();
  }

  // Limit maksymalnie 2 zaznaczenia w sekcji priorytetów
  const priorityGrid = document.querySelector('.grid[data-max="2"]');
  const priorityWarning = document.getElementById('priority-warning');
  if (priorityGrid) {
    const checkboxes = priorityGrid.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(cb => {
      cb.addEventListener('change', () => {
        const selected = Array.from(checkboxes).filter(c => c.checked);
        if (selected.length > 2) {
          cb.checked = false;
          priorityWarning.textContent = 'Możesz wybrać maksymalnie 2 priorytety.';
        } else {
          priorityWarning.textContent = '';
        }
      });
    });
  }

  // Usprawnienie UX wysyłki przez Formspree — bez przeładowania + pokazanie "Dziękuję"
  const form = document.getElementById('pc-form');
  const status = document.getElementById('status');
  const submitBtn = document.getElementById('submit-btn');
  const thanks = document.getElementById('thanks');

  async function handleSubmit(event) {
    event.preventDefault();
    status.textContent = '';
    submitBtn.disabled = true;

    const formData = new FormData(form);

    // Zbierz wielokrotne pola jako CSV-friendly string
    const usage = formData.getAll('usage[]').join('; ');
    const gaming = formData.getAll('gaming[]').join('; ');
    const priority = formData.getAll('priority[]').join('; ');

    // Nadpisz scalonymi wartościami (dla łatwego importu do Excela)
    formData.delete('usage[]'); formData.set('usage', usage);
    formData.delete('gaming[]'); formData.set('gaming', gaming);
    formData.delete('priority[]'); formData.set('priority', priority);

    // Wymagany e-mail — sprawdzenie dodatkowe
    const email = formData.get('contact_email');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      status.textContent = 'Podaj poprawny adres e‑mail (pole jest wymagane).';
      submitBtn.disabled = false;
      return;
    }

    // Wyślij jako JSON (Formspree akceptuje JSON dla endpointów v2)
    const plainObject = {};
    for (const [key, value] of formData.entries()) {
      plainObject[key] = value;
    }

    try {
      const resp = await fetch(form.action, {
        method: form.method,
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(plainObject)
      });

      if (resp.ok) {
        // Pokaż "Dziękuję, odpowiem w ciągu jednego dnia"
        form.hidden = true;
        if (thanks) thanks.hidden = false;
      } else {
        const data = await resp.json().catch(() => ({}));
        status.textContent = (data && data.error) ? `Błąd: ${data.error}` : 'Wystąpił problem z wysyłką.';
      }
    } catch (e) {
      status.textContent = 'Brak połączenia lub błąd po stronie usługi.';
    } finally {
      submitBtn.disabled = false;
    }
  }

  if (form) {
    form.addEventListener('submit', handleSubmit);
  }
});
