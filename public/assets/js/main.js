/* ============================================
   SMART FUND - Landing Page Logic
   Calculator, FAQ, Dark mode, Language, Mobile menu
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  hidePageLoader();
  AOS.init({ duration: 800, once: true, offset: 80 });

  // ============================================
  // NAVBAR
  // ============================================
  const navbar = document.querySelector('header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      navbar.classList.add('shadow-md', 'bg-white/80', 'dark:bg-slate-900/80');
    } else {
      navbar.classList.remove('shadow-md', 'bg-white/80', 'dark:bg-slate-900/80');
    }
  });

  // Mobile menu
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  const closeMobileMenu = document.getElementById('closeMobileMenu');
  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenu.classList.remove('hidden');
      mobileMenuBtn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    });
    const closeMenu = () => {
      mobileMenu.classList.add('hidden');
      mobileMenuBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    };
    closeMobileMenu?.addEventListener('click', closeMenu);
    mobileMenu.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeMenu));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
  }

  // ============================================
  // DARK MODE
  // ============================================
  const darkToggle = document.getElementById('darkToggle');
  if (darkToggle) {
    const applySavedTheme = () => {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      }
    };
    applySavedTheme();

    const updateIcon = () => {
      if (document.documentElement.classList.contains('dark')) {
        darkToggle.innerHTML = '<i class="fas fa-sun text-amber-500"></i>';
      } else {
        darkToggle.innerHTML = '<i class="fas fa-moon text-slate-600"></i>';
      }
    };
    updateIcon();
    darkToggle.addEventListener('click', () => {
      document.documentElement.classList.toggle('dark');
      localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
      updateIcon();
    });
  }

  // ============================================
  // LOAN CALCULATOR
  // ============================================
  const loanAmount = document.getElementById('calcAmount');
  const loanTenor = document.getElementById('loanTenor');
  const amountDisplay = document.getElementById('calcAmountDisplay');
  const monthlyPaymentEl = document.getElementById('calcMonthly');
  const totalPaymentEl = document.getElementById('calcTotal');

  function calculateLoan(principal, tenorMonths, annualRate = 5) {
    const monthlyRate = annualRate / 100 / 12;
    const monthly = principal * (monthlyRate * Math.pow(1 + monthlyRate, tenorMonths)) / (Math.pow(1 + monthlyRate, tenorMonths) - 1);
    const total = monthly * tenorMonths;
    const interest = total - principal;
    return { monthly, total, interest };
  }

  const LOAN_LIMITS = {
    min: 1000000,
    max: 500000000,
    step: 1000000,
    defaultVal: 50000000,
  };

  function updateCalculatorRange() {
    if (!loanAmount) return;
    loanAmount.min = LOAN_LIMITS.min;
    loanAmount.max = LOAN_LIMITS.max;
    loanAmount.step = LOAN_LIMITS.step;
    const currentVal = parseInt(loanAmount.value, 10);
    if (!currentVal || currentVal < LOAN_LIMITS.min || currentVal > LOAN_LIMITS.max) {
      loanAmount.value = LOAN_LIMITS.defaultVal;
    }
  }

  function formatNumber(num) {
    return new Intl.NumberFormat('id-ID').format(Math.round(num));
  }

  function updateCalculator() {
    if (!loanAmount) return;
    const amount = parseInt(loanAmount.value, 10);
    const tenor = parseInt(loanTenor.value, 10);

    if (isNaN(amount) || amount < LOAN_LIMITS.min) {
      loanAmount.value = LOAN_LIMITS.min;
      return updateCalculator();
    }
    if (amount > LOAN_LIMITS.max) {
      loanAmount.value = LOAN_LIMITS.max;
      return updateCalculator();
    }

    amountDisplay.textContent = formatNumber(amount);
    document.getElementById('calcTenorDisplay').textContent = tenor;

    const calc = calculateLoan(amount, tenor, 5);
    monthlyPaymentEl.textContent = 'Rp' + formatNumber(calc.monthly);
    totalPaymentEl.textContent = 'Rp' + formatNumber(calc.total);
  }

  if (loanAmount) {
    updateCalculatorRange();
    loanAmount.addEventListener('input', updateCalculator);
    loanTenor?.addEventListener('input', updateCalculator);
    updateCalculator();
  }

  // ============================================
  // CTA BUTTONS
  // ============================================
  const heroApplyBtn = document.getElementById('heroApplyBtn');
  const calcApplyBtn = document.getElementById('calcApplyBtn');
  const finalCtaBtn = document.getElementById('finalCtaBtn');
  const howItWorksApplyBtn = document.getElementById('howItWorksApplyBtn');
  const heroLearnMore = document.getElementById('heroLearnMore');

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = el.offsetTop - 80;
      window.scrollTo({ top: offset, behavior: 'smooth' });
    }
  };

  const handleApplyClick = () => {
    const token = Token.get();
    if (!token) {
      Swal.fire({
        icon: 'info',
        title: I18N.t('notif.loginRequired'),
        text: I18N.t('notif.loginRequiredDesc'),
        showCancelButton: true,
        confirmButtonColor: '#2563eb',
        cancelButtonColor: '#64748b',
        confirmButtonText: I18N.t('notif.loginNow'),
        cancelButtonText: I18N.t('notif.register'),
      }).then((result) => {
        if (result.isConfirmed) window.location.href = '/login.html';
        else if (result.dismiss === Swal.DismissReason.cancel) window.location.href = '/register.html';
      });
    } else {
      scrollToSection('calculator');
    }
  };

  [heroApplyBtn, calcApplyBtn, finalCtaBtn, howItWorksApplyBtn].forEach((btn) => {
    if (btn) btn.addEventListener('click', handleApplyClick);
  });

  heroLearnMore?.addEventListener('click', () => scrollToSection('features'));
  howItWorksApplyBtn?.addEventListener('click', () => scrollToSection('calculator'));

  // ============================================
  // LANGUAGE SELECTOR
  // ============================================
  const langToggle = document.getElementById('langToggle');
  const langMenu = document.getElementById('langMenu');
  const langLabel = document.getElementById('langLabel');
  let currentLang = I18N.getLang();
  langLabel.textContent = currentLang.toUpperCase();

  document.addEventListener('click', (e) => {
    if (!langToggle?.contains(e.target) && !langMenu?.contains(e.target)) {
      langMenu?.classList.add('hidden');
    }
  });

  langToggle?.addEventListener('click', (e) => {
    e.stopPropagation();
    langMenu?.classList.toggle('hidden');
  });

  document.querySelectorAll('.lang-option').forEach((btn) => {
    btn.addEventListener('click', () => {
      const lang = btn.getAttribute('data-lang');
      I18N.setLang(lang);
      I18N.apply();
      langLabel.textContent = lang.toUpperCase();
      langMenu?.classList.add('hidden');
      window.location.reload();
    });
  });

  // ============================================
  // TESTIMONI CAROUSEL
  // ============================================
  const testimoniTrack = document.getElementById('testimoniTrack');
  const testimoniDots = document.getElementById('testimoniDots');

  const allTestimoni = [
    { name: 'Budi Santoso', role: 'Pengusaha, Jakarta', rating: 5, text: 'Prosesnya cepat dan mudah. Saya berhasil mendapatkan modal usaha dalam waktu singkat. Terima kasih SMART FUND!' },
    { name: 'Siti Rahayu', role: 'Ibu Rumah Tangga, Bandung', rating: 5, text: 'Bunganya ringan dan transparan. Tidak ada biaya tersembunyi. Sangat membantu untuk renovasi rumah saya.' },
    { name: 'Ahmad Fauzi', role: 'Karyawan, Surabaya', rating: 5, text: 'Platform pinjaman online yang dapat dipercaya. Berlisensi OJK jadi lebih nyaman. Proses verifikasi cepat dan praktis.' },
    { name: 'Dewi Lestari', role: 'Mahasiswi, Universitas Indonesia', rating: 5, text: 'Dana pendidikan saya diterima tepat waktu. Prosesnya sangat membantu untuk kelancaran kuliah saya.' },
    { name: 'Rizky Pratama', role: 'Freelancer, Bali', rating: 5, text: 'Saya butuh modal mendadak untuk proyek klien. SMART FUND diterima dalam 1 hari kerja. Hebat!' },
    { name: 'Linda Kusuma', role: 'Dokter, Medan', rating: 5, text: 'Pelayanan customer service-nya ramah dan responsif. Cicilan terasa ringan sesuai kemampuan saya.' },
    { name: 'Hendra Wijaya', role: 'Petani, Yogyakarta', rating: 5, text: 'Modal usaha pertanian saya menjadi lancar. Bunganya sangat kompetitif dibandingkan tempat lain.' },
    { name: 'Maya Anggraini', role: 'Ibu Rumah Tangga, Semarang', rating: 5, text: 'Untuk kebutuhan biaya melahirkan, SMART FUND benar-benar membantu. Prosesnya cepat dan aman.' },
    { name: 'Andi Setiawan', role: 'Pegawai Negeri, Aceh', rating: 5, text: 'Renovasi rumah saya berjalan lancar dengan bantuan pinjaman dari SMART FUND. Sangat recommended!' },
    { name: 'Fitri Handayani', role: 'Wiraswasta, Makassar', rating: 5, text: 'Tidak ada biaya tersembunyi, semua transparan. Admin verifikasi sangat cepat dan profesional.' },
    { name: 'Joko Susilo', role: 'Mekanik, Malang', rating: 5, text: 'Buka usaha bengkel jadi lebih mudah. Pinjaman diterima tanpa ribet dan syarat yang mudah.' },
    { name: 'Ratna Sari', role: 'Guru, Palembang', rating: 5, text: 'Saya sangat terbantu untuk biaya pendidikan anak. SMART FUND dapat diandalkan dan dapat dipercaya.' },
  ];

  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function chunkArray(arr, size) {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  }

  let testimonialGroups = [];
  let currentTestimonialGroup = 0;

  function renderTestimonialGroup(group) {
    if (!testimoniTrack) return;
    const cards = group.map((t, idx) => {
      const stars = Array(t.rating).fill('<i class="fas fa-star text-amber-400"></i>').join('');
      return `
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-8 shadow-soft border border-slate-100 dark:border-slate-700 card-hover testimonial-card" data-aos="fade-up" data-aos-delay="${idx * 100}">
          <div class="flex text-amber-400 mb-4">${stars}</div>
          <p class="text-slate-600 dark:text-slate-300 mb-6 italic">"${t.text}"</p>
          <div class="flex items-center gap-3">
            <div class="w-14 h-14 rounded-full gradient-bg flex items-center justify-center text-white font-bold text-lg shadow-sm">
              ${t.name.charAt(0)}
            </div>
            <div>
              <p class="font-bold text-slate-900 dark:text-white">${t.name}</p>
              <p class="text-sm text-slate-500 dark:text-slate-400">${t.role}</p>
            </div>
          </div>
        </div>
      `;
    }).join('');
    testimoniTrack.innerHTML = `<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">${cards}</div>`;
    if (typeof AOS !== 'undefined') {
      setTimeout(() => AOS.refresh(), 50);
    }
  }

  function renderDots() {
    if (!testimoniDots) return;
    testimoniDots.innerHTML = testimonialGroups.map((_, i) => `
      <button class="testimonial-dot w-3 h-3 rounded-full transition ${i === currentTestimonialGroup ? 'bg-blue-600 w-8' : 'bg-slate-300 hover:bg-slate-400'}" data-index="${i}" aria-label="Slide ${i + 1}"></button>
    `).join('');
    testimoniDots.querySelectorAll('.testimonial-dot').forEach((btn) => {
      btn.addEventListener('click', () => {
        currentTestimonialGroup = parseInt(btn.dataset.index, 10);
        updateTestimonial();
      });
    });
  }

  function updateTestimonial() {
    if (!testimoniTrack) return;
    testimoniTrack.style.opacity = '0';
    setTimeout(() => {
      renderTestimonialGroup(testimonialGroups[currentTestimonialGroup]);
      renderDots();
      testimoniTrack.style.opacity = '1';
    }, 250);
  }

  if (testimoniTrack) {
    const shuffled = shuffleArray([...allTestimoni]);
    testimonialGroups = chunkArray(shuffled, 3);
    renderTestimonialGroup(testimonialGroups[currentTestimonialGroup]);
    renderDots();
    testimoniTrack.style.opacity = '1';

    let autoRotateInterval = setInterval(() => {
      currentTestimonialGroup = (currentTestimonialGroup + 1) % testimonialGroups.length;
      updateTestimonial();
    }, 30000);

    const testimonialSection = document.getElementById('testimonial');
    if (testimonialSection) {
      testimonialSection.addEventListener('mouseenter', () => clearInterval(autoRotateInterval));
      testimonialSection.addEventListener('mouseleave', () => {
        clearInterval(autoRotateInterval);
        autoRotateInterval = setInterval(() => {
          currentTestimonialGroup = (currentTestimonialGroup + 1) % testimonialGroups.length;
          updateTestimonial();
        }, 30000);
      });
    }
  }

  // ============================================
  // FAQ
  // ============================================
  const faqContainer = document.getElementById('faqContainer');

  function renderFaq() {
    if (!faqContainer) return;
    const faqs = [
      { q: I18N.t('faq.q1'), a: I18N.t('faq.a1') },
      { q: I18N.t('faq.q2'), a: I18N.t('faq.a2') },
      { q: I18N.t('faq.q3'), a: I18N.t('faq.a3') },
      { q: I18N.t('faq.q4'), a: I18N.t('faq.a4') },
      { q: I18N.t('faq.q5'), a: I18N.t('faq.a5') },
      { q: I18N.t('faq.q6'), a: I18N.t('faq.a6') },
    ];
    faqContainer.innerHTML = '';
    faqs.forEach((faq) => {
      const item = document.createElement('div');
      item.className = 'bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden';
      item.innerHTML = `
        <button class="faq-btn w-full flex items-center justify-between p-5 text-left font-semibold text-slate-800 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700/50 transition">
          <span>${faq.q}</span>
          <i class="fas fa-chevron-down text-blue-600 transition-transform duration-300"></i>
        </button>
        <div class="faq-answer hidden max-h-0 overflow-hidden transition-all duration-300">
          <div class="p-5 pt-0 text-slate-600 dark:text-slate-300 text-sm leading-relaxed">${faq.a}</div>
        </div>
      `;
      faqContainer.appendChild(item);
      const btn = item.querySelector('.faq-btn');
      const answer = item.querySelector('.faq-answer');
      const icon = btn.querySelector('i');
      btn.addEventListener('click', () => {
        answer.classList.toggle('hidden');
        if (answer.classList.contains('hidden')) {
          answer.style.maxHeight = '0px';
        } else {
          answer.style.maxHeight = answer.scrollHeight + 'px';
        }
        icon.classList.toggle('rotate-180');
      });
    });
  }

  renderFaq();

  // Language change - re-render dynamic content
  document.addEventListener('languageChanged', () => {
    if (typeof updateCalculator === 'function') updateCalculator();
    renderFaq();
  });
});
