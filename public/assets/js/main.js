/*
 * SMART FUND - Landing Page Logic
 * Calculator, FAQ, Dark mode, Mobile menu
 */

document.addEventListener('DOMContentLoaded', () => {

  // ============================================
  // NAVBAR
  // ============================================
  const navbar = document.getElementById('topAppBar');
  const navLinks = document.querySelectorAll('#topAppBarNav a, #Soalan LazimMenu a');

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
  const mobileMenu = document.getElementById('Soalan LazimMenu');
  const closeMobileMenu = document.getElementById('closeSoalan LazimMenu');
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

  const LOAN_LIMITS = { min: 2000, max: 200000, step: 500, defaultVal: 10000 };

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
    const rate = 5; // kadar faedah ditetapkan 5% setahun (tetap)

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
  if (interestRateInput) { interestRateInput.value = 5; interestRateInput.disabled = true; }
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
  // TESTIMONIAL CAROUSEL — responsive flex slider
  // ============================================
  const testimonialTrack = document.getElementById('testimonialTrack');
  const testimonialDots = document.getElementById('testimonialDots');
  const testimonialSlider = testimonialTrack ? testimonialTrack.parentElement : null;
  const testimonialPrev = document.getElementById('testimonialPrev');
  const testimonialNext = document.getElementById('testimonialNext');
  const testimonialSection = document.getElementById('testimonial');

  const testimonials = [
    { name: 'Aiman Hakim', role: 'Pelanggan', image: 'https://i.ibb.co.com/pBJjKKnx/Screenshot-5.png', rating: 5, text: 'Proses permohonan sangat mudah dan penerangannya jelas. Saya sangat berpuas hati dengan pengalaman menggunakan perkhidmatan ini.' },
    { name: 'Nur Aisyah', role: 'Pelanggan', image: 'https://i.ibb.co.com/LdQj6syp/Screenshot-6.png', rating: 5, text: 'Antara perkara yang saya suka ialah prosesnya mudah difahami dan maklumat yang diberikan sangat jelas.' },
    { name: 'Muhammad Danish', role: 'Pelanggan', image: 'https://i.ibb.co.com/b5PYMbVs/1975172-1009325409100660-6079882648360064570-n.jpg', rating: 5, text: 'Paparan laman web sangat kemas dan mudah digunakan melalui telefon bimbit.' },
    { name: 'Siti Hajar', role: 'Pelanggan', image: 'https://i.ibb.co.com/d0KXNPNm/Ilustrasi-anak-Malaysia.webp', rating: 5, text: 'Pengalaman yang baik. Semua maklumat yang saya perlukan mudah untuk dicari.' },
    { name: 'Amirul Hakim', role: 'Pelanggan', image: 'https://i.ibb.co.com/mrB0LyjW/Screenshot-1.png', rating: 5, text: 'Prosesnya ringkas dan penerangan yang diberikan mudah difahami.' },
    { name: 'Nur Syafiqah', role: 'Pelanggan', image: 'https://i.ibb.co.com/8nLp1ZpD/Screenshot-2.png', rating: 5, text: 'Saya suka reka bentuknya yang moden serta mudah digunakan pada telefon.' },
    { name: 'Farhan Iskandar', role: 'Pelanggan', image: 'https://i.ibb.co.com/WpyQQM4K/Screenshot-3.png', rating: 5, text: 'Maklumat dipaparkan dengan jelas dan proses penggunaan laman web sangat mudah.' },
    { name: 'Nadia Izzati', role: 'Pelanggan', image: 'https://i.ibb.co.com/Wpxv206n/images.jpg', rating: 5, text: 'Antara pengalaman laman web yang paling mudah saya gunakan. Susun aturnya juga sangat kemas.' },
  ];

  const MOBILE_BREAKPOINT = 768;
  const AUTO_PLAY_DELAY = 6000;
  const SWIPE_THRESHOLD = 30;

  const t = {
    cardCount: 0,
    step: 0,
    cardWidth: 0,
    gap: 20,
    sliderWidth: 0,
    visibleCount: 0,
    maxIndex: 0,
    pageIndex: 0,
    maxPage: 0,
    currentX: 0,
    reducedMotion: false,
    autoplayId: null,
    pointerDown: false,
    pointerStartX: 0,
    pointerStartXform: 0,
  };

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function getInitials(name) {
    return name.split(' ').map((w) => w.charAt(0)).join('').substring(0, 2).toUpperCase();
  }

  function clampNum(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function renderCards() {
    if (!testimonialTrack) return;
    testimonialTrack.innerHTML = testimonials.map((item, i) => {
      const stars = Array.from({ length: item.rating }, () => '<i class="fas fa-star"></i>').join('');
      const initials = getInitials(item.name);
      return `
        <div class="testimonial-card" data-index="${i}">
          <div class="testimonial-rating" role="img" aria-label="${item.rating} daripada 5 bintang">${stars}</div>
          <p class="testimonial-text">${escapeHtml(item.text)}</p>
          <div class="testimonial-author">
            <img class="testimonial-avatar" src="${item.image}" alt="Foto profil ${escapeHtml(item.name)}" loading="${i === 0 ? 'eager' : 'lazy'}" width="56" height="56" decoding="async" onerror="testimonialHandleImgError(this)">
            <div class="testimonial-author-info">
              <p class="testimonial-name" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</p>
              <p class="testimonial-role">${escapeHtml(item.role)}</p>
            </div>
          </div>
        </div>`;
    }).join('');
  }

  function testimonialHandleImgError(img) {
    if (img.classList.contains('testimonial-avatar-broken')) return;
    img.classList.add('testimonial-avatar-broken');
    img.style.display = 'none';
    const initials = getInitials(img.getAttribute('alt')?.replace('Foto profil ', '') || 'P');
    const fallback = document.createElement('div');
    fallback.className = 'testimonial-avatar-fallback';
    fallback.textContent = initials;
    fallback.setAttribute('aria-label', 'Avatar default');
    img.parentNode.insertBefore(fallback, img.nextSibling);
  }

  function measure() {
    if (!testimonialTrack || !testimonialSlider) return false;
    const cards = testimonialTrack.querySelectorAll('.testimonial-card');
    if (!cards.length) return false;
    const first = cards[0];
    t.gap = parseFloat(getComputedStyle(testimonialTrack).gap) || 0;
    t.cardWidth = first.offsetWidth;
    t.step = cards.length > 1 ? (cards[1].offsetLeft - cards[0].offsetLeft) : (t.cardWidth + t.gap);
    t.sliderWidth = testimonialSlider.clientWidth;
    t.cardCount = cards.length;
    t.visibleCount = Math.max(1, Math.floor(t.sliderWidth / t.step));
    t.maxIndex = Math.max(0, t.cardCount - t.visibleCount);
    t.maxPage = Math.max(0, Math.ceil(t.cardCount / t.visibleCount) - 1);
    t.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return true;
  }

  function applyCardWidths() {
    const cards = testimonialTrack ? testimonialTrack.querySelectorAll('.testimonial-card') : [];
    if (!testimonialSlider || !cards.length) return;
    if (window.innerWidth < MOBILE_BREAKPOINT) {
      const contentWidth = testimonialSlider.clientWidth;
      cards.forEach((c) => {
        c.style.width = contentWidth + 'px';
        c.style.flexBasis = contentWidth + 'px';
      });
    } else {
      cards.forEach((c) => {
        c.style.width = '';
        c.style.flexBasis = '';
      });
    }
  }

  function cardIndexOf(page) {
    return Math.min(page * t.visibleCount, t.maxIndex);
  }

  function setPosition(animate) {
    if (!testimonialTrack) return;
    const cardIndex = cardIndexOf(t.pageIndex);
    const x = -cardIndex * t.step;
    t.currentX = x;
    if (!animate || t.reducedMotion) {
      testimonialTrack.style.transition = 'none';
    } else {
      testimonialTrack.style.transition = '';
    }
    testimonialTrack.style.transform = `translateX(${x}px)`;
  }

  function goToPage(page, animate) {
    if (!testimonialTrack || t.cardCount === 0) return;
    t.pageIndex = clampNum(page, 0, t.maxPage);
    setPosition(animate);
    renderDots();
    updateControls();
  }

  function nextSlide() {
    const total = t.maxPage + 1;
    goToPage(total > 0 ? (t.pageIndex + 1) % total : 0, true);
  }
  function prevSlide() {
    const total = t.maxPage + 1;
    goToPage(total > 0 ? (t.pageIndex - 1 + total) % total : 0, true);
  }

  function renderDots() {
    if (!testimonialDots) return;
    const total = t.maxPage + 1;
    testimonialDots.innerHTML = Array.from({ length: total }, (_, i) => {
      const active = i === t.pageIndex ? 'active' : '';
      return `<button type="button" class="testimonial-dot ${active}" data-page="${i}" aria-label="Halaman ${i + 1}" aria-current="${i === t.pageIndex ? 'true' : 'false'}"></button>`;
    }).join('');
    testimonialDots.querySelectorAll('.testimonial-dot').forEach((btn) => {
      btn.addEventListener('click', () => {
        goToPage(parseInt(btn.dataset.page, 10), true);
        pauseAutoplay();
      });
    });
  }

  function updateControls() {
    const canSlide = t.maxPage > 0;
    if (testimonialPrev) testimonialPrev.disabled = !canSlide;
    if (testimonialNext) testimonialNext.disabled = !canSlide;
  }

  function refresh() {
    if (!testimonialTrack) return;
    applyCardWidths();
    if (measure()) {
      t.pageIndex = clampNum(t.pageIndex, 0, t.maxPage);
      setPosition(false);
      renderDots();
      updateControls();
    }
  }

  function startAutoplay() {
    if (t.reducedMotion) return;
    stopAutoplay();
    t.autoplayId = setInterval(() => {
      nextSlide();
    }, AUTO_PLAY_DELAY);
  }

  function stopAutoplay() {
    if (t.autoplayId) {
      clearInterval(t.autoplayId);
      t.autoplayId = null;
    }
  }

  function pauseAutoplay() {
    stopAutoplay();
    startAutoplay();
  }

  function onPointerDown(e) {
    if (e.button !== 0) return;
    if (t.cardCount === 0) return;
    t.pointerDown = true;
    t.pointerStartX = e.clientX;
    t.pointerStartXform = t.currentX;
    stopAutoplay();
    try { testimonialTrack.setPointerCapture(e.pointerId); } catch (err) { /* noop */ }
  }

  function onPointerMove(e) {
    if (!t.pointerDown) return;
    const delta = e.clientX - t.pointerStartX;
    let x = t.pointerStartXform + delta;
    const maxLeft = -t.maxIndex * t.step;
    x = Math.min(0, Math.max(maxLeft, x));
    t.currentX = x;
    testimonialTrack.style.transition = 'none';
    testimonialTrack.style.transform = `translateX(${x}px)`;
  }

  function onPointerUp() {
    if (!t.pointerDown) return;
    t.pointerDown = false;
    const maxLeft = -t.maxIndex * t.step;
    const current = Math.min(0, Math.max(maxLeft, t.currentX));
    const cardIndex = clampNum(Math.round(-current / t.step), 0, t.maxIndex);
    t.pageIndex = clampNum(Math.floor(cardIndex / t.visibleCount), 0, t.maxPage);
    setPosition(true);
    renderDots();
    updateControls();
    startAutoplay();
  }

  function bindEvents() {
    if (testimonialPrev) testimonialPrev.addEventListener('click', () => { prevSlide(); pauseAutoplay(); });
    if (testimonialNext) testimonialNext.addEventListener('click', () => { nextSlide(); pauseAutoplay(); });

    if (testimonialSection) {
      testimonialSection.addEventListener('mouseenter', () => stopAutoplay());
      testimonialSection.addEventListener('mouseleave', () => startAutoplay());
      testimonialSection.addEventListener('focusin', () => stopAutoplay());
      testimonialSection.addEventListener('focusout', (e) => {
        if (!testimonialSection.contains(e.relatedTarget)) startAutoplay();
      });
    }

    // Unified pointer drag (mouse, touch, pen) for smooth swipe
    if (testimonialTrack) {
      testimonialTrack.addEventListener('pointerdown', onPointerDown);
      testimonialTrack.addEventListener('pointermove', onPointerMove);
      testimonialTrack.addEventListener('pointerup', onPointerUp);
      testimonialTrack.addEventListener('pointercancel', onPointerUp);
      testimonialTrack.addEventListener('pointerleave', onPointerUp);
    }

    // Horizontal mouse wheel / touchpad scroll
    if (testimonialSlider) {
      testimonialSlider.addEventListener('wheel', (e) => {
        if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
        e.preventDefault();
        if (e.deltaX > 0) {
          nextSlide();
        } else {
          prevSlide();
        }
        pauseAutoplay();
      }, { passive: false });
    }

    // Keyboard navigation (arrows move between pages)
    if (testimonialSection) {
      testimonialSection.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') { e.preventDefault(); nextSlide(); pauseAutoplay(); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); prevSlide(); pauseAutoplay(); }
      });
    }

    // Responsive re-measure on resize
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(refresh, 150);
    });
  }

  function initTestimonial() {
    if (!testimonialTrack) return;
    window.testimonialHandleImgError = testimonialHandleImgError;
    renderCards();
    refresh();
    startAutoplay();
    bindEvents();
  }

  initTestimonial();

  // ============================================
  // FAQ ACCORDION
  // ============================================
  const faqContainer = document.getElementById('faqContainer');

  const faqs = [
    { q: 'Bagaimana cara mengajukan pinjaman di SMART FUND?', a: 'Daftar dahulu, kemudian mulai log masuk ke akaun anda. Pilih menu permohonan pinjaman, isi maklumat pinjaman, dan hantar. Permohonan anda akan diproses oleh sistem kami.' },
    { q: 'Berapa kadar faedah yang dikenakan?', a: 'Kadar faedah kami bermula dari 5% setahun, supaya ansuran anda terasa ringan. Kadar tepat ditentukan berdasarkan profil kelayakan dan tempoh pinjaman.' },
    { q: 'Berapa jumlah pinjaman yang boleh dimohon?', a: 'Anda boleh memohon pinjaman antara RM2,000.00 hingga RM200,000.00, dengan tempoh 6 hingga 60 bulan.' },
    { q: 'Adakah SMART FUND selamat dan dipercayai?', a: 'Ya, SMART FUND mengutamakan keselamatan dan keyakinan pengguna. Kami menggunakan teknologi enkripsi tinggi dan prinsip keelamanan yang ketat.' },
    { q: 'Berapa lama proses kelulusan?', a: 'Proses kelulusan kami pantas. Setelah permohonan dikemukakan, tim kami akan menyemaknya dan memberikan keputusan dalam tempoh masa yang singkat—iaitu 1 hingga 2 jam.' },
    { q: 'Dokumen apa yang diperlukan?', a: 'Kami hanya memerlukan dokumentasi yang minimum. Proses pengesahannya praktikal dan mudah.' },
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

// ============================================
// PROMO BANNER CAROUSEL
// ============================================
async function loadPromoBanners() {
  const carousel = document.getElementById('promoCarousel');
  const placeholder = document.getElementById('promoPlaceholder');
  const dotsContainer = document.getElementById('promoDots');
  if (!carousel || !placeholder) return;

  let banners = [];
  try {
    const res = await fetch('/api/banners');
    if (!res.ok) return;
    const data = await res.json();
    if (!data.success || !data.data || !data.data.length) {
      placeholder.innerHTML = '<div class="flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-2xl p-8 text-slate-400"><p class="text-sm">Tiada promo aktif</p></div>';
      return;
    }
    banners = data.data;
  } catch (err) {
    console.error('Load promo banners error:', err);
    placeholder.innerHTML = '<div class="flex items-center justify-center bg-red-50 dark:bg-red-900/20 rounded-2xl p-8 text-red-400"><p class="text-sm">Gagal memuatkan promo</p></div>';
    return;
  }
    // Render banners
    carousel.innerHTML = banners.map((b, i) => `
      <a href="${b.link_url || '#'}" class="group block w-full shrink-0 snap-center overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow" target="${b.link_url ? '_blank' : '_self'}" rel="${b.link_url ? 'noopener noreferrer' : ''}" aria-label="${b.title}">
        <img src="${b.image_url}" alt="${b.title}" loading="lazy" class="w-full h-auto object-contain bg-slate-50 dark:bg-slate-800" onerror="this.style.display='none'" />
        <div class="flex items-center justify-between gap-3 px-4 py-3 md:px-5 md:py-4 border-t border-slate-100 dark:border-slate-800">
          <div class="min-w-0">
            <h4 class="font-bold text-slate-900 dark:text-white text-sm md:text-base leading-snug">${b.title}</h4>
            ${b.subtitle ? `<p class="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">${b.subtitle}</p>` : ''}
          </div>
          <span class="shrink-0 text-sm font-semibold text-primary inline-flex items-center gap-1">Lihat Promo <i class="fas fa-arrow-right"></i></span>
        </div>
      </a>
    `).join('');

    // Create navigation dots
    if (dotsContainer) {
      dotsContainer.innerHTML = banners.map((_, i) => `
        <button class="w-2 h-2 rounded-full ${i === 0 ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'}" data-index="${i}" aria-label="Slide ${i + 1}"></button>
      `).join('');
    }

    // Auto-scroll carousel
    const carouselEl = document.getElementById('promoCarousel');
    const dots = document.querySelectorAll('#promoDots button');
    let currentIndex = 0;
    let autoScrollInterval = null;

    function goToSlide(index) {
      const items = carouselEl.querySelectorAll('a');
      if (!items.length) return;
      const itemWidth = items[0].offsetWidth + 16; // item width + gap
      carouselEl.scrollTo({ left: itemWidth * index, behavior: 'smooth' });
      currentIndex = index;
      updateDots();
    }

    function updateDots() {
      const dots = document.querySelectorAll('#promoDots button');
      dots.forEach((dot, i) => {
        dot.classList.toggle('bg-primary', i === currentIndex);
        dot.classList.toggle('bg-slate-300', i !== currentIndex);
        dot.classList.toggle('dark:bg-slate-600', i !== currentIndex);
      });
    }

    function nextSlide() {
      const items = carouselEl.querySelectorAll('a');
      if (!items.length) return;
      currentIndex = (currentIndex + 1) % items.length;
      goToSlide(currentIndex);
    }

    function startAutoScroll() {
      stopAutoScroll();
      autoScrollInterval = setInterval(nextSlide, 5000);
    }

    function stopAutoScroll() {
      if (autoScrollInterval) clearInterval(autoScrollInterval);
    }

    // Dot click handlers
    document.getElementById('promoDots')?.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (btn) {
        const index = parseInt(btn.dataset.index, 10);
        goToSlide(index);
        stopAutoScroll();
        startAutoScroll();
      }
    });

    // Pause on hover
    carouselEl?.addEventListener('mouseenter', stopAutoScroll);
    carouselEl?.addEventListener('mouseleave', startAutoScroll);

    // Initialize
    startAutoScroll();
  }

// Initialize promo banners when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  loadPromoBanners();
});
