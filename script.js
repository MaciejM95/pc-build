
document.addEventListener('DOMContentLoaded', () => {
  // Timestamp per form
  const ts = new Date().toISOString();
  const sb = document.getElementById('submitted_at_b');
  const sp = document.getElementById('submitted_at_p');
  const ss = document.getElementById('submitted_at_s');
  if (sb) sb.value = ts; if (sp) sp.value = ts; if (ss) ss.value = ts;

  // Mode switching
  const modeNote = document.getElementById('mode-note');
  const modeRadios = document.querySelectorAll('input[name="build_mode"]');
  const forms = {
    'Bazowy': document.getElementById('form-bazowy'),
    'Pro': document.getElementById('form-pro'),
    'SimRig': document.getElementById('form-simrig')
  };
  const modeTexts = {
    'Bazowy': 'prosty dobór bez szczegółowej konfiguracji podzespołów.',
    'Pro': 'szczegółowe wybory poszczególnych podzespołów (CPU/GPU/RAM/Storage/MB/Chłodzenie/PSU/Case/Budżet).',
    'SimRig': 'builder zestawu do symracingu (gry, wyświetlanie, cele GPU/CPU, akcesoria).'
  };

  function switchMode(val) {
    Object.keys(forms).forEach(k => {
      const f = forms[k]; if (!f) return; f.hidden = (k !== val);
    });
    if (modeNote) modeNote.innerHTML = `Tryb <strong>${val}</strong> — ${modeTexts[val]}`;
    setupProgress();
  }
  modeRadios.forEach(r => r.addEventListener('change', (e) => switchMode(e.target.value)));
  switchMode(Array.from(modeRadios).find(r => r.checked)?.value || 'Bazowy');

  // Bind usage conditional (Bazowy)
  function bindUsageConditions(formEl) {
    const usageCheckboxes = formEl.querySelectorAll('input[name="usage[]"]');
    const conditionalBlocks = formEl.querySelectorAll('.cond');
    function updateUsageConditions() {
      const selected = new Set(Array.from(usageCheckboxes).filter(c => c.checked).map(c => c.value));
      conditionalBlocks.forEach(block => {
        const cond = block.getAttribute('data-condition');
        block.hidden = !selected.has(cond);
      });
    }
    usageCheckboxes.forEach(cb => cb.addEventListener('change', updateUsageConditions));
    updateUsageConditions();
  }
  if (forms['Bazowy']) bindUsageConditions(forms['Bazowy']);

  // Storage details toggle (any form containing os_drive_pref)
  function bindStorageToggle(formEl) {
    const osPrefRadios = formEl.querySelectorAll('input[name="os_drive_pref"]');
    const storageDetails = formEl.querySelector('#storage-details');
    if (!osPrefRadios.length || !storageDetails) return;
    function updateStorage() {
      const val = Array.from(osPrefRadios).find(r => r.checked)?.value;
      storageDetails.hidden = (val !== 'Tak');
    }
    osPrefRadios.forEach(r => r.addEventListener('change', updateStorage));
    updateStorage();
  }
  Object.values(forms).forEach(f => f && bindStorageToggle(f));

  // Monitor details toggle (Bazowy)
  function bindMonitorToggle(formEl) {
    const monitorRadios = formEl.querySelectorAll('input[name="monitor_consult"]');
    const monitorDetails = formEl.querySelector('#monitor-details');
    if (!monitorRadios.length || !monitorDetails) return;
    function updateMonitor() {
      const val = Array.from(monitorRadios).find(r => r.checked)?.value;
      monitorDetails.hidden = (val !== 'Tak');
    }
    monitorRadios.forEach(r => r.addEventListener('change', updateMonitor));
    updateMonitor();
  }
  if (forms['Bazowy']) bindMonitorToggle(forms['Bazowy']);

  // Progress bar per visible form
  let observer;
  function setupProgress() {
    const progressStepEl = document.getElementById('progress-step');
    const progressTotalEl = document.getElementById('progress-total');
    const progressFillEl = document.querySelector('.progress-fill');
    const visibleForm = Object.values(forms).find(f => f && !f.hidden);
    if (!visibleForm) return;
    const sections = Array.from(visibleForm.querySelectorAll('section.block'));
    const totalSteps = sections.length;
    if (progressTotalEl) progressTotalEl.textContent = totalSteps;

    function setProgress(stepIndex) {
      const step = Math.min(Math.max(stepIndex, 1), totalSteps);
      if (progressStepEl) progressStepEl.textContent = step;
      const pct = Math.round((step / totalSteps) * 100);
      if (progressFillEl) progressFillEl.style.width = pct + '%';
    }

    if (observer) observer.disconnect();
    observer = new IntersectionObserver((entries) => {
      let topMost = null;
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const stepAttr = entry.target.getAttribute('data-step');
          const rect = entry.target.getBoundingClientRect();
          const visible = Math.max(0, Math.min(window.innerHeight, rect.bottom) - Math.max(0, rect.top));
          topMost = (!topMost || visible > topMost.visible) ? { step: Number(stepAttr), visible } : topMost;
        }
      });
      if (topMost) setProgress(topMost.step);
    }, { root: null, threshold: [0.3, 0.6] });

    sections.forEach(sec => observer.observe(sec));
    setProgress(1);
  }

  setupProgress();

  // Submit handlers for 3 forms
  function bindSubmit(formEl, submitBtnId) {
    const status = document.getElementById('status');
    const submitBtn = formEl.querySelector('#' + submitBtnId);
    const thanks = document.getElementById('thanks');
    async function handleSubmit(event) {
      event.preventDefault();
      if (status) status.textContent = '';
      if (submitBtn) submitBtn.disabled = true;

      const formData = new FormData(formEl);
      // Arrays to CSV
      const usage = formData.getAll('usage[]').join('; ');
      const gamingKinds = formData.getAll('gaming_kinds[]').join('; ');
      const simTitles = formData.getAll('sim_titles[]').join('; ');
      if (usage) { formData.delete('usage[]'); formData.set('usage', usage); }
      if (gamingKinds) { formData.delete('gaming_kinds[]'); formData.set('gaming_kinds', gamingKinds); }
      if (simTitles) { formData.delete('sim_titles[]'); formData.set('sim_titles', simTitles); }

      // E-mail required
      const email = formData.get('contact_email');
      if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
        if (status) status.textContent = 'Podaj poprawny adres e‑mail (pole jest wymagane).';
        if (submitBtn) submitBtn.disabled = false;
        return;
      }

      const payload = {}; for (const [key, value] of formData.entries()) payload[key] = value;
      try {
        const resp = await fetch(formEl.action, {
          method: formEl.method,
          headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (resp.ok) { formEl.hidden = true; if (thanks) thanks.hidden = false; }
        else {
          const data = await resp.json().catch(() => ({}));
          if (status) status.textContent = (data && data.error) ? `Błąd: ${data.error}` : 'Wystąpił problem z wysyłką.';
        }
      } catch (e) {
        if (status) status.textContent = 'Brak połączenia lub błąd po stronie usługi.';
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    }
    formEl.addEventListener('submit', handleSubmit);
  }

  bindSubmit(forms['Bazowy'], 'submit-btn-b');
  bindSubmit(forms['Pro'], 'submit-btn-p');
  bindSubmit(forms['SimRig'], 'submit-btn-s');
});
