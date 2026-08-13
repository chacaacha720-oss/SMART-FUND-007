/*
 * SMART FUND - Landing Page Logic
 * Calculator, FAQ, Dark mode, Mobile menu
 */

document.addEventListener('DOMContentLoaded', () => {

  // ============================================
  // NAVBAR
  // ============================================
  const navbar = document.getElementById('topAppBar');
  const navLinks = document.querySelectorAll('#topAppBarNav a, #mobileMenu a');

  const handleScroll = () => {
    if (window.scrollY > 20) {
      navbar.classList.add('navbar-shadow');
      navbar.classList.remove('bg-white/90', 'dark:bg-slate-900/90');
      navbar.classList.add('bg-white/95', 'dark:bg-slate-900/95');
    } else {
      navbar.classList.remove('navbar-shadow');
      navbar.classList.remove('bg-white/95', 'dark:bg-slate-900/95');
      navbar.classList.add('bg-white/90', 'dark:bg-slate-900/90');
    }
  };
  window.addEventListener('scroll', handleScroll);
  handleScroll();

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        const offset = target.offsetTop - 80;
        window.scrollTo({ top: offset, behavior: 'smooth' });
      }
    });
  });

  // Mobile menu
  const mobileMenuBtn = document.getElementById('topAppBarMenuBtn');
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
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenu();
    });
  }

  // ============================================
  // LOAN CALCULATOR — Flat Annual Interest
  // ============================================

  const LOAN_LIMITS = { min: 500, max: 300000, step: 500, defaultVal: 10000 };

  /**
   * Format a number as Malaysian Ringgit with 2 decimal places.
   * Always produces: RM 10,000.00
   */
  function formatRM(num) {
    const n = Number(num);
    if (isNaN(n) || !isFinite(n)) return 'RM 0.00';
    return Currency && Currency.formatRM ? Currency.formatRM(n) : `RM ${n.toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  /**
   * Strip non-numeric characters from input and return a finite number.
   */
  function parseNumeric(raw) {
    if (raw === null || raw === undefined || raw === '') return NaN;
    const cleaned = String(raw).replace(/[^0-9.]/g, '');
    const num = parseFloat(cleaned);
    return isFinite(num) ? num : NaN;
  }

  /**
   * Flat annual interest calculation.
   * interest  = principal * (rate/100) * (tenorMonths/12)
   * total     = principal + interest
   * monthly   = total / tenorMonths
   */
  function calculateLoan(principal, tenorMonths, annualRate) {
    const p = Number(principal) || 0;
    const t = Number(tenorMonths) || 0;
    const r = Number(annualRate) || 0;
    const years = t / 12;
    const interest = p * (r / 100) * years;
    const total = p + interest;
    const monthly = total / t;
    return { interest, total, monthly, years };
  }

  // ===== Element references =====
  const loanAmountInput = document.getElementById('loanAmount');
  const loanTenorInput = document.getElementById('loanTenor');
  const interestRateInput = document.getElementById('interestRate');

  const loanAmountFormatted = document.getElementById('loanAmountFormatted');
  const resultMonthly = document.getElementById('resultMonthly');
  const resultInterest = document.getElementById('resultInterest');
  const resultTotal = document.getElementById('resultTotal');
  const resultTenor = document.getElementById('resultTenor');

  const calcError = document.getElementById('calcError');
  const resetCalcBtn = document.getElementById('resetCalcBtn');
  const calcSolveBtn = document.getElementById('calcSolveBtn');

  const heroLoanBalance = document.getElementById('heroLoanBalance');
  const heroMonthlyPayment = document.getElementById('heroMonthlyPayment');

  // ===== Hero mockup =====
  function updateHeroMockup() {
    if (heroLoanBalance) heroLoanBalance.textContent = formatRM(500000);
    if (heroMonthlyPayment) {
      const demo = calculateLoan(500000, 12, 5);
      heroMonthlyPayment.textContent = formatRM(demo.monthly);
    }
  }

  // ===== Input formatting =====
  function updateLoanAmountDisplay() {
    const val = parseNumeric(loanAmountInput ? loanAmountInput.value : '');
    if (isNaN(val)) {
      if (loanAmountFormatted) loanAmountFormatted.textContent = formatRM(0);
      return;
    }
    if (loanAmountFormatted) {
      loanAmountFormatted.textContent = formatRM(Math.max(val, 0));
    }
  }

  function clampLoanAmount(val) {
    if (val < LOAN_LIMITS.min) return LOAN_LIMITS.min;
    if (val > LOAN_LIMITS.max) return LOAN_LIMITS.max;
    return val;
  }

  // ===== Calculator engine =====
  function showError(msg) {
    if (calcError) {
      calcError.textContent = msg;
      calcError.style.display = msg ? 'block' : 'none';
    }
  }

  function runCalculator() {
    if (!loanAmountInput || !resultMonthly) return;

    const rawAmount = loanAmountInput.value.trim();
    const rawTenor = loanTenorInput ? loanTenorInput.value.trim() : '';
    const rawRate = interestRateInput ? interestRateInput.value.trim() : '';

    const amount = parseNumeric(rawAmount);
    const tenor = parseNumeric(rawTenor);
    const rate = parseNumeric(rawRate);

    // Validation
    if (isNaN(amount) || amount <= 0) {
      showError('Sila masukkan jumlah pinjaman yang sah.');
      return;
    }
    if (isNaN(tenor) || tenor < 1 || tenor > 60) {
      showError('Sila masukkan tempoh pinjaman yang sah (1–60 bulan).');
      return;
    }
    if (isNaN(rate) || rate <= 0) {
      showError('Sila masukkan kadar faedah yang sah.');
      return;
    }

    showError('');

    // Clamp amount to limits
    const clampedAmount = clampLoanAmount(amount);

    const calc = calculateLoan(clampedAmount, tenor, rate);
    const years = tenor / 12;

    // Update displays
    if (resultMonthly) resultMonthly.textContent = formatRM(calc.monthly);
    if (resultInterest) resultInterest.textContent = formatRM(calc.interest);
    if (resultTotal) resultTotal.textContent = formatRM(calc.total);
    if (resultTenor) {
      resultTenor.textContent = `${tenor} bulan (${years === Math.floor(years) ? years : (tenor / 12).toFixed(1)} tahun)`;
    }
    if (loanAmountFormatted) loanAmountFormatted.textContent = formatRM(clampedAmount);
  }

  function resetCalculator() {
    if (loanAmountInput) loanAmountInput.value = LOAN_LIMITS.defaultVal;
    if (loanTenorInput) loanTenorInput.value = 12;
    if (interestRateInput) interestRateInput.value = 5;
    updateLoanAmountDisplay();
    runCalculator();
    showError('');
  }

  // ===== Event listeners =====
  if (loanAmountInput) {
    loanAmountInput.addEventListener('input', () => {
      updateLoanAmountDisplay();
      runCalculator();
    });
  }
  if (loanTenorInput) {
    loanTenorInput.addEventListener('input', () => {
      if (loanTenorInput.value === '' || parseNumeric(loanTenorInput.value) < 1) {
        loanTenorInput.value = 1;
      }
      runCalculator();
    });
  }
  if (interestRateInput) {
    interestRateInput.addEventListener('input', () => {
      if (interestRateInput.value === '' || parseNumeric(interestRateInput.value) <= 0) {
        interestRateInput.value = 5;
      }
      runCalculator();
    });
  }

  if (resetCalcBtn) resetCalcBtn.addEventListener('click', resetCalculator);
  if (calcSolveBtn) calcSolveBtn.addEventListener('click', runCalculator);

  // Initialise
  resetCalculator();
  updateHeroMockup();

  // ============================================
  // CTA BUTTONS — uses existing loan flow
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
    const token = (typeof Token !== 'undefined' && Token.get) ? Token.get() : null;
    if (!token) {
      Swal.fire({
        icon: 'info',
        title: 'Log Masuk Diperlukan',
        text: 'Anda harus log masuk untuk menghantar permohonan pinjaman.',
        showCancelButton: true,
        confirmButtonColor: '#1264E8',
        cancelButtonColor: '#667085',
        confirmButtonText: 'Log Masuk Sekarang',
        cancelButtonText: 'Daftar',
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

  // ============================================
  // TESTIMONIAL CAROUSEL
  // ============================================
  const testimonialTrack = document.getElementById('testimonialTrack');
  const testimonialDots = document.getElementById('testimonialDots');

  const testimonials = [
    { name: 'Ahmad', role: 'Pengguna SMART FUND', rating: 5, text: 'Proses permohonan sangat mudah dan maklumat simulasi sangat membantu saya memahami jumlah ansuran yang perlu dibayar.', initials: 'A' },
    { name: 'Siti', role: 'Pengguna SMART FUND', rating: 5, text: 'Faedah yang ringan dan maklumat yang telus. Sangat membantu untuk keperluan peribadi saya.' },
    { name: 'Rahman', role: 'Pengguna SMART FUND', rating: 5, text: 'Platform yang cekap dan proses pengesahan yang pantas. Dana pun cair dengan lancar.' },
    { name: 'Farah', role: 'Pengguna SMART FUND', rating: 5, text: 'Saya appreciate dengan simulasi yang jelas sebelum membuat keputusan. Prosesnya sangat profesional.' },
    { name: 'Karim', role: 'Pengguna SMART FUND', rating: 5, text: 'Membantu saya mendapatkan dana untuk modal perniagaan. Proses mudah dan tiada peraturan yang tersembunyi.' },
    { name: 'Nora', role: 'Pengguna SMART FUND', rating: 5, text: 'Pengalaman yang positif dari permulaan hingga penyelesaian. Sangat syaran untuk pengguna lain.' },
  ];

  function getInitials(name) {
    return name.split(' ').map((w) => w.charAt(0)).join('').substring(0, 2).toUpperCase();
  }

  function renderTestimonialGroup(group, startIndex) {
    if (!testimonialTrack) return;
    const cards = group.map((t, idx) => {
      const stars = Array(t.rating).fill('<i class="fas fa-star"></i>').join('');
      const initials = getInitials(t.name);
      const delay = (startIndex + idx) * 100;
      return `
        <div class="testimonial-card p-6 sm:p-8">
          <div class="flex text-amber-400 mb-4">${stars}</div>
          <p class="text-slate-600 dark:text-slate-300 mb-6 italic leading-relaxed">"${t.text}"</p>
          <div class="flex items-center gap-3">
            <div class="testimonial-avatar flex items-center justify-center font-bold">${initials}</div>
            <div>
              <p class="font-bold text-slate-900 dark:text-white">${t.name}</p>
              <p class="text-sm text-slate-500 dark:text-slate-400">${t.role}</p>
            </div>
          </div>
        </div>
      `;
    }).join('');
    testimonialTrack.innerHTML = `<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">${cards}</div>`;
    if (typeof AOS !== 'undefined') {
      setTimeout(() => AOS.refresh(), 50);
    }
  }

  function renderDots() {
    if (!testimonialDots) return;
    const totalGroups = Math.ceil(testimonials.length / 3);
    testimonialDots.innerHTML = Array.from({ length: totalGroups }, (_, i) => `
      <button class="testimonial-dot w-3 h-3 rounded-full transition ${i === 0 ? 'bg-primary w-8' : 'bg-slate-300 hover:bg-slate-400'}" data-index="${i}"></button>
    `).join('');
    testimonialDots.querySelectorAll('.testimonial-dot').forEach((btn) => {
      btn.addEventListener('click', () => {
        currentTestimonialGroup = parseInt(btn.dataset.index, 10);
        updateTestimonial();
      });
    });
  }

  let testimonialGroups = [];
  let currentTestimonialGroup = 0;

  function updateTestimonial() {
    if (!testimonialTrack || testimonialGroups.length === 0) return;
    testimonialTrack.style.opacity = '0';
    setTimeout(() => {
      const group = testimonialGroups[currentTestimonialGroup];
      const startIndex = currentTestimonialGroup * 3;
      renderTestimonialGroup(group, startIndex);
      renderDots();
      testimonialTrack.style.opacity = '1';
    }, 250);
  }

  if (testimonialTrack) {
    // Chunk testimonials into groups of 3
    testimonialGroups = [];
    for (let i = 0; i < testimonials.length; i += 3) {
      testimonialGroups.push(testimonials.slice(i, i + 3));
    }
    renderTestimonialGroup(testimonialGroups[0], 0);
    renderDots();
    testimonialTrack.style.opacity = '1';

    let autoRotate = setInterval(() => {
      currentTestimonialGroup = (currentTestimonialGroup + 1) % testimonialGroups.length;
      updateTestimonial();
    }, 8000);

    const testimonialSection = document.getElementById('testimonial');
    if (testimonialSection) {
      testimonialSection.addEventListener('mouseenter', () => clearInterval(autoRotate));
      testimonialSection.addEventListener('mouseleave', () => {
        autoRotate = setInterval(() => {
          currentTestimonialGroup = (currentTestimonialGroup + 1) % testimonialGroups.length;
          updateTestimonial();
        }, 8000);
      });
    }
  }

  // ============================================
  // FAQ ACCORDION
  // ============================================
  const faqContainer = document.getElementById('faqContainer');

  const faqs = [
    { q: 'Bagaimana cara mengajukan pinjaman di SMART FUND?', a: 'Daftar dahulu, kemudian mulai log masuk ke akaun anda. Pilih menu permohonan pinjaman, isi maklumat pinjaman, dan hantar. Permohonan anda akan diproses oleh sistem kami.' },
    { q: 'Berapa kadar faedah yang dikenakan?', a: 'Kadar faedah kami bermula dari 5% setahun, supaya ansuran anda terasa ringan. Kadar tepat ditentukan berdasarkan profil kelayakan dan tempoh pinjaman.' },
    { q: 'Berapa jumlah pinjaman yang boleh dimohon?', a: 'Anda boleh memohon pinjaman dari RM 500.00 hingga RM 300,000.00 dengan tempoh 1 hingga 60 bulan.' },
    { q: 'Adakah SMART FUND selamat dan dipercayai?', a: 'Ya, SMART FUND mengutamakan keselamatan dan keyakinan pengguna. Kami menggunakan teknologi enkripsi tinggi dan prinsip keelamanan yang ketat.' },
    { q: 'Berapa lama proses kelulusan?', a: 'Proses kelulusan kami cepat. Selepas permohonan dihantar, pasukan kami akan menyemak dan memberikan keputusan dalam masa singkat.' },
    { q: 'Dokumen apa yang diperlukan?', a: 'Kami memerlukan dokumen minimal seperti ID dan maklumat peribadi. Proses pengesahan praktikal dan tidak rumit.' },
  ];

  function renderFaq() {
    if (!faqContainer) return;
    faqContainer.innerHTML = '';
    faqs.forEach((faq, i) => {
      const item = document.createElement('div');
      item.className = 'faq-item';
      item.innerHTML = `
        <button class="faq-question">
          <span>${faq.q}</span>
          <i class="fas fa-chevron-down text-primary transition-transform duration-300"></i>
        </button>
        <div class="faq-answer">
          <p>${faq.a}</p>
        </div>
      `;
      faqContainer.appendChild(item);

      const btn = item.querySelector('.faq-question');
      const answer = item.querySelector('.faq-answer');
      const icon = btn.querySelector('i');

      btn.addEventListener('click', () => {
        const isOpen = answer.classList.contains('open');
        if (isOpen) {
          answer.classList.remove('open');
          icon.classList.remove('rotate-180');
        } else {
          answer.classList.add('open');
          icon.classList.add('rotate-180');
        }
      });
    });
  }

  renderFaq();

  // ============================================
  // NAVBAR ACTIVE LINK ON SCROLL
  // ============================================
  const sections = document.querySelectorAll('section[id]');
  const observerOptions = {
    root: null,
    rootMargin: '-30% 0px -30% 0px',
    threshold: 0,
  };
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const id = entry.target.getAttribute('id');
      const link = document.querySelector(`a[href="#${id}"]`);
      if (entry.isIntersecting && link) {
        navLinks.forEach((l) => l.classList.remove('text-primary', 'font-semibold'));
        link.classList.add('text-primary', 'font-semibold');
      }
    });
  }, observerOptions);
  sections.forEach((s) => sectionObserver.observe(s));
});
