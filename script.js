
// Tryb Bazowy — brak innych formularzy
document.addEventListener('DOMContentLoaded', () => {
  const sb = document.getElementById('submitted_at_b');
  if (sb) sb.value = new Date().toISOString();
  const form = document.getElementById('form-bazowy');

  function bindUsageConditions() {
    const usage = form.querySelectorAll('input[name="usage[]"]');
    const blocks = form.querySelectorAll('.cond');
    function update() {
      const selected = new Set(Array.from(usage).filter(c => c.checked).map(c => c.value));
      blocks.forEach(b => {
        const cond = b.getAttribute('data-condition');
        const show = selected.has(cond);
        b.hidden = !show;
        b.classList.toggle('show', show);
      });
    }
    usage.forEach(cb => cb.addEventListener('change', update));
    update();
  }

  function bindDataToggles() {
    const toggles = form.querySelectorAll('[data-toggle]');
    const groups = new Map();
    toggles.forEach(el => {
      const name = el.getAttribute('name') || el.id || Math.random().toString(36).slice(2);
      if (!groups.has(name)) groups.set(name, []);
      groups.get(name).push(el);
    });
    groups.forEach((els) => {
      function update() {
        els.forEach(el => {
          const targetSel = el.getAttribute('data-target');
          const showWhen = el.getAttribute('data-show-when');
          const target = form.querySelector(targetSel);
          if (!target) return;
          let shouldShow = false;
          const type = el.getAttribute('data-toggle');
          if (type === 'radio') {
            const n = el.getAttribute('name');
            const checked = form.querySelector(`input[name="${n}"]:checked`);
            shouldShow = !!checked && checked.value === showWhen;
          } else if (type === 'checkbox') {
            shouldShow = el.checked && el.value === showWhen;
          }
          target.hidden = !shouldShow;
          target.classList.toggle('show', shouldShow);
          if (shouldShow) target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
      }
      els.forEach(el => el.addEventListener('change', update));
      update();
    });
  }

  function bindCaseInfo() {
    const infoText = document.getElementById('case-info-text');
    const radios = form.querySelectorAll('input[name="case_size"]');
    const map = {
      'Mini‑ITX (Mini)': 'Najmniejsza obudowa: 1 slot GPU, ostrożnie z chłodzeniem i wysokością coolera.',
      'mATX (Mały)': 'Mały, ale elastyczny: więcej slotów niż ITX, rozsądny airflow, nadal kompakt.',
      'ATX (Standardowy)': 'Uniwersalny wybór: pełna kompatybilność, dobra rozbudowa, wygodny montaż.',
      'Full Tower (Duży)': 'Najwięcej miejsca: świetny airflow, LC, wiele dysków, duże GPU, łatwa rozbudowa/cisza.',
      'Bez znaczenia': 'Dobierzemy rozmiar do Twoich potrzeb: airflow vs. cisza, miejsce na GPU/dyski, budżet i przyszła rozbudowa.'
    };
    function update() {
      const checked = form.querySelector('input[name="case_size"]:checked');
      infoText.textContent = checked ? (map[checked.value] || infoText.textContent)
                                     : 'Wybierz rozmiar po lewej — tutaj pokażemy krótki opis praktycznych zastosowań.';
    }
    radios.forEach(r => r.addEventListener('change', update));
    update();
  }

  function setupProgress() {
    const stepEl = document.getElementById('progress-step');
    const totalEl = document.getElementById('progress-total');
    const fillEl = document.querySelector('.progress-fill');
    const sections = Array.from(form.querySelectorAll('section.block'));
    const total = sections.length;
    if (totalEl) totalEl.textContent = total;
    function setProg(i) {
      const s = Math.min(Math.max(i, 1), total);
      if (stepEl) stepEl.textContent = s;
      if (fillEl) fillEl.style.width = Math.round((s / total) * 100) + '%';
    }
    const observer = new IntersectionObserver(entries => {
      let top = null;
      entries.forEach(e => {
        if (e.isIntersecting) {
          const step = Number(e.target.getAttribute('data-step'));
          const rect = e.target.getBoundingClientRect();
          const vis = Math.max(0, Math.min(window.innerHeight, rect.bottom) - Math.max(0, rect.top));
          top = (!top || vis > top.vis) ? { step, vis } : top;
        }
      });
      if (top) setProg(top.step);
    }, { threshold: [0.3, 0.6] });
    sections.forEach(sec => observer.observe(sec));
    setProg(1);
  }

  function bindSubmit() {
    const status = document.getElementById('status');
    const btn = document.getElementById('submit-btn-b');
    const thanks = document.getElementById('thanks');
    const form = document.getElementById('form-bazowy');
    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      if (status) status.textContent = '';
      if (btn) btn.disabled = true;
      const fd = new FormData(form);
      const usage = fd.getAll('usage[]').join('; ');
      const gamingKinds = fd.getAll('gaming_kinds[]').join('; ');
      if (usage) { fd.delete('usage[]'); fd.set('usage', usage); }
      if (gamingKinds) { fd.delete('gaming_kinds[]'); fd.set('gaming_kinds', gamingKinds); }
      const email = fd.get('contact_email');
      if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
        if (status) status.textContent = 'Podaj poprawny adres e‑mail (pole jest wymagane).';
        if (btn) btn.disabled = false;
        return;
      }
      const payload = {}; for (const [k, v] of fd.entries()) payload[k] = v;
      try {
        const resp = await fetch(form.action, {
          method: form.method,
          headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (resp.ok) { form.hidden = true; if (thanks) thanks.hidden = false; }
        else {
          const data = await resp.json().catch(() => ({}));
          if (status) status.textContent = (data && data.error) ? `Błąd: ${data.error}` : 'Wystąpił problem z wysyłką.';
        }
      } catch (e) {
        if (status) status.textContent = 'Brak połączenia lub błąd po stronie usługi.';
      } finally {
        if (btn) btn.disabled = false;
      }
    });
  }

  bindUsageConditions();
  bindDataToggles();
  bindCaseInfo();
  setupProgress();
  bindSubmit();
});
