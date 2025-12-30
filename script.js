
document.addEventListener('DOMContentLoaded', () => {
  // Timestamp
  const submittedAt = document.getElementById('submitted_at');
  if (submittedAt) submittedAt.value = new Date().toISOString();

  // Warunkowe sekcje: usage[]
  const usageCheckboxes = document.querySelectorAll('input[name="usage[]"]');
  const conditionalBlocks = document.querySelectorAll('.cond');
  function updateUsageConditions() {
    const selected = new Set(Array.from(usageCheckboxes).filter(c => c.checked).map(c => c.value));
    conditionalBlocks.forEach(block => {
      const cond = block.getAttribute('data-condition');
      block.hidden = !selected.has(cond);
    });
  }
  usageCheckboxes.forEach(cb => cb.addEventListener('change', updateUsageConditions));
  updateUsageConditions();

  // Storage details toggle
  const osPrefRadios = document.querySelectorAll('input[name="os_drive_pref"]');
  const storageDetails = document.getElementById('storage-details');
  function updateStorage() {
    const val = Array.from(osPrefRadios).find(r => r.checked)?.value;
    storageDetails.hidden = (val !== 'Tak');
  }
  osPrefRadios.forEach(r => r.addEventListener('change', updateStorage));

  // Monitor details toggle
  const monitorRadios = document.querySelectorAll('input[name="monitor_consult"]');
  const monitorDetails = document.getElementById('monitor-details');
  function updateMonitor() {
    const val = Array.from(monitorRadios).find(r => r.checked)?.value;
    monitorDetails.hidden = (val !== 'Tak');
  }
  monitorRadios.forEach(r => r.addEventListener('change', updateMonitor));

  // Submit
  const form = document.getElementById('pc-form');
  const status = document.getElementById('status');
  const submitBtn = document.getElementById('submit-btn');
  const thanks = document.getElementById('thanks');

  async function handleSubmit(event) {
    event.preventDefault();
    status.textContent = '';
    submitBtn.disabled = true;

    const formData = new FormData(form);

    // Zbierz wielokrotne pola jako CSV-friendly
    const usage = formData.getAll('usage[]').join('; ');
    const gamingKinds = formData.getAll('gaming_kinds[]').join('; ');

    formData.delete('usage[]'); formData.set('usage', usage);
    formData.delete('gaming_kinds[]'); formData.set('gaming_kinds', gamingKinds);

    // E-mail required
    const email = formData.get('contact_email');
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      status.textContent = 'Podaj poprawny adres e‑mail (pole jest wymagane).';
      submitBtn.disabled = false;
      return;
    }

    // JSON payload
    const payload = {};
    for (const [key, value] of formData.entries()) {
      payload[key] = value;
    }

    try {
      const resp = await fetch(form.action, {
        method: form.method,
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (resp.ok) {
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

  form.addEventListener('submit', handleSubmit);
});
