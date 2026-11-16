(() => {
  'use strict';
  const STORAGE_KEY = 'porashala-exams-v1';
  const colors = [
    ['#6253d8','#f0eeff'], ['#e17b58','#fff0e8'], ['#319276','#e6f7f0'],
    ['#c45483','#fff0f5'], ['#bd8b28','#fff7df'], ['#4380bd','#edf5ff']
  ];
  const bnDigits = value => String(value).replace(/\d/g, digit => '০১২৩৪৫৬৭৮৯'[digit]);
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const formatDate = value => {
    if (!value) return 'তারিখ উল্লেখ নেই';
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('bn-BD', {day:'numeric', month:'short', year:'numeric'}).format(date);
  };
  const demo = [
    {id:'sample-bangla',title:'বাংলা ভাষা ও সাহিত্য',subject:'বাংলা',date:'2026-11-20',chapter:'ভাষা আন্দোলন',questions:[{text:'ভাষা আন্দোলনের প্রথম শহীদ কে ছিলেন?',answer:'রফিকউদ্দিন আহমেদ (রফিক) ভাষা আন্দোলনের প্রথম শহীদ হিসেবে পরিচিত।'},{text:'আন্তর্জাতিক মাতৃভাষা দিবস কবে পালিত হয়?',answer:'প্রতি বছর ২১ ফেব্রুয়ারি আন্ত���্জাতিক মাতৃভাষা দিবস পালিত হয়।'},{text:'বাংলা ভাষার প্রথম ব্যাকরণ কে রচনা করেন?',answer:''}]},
    {id:'sample-science',title:'বিজ্ঞানের মজার প্রশ্ন',subject:'বিজ্ঞান',date:'2026-11-22',chapter:'উদ্ভিদ ও পরিবেশ',questions:[{text:'সালোকসংশ্লেষণ কী?',answer:'যে প্রক্রিয়ায় সবুজ উদ্ভিদ সূর্যালোকের সাহায্যে পানি ও কার্বন ডাই-অক্সাইড থেকে খাদ্য তৈরি করে, তাকে সালোকসংশ্লেষণ বলে।'},{text:'উদ্ভিদ মাটি থেকে পানি শোষণ করে কোন অংশের সাহায্যে?',answer:'উদ্ভিদ মূলের সাহায্যে মাটি থেকে পানি ও খনিজ লবণ শোষণ করে।'},{text:'পরিবেশ রক্ষায় গাছের দুটি উপকারিতা লেখো।',answer:''}]},
    {id:'sample-math',title:'দৈনন্দিন জীবনের গণিত',subject:'গণিত',date:'2026-11-25',chapter:'শতকরা ও অনুপাত',questions:[{text:'শতকরা বলতে কী বোঝায়?',answer:'প্রতি ১০০-তে কোনো পরিমাণের অংশকে শতকরা বলে।'},{text:'একটি পণ্যের দাম ২০০ টাকা। ১০% ছাড়ে দাম কত হবে?',answer:'ছাড় ২০ টাকা, তাই ছাড়ের পর দাম ১৮০ টাকা।'}]}
  ];
  function readExams() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.filter(isValidExam);
      }
    } catch (error) { console.warn('পরীক্ষার ডেটা পড়া যায়নি:', error); }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(demo));
    return demo.map(exam => ({...exam, questions:exam.questions.map(question => ({...question}))}));
  }
  function isValidExam(exam) { return exam && typeof exam.title === 'string' && typeof exam.subject === 'string' && Array.isArray(exam.questions) && exam.questions.length > 0 && exam.questions.every(question => question && typeof question.text === 'string'); }
  let exams = readExams();
  let activeExam = null;
  let toastTimer;
  const $ = selector => document.querySelector(selector);
  const grid = $('#exam-grid');
  const search = $('#search-input');
  const subjectFilter = $('#subject-filter');
  const adminDialog = $('#admin-dialog');
  const examDialog = $('#exam-dialog');
  const toast = $('#toast');

  function saveExams() { localStorage.setItem(STORAGE_KEY, JSON.stringify(exams)); render(); }
  function notify(message) { toast.textContent = message; toast.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 2600); }
  function render() {
    const subjects = [...new Set(exams.map(exam => exam.subject).filter(Boolean))].sort((a,b) => a.localeCompare(b,'bn'));
    const selected = subjectFilter.value;
    subjectFilter.innerHTML = '<option value="">সব বিষয়</option>' + subjects.map(subject => `<option value="${escapeHtml(subject)}">${escapeHtml(subject)}</option>`).join('');
    subjectFilter.value = subjects.includes(selected) ? selected : '';
    const term = search.value.trim().toLocaleLowerCase();
    const filtered = exams.filter(exam => (!subjectFilter.value || exam.subject === subjectFilter.value) && (!term || [exam.title,exam.subject,exam.chapter].some(value => String(value || '').toLocaleLowerCase().includes(term))));
    $('#exam-count').textContent = bnDigits(exams.length);
    $('#result-count').textContent = bnDigits(filtered.length);
    grid.innerHTML = filtered.map(exam => {
      const color = colors[Math.abs([...exam.id].reduce((sum,char) => sum + char.charCodeAt(0),0)) % colors.length];
      return `<article class="exam-card" style="--accent:${color[0]};--soft:${color[1]}"><div class="card-top"><span class="subject-pill">${escapeHtml(exam.subject)}</span><button class="card-more" data-delete="${escapeHtml(exam.id)}" aria-label="${escapeHtml(exam.title)} মুছুন" title="এই ব্রাউজার থেকে পরীক্ষা মুছুন">···</button></div><h3>${escapeHtml(exam.title)}</h3><p class="chapter">${exam.chapter ? `অধ্যায়: ${escapeHtml(exam.chapter)}` : 'ছোট প্রশ্নের অনুশীলন'}</p><div class="card-meta"><span>▤ ${bnDigits(exam.questions.length)}টি প্রশ্ন</span><span>◷ ${escapeHtml(formatDate(exam.date))}</span></div><div class="card-bottom"><span class="question-count">নিজের ভাষায় উত্তর দিন</span><button class="take-link" data-take="${escapeHtml(exam.id)}">পরীক্ষা দিন ↗</button></div></article>`;
    }).join('');
    $('#empty-state').hidden = filtered.length !== 0;
    grid.hidden = filtered.length === 0;
  }

  function parseTextFile(text) {
    const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/);
    const data = {title:'',subject:'',date:'',chapter:'',questions:[]};
    let inQuestions = false;
    let current = null;
    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue;
      const meta = line.match(/^(পরীক্ষার নাম|নাম|বিষয়|বিষয়|তারিখ|অধ্যায়|অধ্যায়)\s*[:：]\s*(.*)$/i);
      if (meta) {
        if (current) { data.questions.push(current); current = null; }
        const key = meta[1];
        if (/^(পরীক্ষার নাম|নাম)$/i.test(key)) data.title = meta[2];
        else if (/^(বিষয়|বিষয়)$/i.test(key)) data.subject = meta[2];
        else if (key === 'তারিখ') data.date = meta[2];
        else data.chapter = meta[2];
        continue;
      }
      if (/^(প্রশ্ন|questions?)\s*[:：]?$/i.test(line)) { inQuestions = true; continue; }
      const questionMatch = line.match(/^(?:প্রশ্ন\s*)?\d+\s*[.)।:：-]\s*(.+)$/);
      if (questionMatch) {
        if (current) data.questions.push(current);
        current = {text:questionMatch[1].trim(),answer:''};
        inQuestions = true;
        continue;
      }
      const answerMatch = line.match(/^(?:উত্তর|answer)\s*[:：]\s*(.*)$/i);
      if (answerMatch && current) { current.answer = answerMatch[1].trim(); continue; }
      if (current && !inQuestions) current.text += `\n${line}`;
      else if (current && /^(?:উত্তর|answer)\s*[:：]/i.test(line)) current.answer = line.replace(/^(?:উত্তর|answer)\s*[:：]\s*/i,'');
      else if (current) current.text += `\n${line}`;
    }
    if (current) data.questions.push(current);
    return data;
  }

  function openExam(id) {
    activeExam = exams.find(exam => exam.id === id);
    if (!activeExam) return;
    renderQuiz();
    examDialog.showModal();
  }
  function renderQuiz(result = null) {
    if (!activeExam) return;
    const exam = activeExam;
    const answers = result?.answers || [];
    const answered = result ? answers.filter(answer => answer.trim()).length : 0;
    const blank = exam.questions.length - answered;
    const dateLine = [exam.subject, exam.chapter, formatDate(exam.date)].filter(Boolean).join(' · ');
    const header = `<div class="exam-view-head"><div><span class="eyebrow eyebrow-dark">${escapeHtml(exam.subject)}</span><h2>${escapeHtml(exam.title)}</h2><p>${escapeHtml(dateLine)}</p></div><button class="icon-button" data-close="exam-dialog" aria-label="বন্ধ করুন">×</button></div>`;
    if (result) {
      const answersHtml = exam.questions.map((question,index) => `<section class="question-block"><h3><span class="question-number">${bnDigits(index+1)}.</span>${escapeHtml(question.text).replace(/\n/g,'<br>')}</h3><div class="answer-key"><b>আপনার উত্তর</b><p>${answers[index].trim() ? escapeHtml(answers[index]).replace(/\n/g,'<br>') : 'এই প্রশ্নটি ফাঁকা রেখেছেন।'}</p></div>${question.answer?.trim() ? `<div class="answer-key"><b>সঠিক / নমুনা উত্তর</b><p>${escapeHtml(question.answer).replace(/\n/g,'<br>')}</p></div>` : '<div class="answer-missing">এই প্রশ্নের উত্তরসূচি এখনো যোগ করা হয়নি।</div>'}</section>`).join('');
      $('#exam-view').innerHTML = `${header}<div class="result-banner"><span class="result-symbol">✦</span><div><h3>পরীক্ষা সম্পন্ন হয়েছে!</h3><p>আপনার চেষ্টা চালিয়ে যান—অনুশীলনেই উন্নতি।</p></div><div class="result-score"><b>${bnDigits(answered)}/${bnDigits(exam.questions.length)}</b><span>উত্তর করেছেন</span></div></div><div class="quiz-body"><div class="progress-label"><span>উত্তর দিয়েছেন: ${bnDigits(answered)}টি</span><span>ফাঁকা: ${bnDigits(blank)}টি</span></div>${answersHtml}<div class="submit-row"><p>এই ফলাফল শুধু এই সেশনে দেখানো হচ্ছে।</p><button class="button button-primary" data-retry="${escapeHtml(exam.id)}">আবার পরীক্ষা দিন ↻</button></div></div>`;
      return;
    }
    const questionsHtml = exam.questions.map((question,index) => `<section class="question-block"><h3><span class="question-number">${bnDigits(index+1)}.</span>${escapeHtml(question.text).replace(/\n/g,'<br>')}</h3><textarea name="answer-${index}" rows="2" placeholder="আপনার উত্তর লিখুন..." aria-label="প্রশ্ন ${bnDigits(index+1)}-এর উত্তর"></textarea></section>`).join('');
    $('#exam-view').innerHTML = `${header}<form id="quiz-form"><div class="quiz-body"><div class="quiz-progress"><span style="width:100%"></span></div><div class="progress-label"><span>সব প্রশ্ন একসঙ্গে দেখুন</span><span>ফাঁকা রেখে জমা দেওয়া যাবে</span></div>${questionsHtml}<div class="submit-row"><p>সব উত্তর দেওয়া বাধ্যতামূলক নয়।</p><button type="submit" class="button button-primary">উত্তর জমা দিন <span>→</span></button></div></div></form>`;
    $('#quiz-form').addEventListener('submit', event => {
      event.preventDefault();
      const submitted = exam.questions.map((_,index) => new FormData(event.currentTarget).get(`answer-${index}`) || '');
      renderQuiz({answers:submitted});
      examDialog.scrollTop = 0;
    });
  }

  $('#admin-open').addEventListener('click', () => { $('#form-error').hidden = true; adminDialog.showModal(); });
  $('#empty-create').addEventListener('click', () => adminDialog.showModal());
  $('#exam-form').addEventListener('submit', event => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const lines = String(form.get('questions') || '').split(/\r?\n/);
    const questions = [];
    let current = null;
    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue;
      const match = line.match(/^(?:প্রশ্ন\s*)?\d+\s*[.)।:：-]\s*(.+)$/);
      const answer = line.match(/^(?:উত্তর|answer)\s*[:：]\s*(.*)$/i);
      if (match) { if (current) questions.push(current); current = {text:match[1].trim(),answer:''}; }
      else if (answer && current) current.answer = answer[1].trim();
      else if (current) current.text += `\n${line}`;
      else current = {text:line.replace(/^প্রশ্ন\s*[:：-]?\s*/,''),answer:''};
    }
    if (current) questions.push(current);
    if (!questions.length || questions.some(question => !question.text.trim())) { $('#form-error').textContent = 'অন্তত একটি প্রশ্ন লিখুন। প্রশ্নের নম্বর দিন, যেমন: ১. প্রশ্নের লেখা'; $('#form-error').hidden = false; return; }
    const exam = {id:`exam-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,title:String(form.get('title')).trim(),subject:String(form.get('subject')).trim(),date:String(form.get('date') || ''),chapter:String(form.get('chapter') || '').trim(),questions};
    exams.unshift(exam);
    saveExams();
    event.currentTarget.reset();
    $('#file-name').textContent = 'অথবা সরাসরি উপরে লিখুন';
    adminDialog.close();
    notify('পরীক্ষাটি এই ব্রাউজারে সংরক্ষিত হয়েছে।');
  });

  $('#text-file').addEventListener('change', async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    $('#file-name').textContent = file.name;
    try {
      const data = parseTextFile(await file.text());
      const form = $('#exam-form');
      if (data.title) form.elements.title.value = data.title;
      if (data.subject) form.elements.subject.value = data.subject;
      if (data.chapter) form.elements.chapter.value = data.chapter;
      if (data.date) {
        const parsed = new Date(data.date);
        form.elements.date.value = /^\d{4}-\d{2}-\d{2}$/.test(data.date) ? data.date : Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0,10);
      }
      if (data.questions.length) form.elements.questions.value = data.questions.map((question,index) => `${bnDigits(index+1)}. ${question.text}${question.answer ? `\nউত্তর: ${question.answer}` : ''}`).join('\n');
      else form.elements.questions.value = file.text ? await file.text() : '';
      $('#form-error').hidden = true;
      notify(data.questions.length ? `${bnDigits(data.questions.length)}টি প্রশ্ন ফাইল থেকে যোগ হয়েছে।` : 'ফাইলের লেখা সম্পাদনার জন্য যুক্ত হয়েছে।');
    } catch (error) { $('#form-error').textContent = 'ফাইলটি পড়া যায়নি। UTF-8 .txt ফাইল ব্যবহার করুন।'; $('#form-error').hidden = false; }
    event.target.value = '';
  });

  $('#search-input').addEventListener('input', render);
  $('#subject-filter').addEventListener('change', render);
  document.addEventListener('click', event => {
    const take = event.target.closest('[data-take]');
    const remove = event.target.closest('[data-delete]');
    const close = event.target.closest('[data-close]');
    const retry = event.target.closest('[data-retry]');
    if (take) openExam(take.dataset.take);
    if (remove) {
      const exam = exams.find(item => item.id === remove.dataset.delete);
      if (exam && confirm(`“${exam.title}” পরীক্ষাটি এই ব্রাউজার থেকে মুছে ফেলবেন?`)) { exams = exams.filter(item => item.id !== exam.id); saveExams(); notify('পরীক্ষাটি মুছে ফেলা হয়েছে।'); }
    }
    if (close) document.getElementById(close.dataset.close).close();
    if (retry) openExam(retry.dataset.retry);
  });
  [adminDialog,examDialog].forEach(dialog => dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); }));
  document.addEventListener('keydown', event => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); search.focus(); } });

  $('#export-data').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify({format:'porashala-exams',version:1,exams},null,2)],{type:'application/json'});
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'porashala-exams.json'; link.click(); URL.revokeObjectURL(link.href); notify('পরীক্ষার ডেটা JSON ফাইলে ডাউনলোড হয়েছে।');
  });
  $('#import-file').addEventListener('change', async event => {
    const file = event.target.files?.[0]; if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      const incoming = Array.isArray(data) ? data : data.exams;
      if (!Array.isArray(incoming) || !incoming.length || !incoming.every(isValidExam)) throw new Error('invalid');
      const known = new Set(exams.map(exam => exam.id));
      const additions = incoming.filter(exam => !known.has(exam.id));
      if (!additions.length) { notify('নতুন কোনো পরীক্ষা পাওয়া যায়নি।'); return; }
      exams = [...additions,...exams]; saveExams(); notify(`${bnDigits(additions.length)}টি পরীক্ষা আমদানি হয়েছে।`);
    } catch (error) { alert('এই JSON ফাইলটি পড়া যায়নি। পড়াশালার ডেটা রপ্তানি ফাইল ব্যবহার করুন।'); }
    finally { event.target.value = ''; }
  });
  render();
})();
