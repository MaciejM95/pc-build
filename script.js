
document.addEventListener('DOMContentLoaded', () => {
  // timestamps
  const ts = new Date().toISOString();
  ['submitted_at_b','submitted_at_p','submitted_at_s'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=ts; });

  // mode switch
  const modeNote = document.getElementById('mode-note');
  const modeRadios = document.querySelectorAll('input[name="build_mode"]');
  const forms = { Bazowy: document.getElementById('form-bazowy'), Pro: document.getElementById('form-pro'), SimRig: document.getElementById('form-simrig') };
  const modeTexts = {
    Bazowy: 'prosty dobór bez szczegółowej konfiguracji podzespołów.',
    Pro: 'szczegółowe wybory poszczególnych podzespołów.',
    SimRig: 'builder zestawu do symracingu.'
  };
  function switchMode(val){
    Object.keys(forms).forEach(k=>{ const f=forms[k]; if(!f) return; f.hidden = (k!==val); });
    if(modeNote) modeNote.innerHTML = `Tryb <strong>${val}</strong> — ${modeTexts[val]}`;
    setupProgress();
    bindForVisibleForm();
  }
  modeRadios.forEach(r=>r.addEventListener('change',e=>switchMode(e.target.value)));
  switchMode(Array.from(modeRadios).find(r=>r.checked)?.value || 'Bazowy');

  // Progress bar per visible form
  let observer; function setupProgress(){
    const stepEl=document.getElementById('progress-step'); const totalEl=document.getElementById('progress-total'); const fillEl=document.querySelector('.progress-fill');
    const visForm = Object.values(forms).find(f=>f && !f.hidden); if(!visForm) return;
    const sections = Array.from(visForm.querySelectorAll('section.block')); const total = sections.length;
    if(totalEl) totalEl.textContent = total;
    function setProg(i){ const s=Math.min(Math.max(i,1),total); if(stepEl) stepEl.textContent=s; if(fillEl) fillEl.style.width = Math.round((s/total)*100)+'%'; }
    if(observer) observer.disconnect();
    observer = new IntersectionObserver((entries)=>{
      let top=null; entries.forEach(e=>{ if(e.isIntersecting){ const step=Number(e.target.getAttribute('data-step')); const rect=e.target.getBoundingClientRect(); const vis=Math.max(0,Math.min(window.innerHeight,rect.bottom)-Math.max(0,rect.top)); top = (!top||vis>top.vis)?{step,vis}:top; } });
      if(top) setProg(top.step);
    }, { threshold:[0.3,0.6] });
    sections.forEach(sec=>observer.observe(sec)); setProg(1);
  }

  // Generic data-toggle handler + visual feedback (Alt B)
  function bindDataToggles(root){
    const toggles = root.querySelectorAll('[data-toggle]');
    toggles.forEach(el => {
      const targetSel = el.getAttribute('data-target');
      const showWhen = el.getAttribute('data-show-when');
      const target = root.querySelector(targetSel);
      if(!target) return;
      function update(){
        const type = el.getAttribute('data-toggle');
        let shouldShow = false;
        if(type === 'radio'){
          const groupName = el.getAttribute('name');
          const checked = root.querySelector(`input[name="${groupName}"]:checked`);
          shouldShow = (checked && checked.value === showWhen);
        } else if(type === 'checkbox'){
          shouldShow = el.checked && el.value === showWhen;
        }
        target.hidden = !shouldShow;
        target.classList.toggle('show', shouldShow); // fade-in class
        if(shouldShow){ target.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
      }
      el.addEventListener('change', update);
      // Initialize once per group (for radios, use first element)
      update();
    });
  }

  // Bind usage conditional (Bazowy)
  function bindUsageConditions(root){
    const usage = root.querySelectorAll('input[name="usage[]"]');
    const blocks = root.querySelectorAll('.cond');
    function update(){
      const selected = new Set(Array.from(usage).filter(c=>c.checked).map(c=>c.value));
      blocks.forEach(b=>{ const cond=b.getAttribute('data-condition'); b.hidden = !selected.has(cond); b.classList.toggle('show', selected.has(cond)); });
    }
    usage.forEach(cb=>cb.addEventListener('change',update));
    update();
  }

  // Case info binding (compact pills)
  function bindCaseInfo(root){
    const caseInfoText = document.getElementById('case-info-text');
    const caseRadios = root.querySelectorAll('input[name="case_size"]');
    const caseMap = {
      'Mini‑ITX (Mini)': 'Najmniejsza obudowa: 1 slot GPU, ograniczone chłodzenie — najlepsza do kompaktów.',
      'mATX (Mały)': 'Mały, ale elastyczny: więcej slotów niż ITX, sensowny airflow, nadal kompakt.',
      'ATX (Standardowy)': 'Najbardziej uniwersalny: pełna kompatybilność, rozbudowa, dobre chłodzenie.',
      'Full Tower (Duży)': 'Najwięcej miejsca: świetny airflow, LC, wiele dysków, duże GPU; idealny do rozbudowy/ciszy.'
    };
    function updCase(){ const v = Array.from(caseRadios).find(r=>r.checked)?.value; if(caseInfoText) caseInfoText.textContent = caseMap[v] || 'Wybierz rozmiar po lewej — tutaj pokażemy opis.'; }
    caseRadios.forEach(r=>r.addEventListener('change',updCase));
    updCase();
  }

  // Bind everything for current visible form
  function bindForVisibleForm(){
    const form = Object.values(forms).find(f=>f && !f.hidden); if(!form) return;
    bindDataToggles(form);
    bindUsageConditions(form);
    bindCaseInfo(form);
  }

  // Submit handlers (unchanged)
  function bindSubmit(form, btnId){ if(!form) return; const status=document.getElementById('status'); const btn=form.querySelector('#'+btnId); const thanks=document.getElementById('thanks');
    async function onSubmit(ev){ ev.preventDefault(); if(status) status.textContent=''; if(btn) btn.disabled=true;
      const fd=new FormData(form);
      const usage = fd.getAll('usage[]').join('; '); if(usage){ fd.delete('usage[]'); fd.set('usage', usage); }
      const gamingKinds = fd.getAll('gaming_kinds[]').join('; '); if(gamingKinds){ fd.delete('gaming_kinds[]'); fd.set('gaming_kinds', gamingKinds); }
      const simTitles = fd.getAll('sim_titles[]').join('; '); if(simTitles){ fd.delete('sim_titles[]'); fd.set('sim_titles', simTitles); }
      const email = fd.get('contact_email'); if(!email || !/^\S+@\S+\.\S+$/.test(email)){ if(status) status.textContent='Podaj poprawny adres e‑mail (pole jest wymagane).'; if(btn) btn.disabled=false; return; }
      const payload={}; for(const [k,v] of fd.entries()) payload[k]=v;
      try{ const resp=await fetch(form.action,{ method:form.method, headers:{'Accept':'application/json','Content-Type':'application/json'}, body:JSON.stringify(payload)});
        if(resp.ok){ form.hidden=true; if(thanks) thanks.hidden=false; } else { const data=await resp.json().catch(()=>({})); if(status) status.textContent=(data&&data.error)?`Błąd: ${data.error}`:'Wystąpił problem z wysyłką.'; }
      } catch(e){ if(status) status.textContent='Brak połączenia lub błąd po stronie usługi.'; } finally { if(btn) btn.disabled=false; }
    }
    form.addEventListener('submit', onSubmit);
  }

  bindSubmit(forms.Bazowy, 'submit-btn-b');
  bindSubmit(forms.Pro, 'submit-btn-p');
  bindSubmit(forms.SimRig, 'submit-btn-s');
});
