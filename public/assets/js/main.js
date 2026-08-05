/* ============================================
   SMART FUND - Landing Page Logic
   Calculator, Multi-step form, FAQ, Dark mode
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  hidePageLoader();
  AOS.init({ duration: 800, once: true, offset: 80 });

  // ============================================
  // NAVBAR
  // ============================================
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) navbar.classList.add('shadow-md');
    else navbar.classList.remove('shadow-md');
  });

  // Mobile menu
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));
    mobileMenu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => mobileMenu.classList.add('hidden')));
  }

  // Dark mode toggle
  const darkToggle = document.getElementById('darkToggle');
  if (darkToggle) {
    const updateIcon = () => {
      darkToggle.innerHTML = DarkMode.isDark()
        ? '<i class="fas fa-sun text-amber-500"></i>'
        : '<i class="fas fa-moon text-slate-600"></i>';
    };
    updateIcon();
    darkToggle.addEventListener('click', () => {
      DarkMode.toggle();
      updateIcon();
    });
  }

  // ============================================
  // LOAN CALCULATOR
  // ============================================
  const loanAmount = document.getElementById('loanAmount');
  const loanTenor = document.getElementById('loanTenor');
  const amountDisplay = document.getElementById('amountDisplay');
  const monthlyPaymentEl = document.getElementById('monthlyPayment');
  const totalInterestEl = document.getElementById('totalInterest');
  const totalPaymentEl = document.getElementById('totalPayment');

  function calculateLoan(principal, tenorMonths, annualRate = 5) {
    const monthlyRate = annualRate / 100 / 12;
    const monthly = principal * (monthlyRate * Math.pow(1 + monthlyRate, tenorMonths)) / (Math.pow(1 + monthlyRate, tenorMonths) - 1);
    const total = monthly * tenorMonths;
    const interest = total - principal;
    return { monthly, total, interest };
  }

  // Range min/max per mata uang - slider tetap dalam IDR untuk konsistensi
  const LOAN_LIMITS_IDR = {
    min: 1000000,    // Rp 1.000.000 (≈ RM 290, ≈ $ 62)
    max: 500000000,   // Rp 500.000.000 (≈ RM 145.000, ≈ $ 31.000)
    step: 1000000,   // Rp 1.000.000
    defaultVal: 10000000, // Rp 10.000.000
  };

  function updateCalculatorRange() {
    if (!loanAmount) return;
    // Slider selalu menggunakan IDR untuk konsistensi logika
    loanAmount.min = LOAN_LIMITS_IDR.min;
    loanAmount.max = LOAN_LIMITS_IDR.max;
    loanAmount.step = LOAN_LIMITS_IDR.step;
    // Set ke nilai default dalam IDR
    const currentVal = parseInt(loanAmount.value, 10);
    if (!currentVal || currentVal < LOAN_LIMITS_IDR.min || currentVal > LOAN_LIMITS_IDR.max) {
      loanAmount.value = LOAN_LIMITS_IDR.defaultVal;
    }
    // Update min/max labels dengan format currency
    const minLabel = document.getElementById('calcMinLabel');
    const maxLabel = document.getElementById('calcMaxLabel');
    if (minLabel) minLabel.textContent = formatRupiah(LOAN_LIMITS_IDR.min);
    if (maxLabel) maxLabel.textContent = formatRupiah(LOAN_LIMITS_IDR.max);
  }

  function updateCalculator() {
    if (!loanAmount) return;
    // Slider value selalu dalam IDR
    const amount = parseInt(loanAmount.value, 10);
    const tenor = parseInt(loanTenor.value, 10);

    if (isNaN(amount) || amount < LOAN_LIMITS_IDR.min) {
      loanAmount.value = LOAN_LIMITS_IDR.min;
      return updateCalculator();
    }
    if (amount > LOAN_LIMITS_IDR.max) {
      loanAmount.value = LOAN_LIMITS_IDR.max;
      return updateCalculator();
    }

    // Tampilkan nilai amount dalam mata uang aktif
    amountDisplay.textContent = formatRupiah(amount);

    // Kalkulasi bunga selalu dalam IDR (5% per tahun)
    const calc = calculateLoan(amount, tenor, 5);

    // Tampilkan hasil dalam mata uang aktif
    monthlyPaymentEl.textContent = formatRupiah(calc.monthly);
    totalInterestEl.textContent = formatRupiah(calc.interest);
    totalPaymentEl.textContent = formatRupiah(calc.total);
  }

  if (loanAmount) {
    updateCalculatorRange();
    loanAmount.addEventListener('input', updateCalculator);
    loanTenor.addEventListener('change', updateCalculator);
    updateCalculator();
  }

  // Apply now button -> check login
  const applyNowBtn = document.getElementById('applyNowBtn');
  if (applyNowBtn) {
    applyNowBtn.addEventListener('click', () => {
      const token = Token.get();
      if (!token) {
        Swal.fire({
          icon: 'info',
          title: 'Login Diperlukan',
          text: 'Anda harus login terlebih dahulu untuk mengajukan pinjaman.',
          showCancelButton: true,
          confirmButtonColor: '#2563eb',
          cancelButtonColor: '#64748b',
          confirmButtonText: 'Login Sekarang',
          cancelButtonText: 'Daftar',
        }).then((result) => {
          if (result.isConfirmed) window.location.href = `${BASE_PATH}/login.html`;
          else if (result.dismiss === Swal.DismissReason.cancel) window.location.href = `${BASE_PATH}/register.html`;
        });
      } else {
        // Pre-fill form & scroll
        document.getElementById('formAmount').value = loanAmount.value;
        document.getElementById('formTenor').value = loanTenor.value;
        document.getElementById('apply').scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // ============================================
  // MULTI STEP FORM
  // ============================================
  const step1 = document.getElementById('step1');
  const step2 = document.getElementById('step2');
  const step1Indicator = document.getElementById('step1Indicator');
  const step2Indicator = document.getElementById('step2Indicator');
  const stepLine1 = document.getElementById('stepLine1');
  const nextStepBtn = document.getElementById('nextStepBtn');
  const prevStepBtn = document.getElementById('prevStepBtn');
  const submitLoanBtn = document.getElementById('submitLoanBtn');

  let currentStep = 1;

  function goToStep(step) {
    currentStep = step;
    if (step === 1) {
      step1.classList.remove('hidden');
      step2.classList.add('hidden');
      step1Indicator.classList.remove('complete', 'inactive');
      step1Indicator.classList.add('active');
      step2Indicator.classList.remove('active', 'complete');
      step2Indicator.classList.add('inactive');
      stepLine1.classList.remove('bg-blue-500');
      stepLine1.classList.add('bg-slate-200');
    } else {
      step1.classList.add('hidden');
      step2.classList.remove('hidden');
      step1Indicator.classList.remove('active', 'inactive');
      step1Indicator.classList.add('complete');
      step2Indicator.classList.remove('inactive', 'complete');
      step2Indicator.classList.add('active');
      stepLine1.classList.remove('bg-slate-200');
      stepLine1.classList.add('bg-blue-500');
    }
  }

  if (nextStepBtn) {
    nextStepBtn.addEventListener('click', () => {
      const fullName = document.getElementById('formFullName').value.trim();
      const phone = document.getElementById('formPhone').value.trim();
      if (!fullName) return showToast('Nama lengkap wajib diisi', 'error');
      if (fullName.length < 3) return showToast('Nama minimal 3 karakter', 'error');
      if (!phone) return showToast('Nomor HP wajib diisi', 'error');
      if (!/^(\+62|62|0)8[1-9]\d{6,11}$/.test(phone.replace(/[\s-]/g, ''))) return showToast('Nomor HP tidak valid', 'error');
      goToStep(2);
    });
  }

  if (prevStepBtn) prevStepBtn.addEventListener('click', () => goToStep(1));

  if (submitLoanBtn) {
    submitLoanBtn.addEventListener('click', async () => {
      const token = Token.get();
      if (!token) {
        Swal.fire({
          icon: 'info',
          title: 'Login Diperlukan',
          text: 'Anda harus login untuk submit pengajuan pinjaman.',
          showCancelButton: true,
          confirmButtonColor: '#2563eb',
          cancelButtonColor: '#64748b',
          confirmButtonText: 'Login Sekarang',
          cancelButtonText: 'Daftar',
        }).then((r) => {
          if (r.isConfirmed) window.location.href = `${BASE_PATH}/login.html`;
          else if (r.dismiss === Swal.DismissReason.cancel) window.location.href = `${BASE_PATH}/register.html`;
        });
        return;
      }

      const amount = parseFloat(document.getElementById('formAmount').value);
      const tenor = parseInt(document.getElementById('formTenor').value, 10);
      const purpose = document.getElementById('formPurpose').value;

      if (!amount || amount < 1000000 || amount > 500000000) return showToast('Jumlah pinjaman Rp1.000.000 - Rp500.000.000', 'error');
      if (!tenor || tenor < 6 || tenor > 60) return showToast('Tenor 6 - 60 bulan', 'error');
      if (!purpose) return showToast('Tujuan pinjaman wajib dipilih', 'error');

      setBtnLoading(submitLoanBtn, true);
      const res = await api('/loans/apply', {
        method: 'POST',
        body: { amount, tenor, purpose },
      });
      setBtnLoading(submitLoanBtn, false);

      if (res.success) {
        await alertSuccess('Pengajuan Berhasil!', `Pengajuan pinjaman #${res.data.applicationId} telah dikirim. Status: Menunggu Persetujuan. Admin akan segera memverifikasi.`);
        window.location.href = `${BASE_PATH}/dashboard.html`;
      } else {
        showToast(res.message || 'Gagal mengajukan pinjaman', 'error');
      }
    });
  }

  // ============================================
  // TESTIMONI CAROUSEL (auto-rotate setiap 30 detik)
  // ============================================
  const testimoniTrack = document.getElementById('testimoniTrack');
  const testimoniDots = document.getElementById('testimoniDots');

  // 12 testimoni, dibagi per grup 3
  const allTestimoni = [
    { name: 'Budi Santoso', role: 'Pengusaha, Jakarta', rating: 5, text: 'Prosesnya cepat dan mudah. Saya bisa mendapatkan modal usaha dalam waktu singkat. Terima kasih SMART FUND!' },
    { name: 'Siti Rahayu', role: 'Ibu Rumah Tangga, Bandung', rating: 5, text: 'Bunganya ringan dan transparan. Tidak ada biaya tersembunyi. Sangat membantu untuk renovasi rumah saya.' },
    { name: 'Ahmad Fauzi', role: 'Karyawan, Surabaya', rating: 5, text: 'Platform pinjaman online terpercaya. Berizin OJK jadi lebih aman. Proses verifikasi cepat dan praktis.' },
    { name: 'Dewi Lestari', role: 'Mahasiswa, Yogyakarta', rating: 5, text: 'Dana pendidikan saya cair tepat waktu. Prosesnya sangat membantu untuk kelancaran studi saya.' },
    { name: 'Rizky Pratama', role: 'Freelancer, Bali', rating: 5, text: 'Saya butuh modal mendadak untuk project klien. SMART FUND cair dalam 1 hari kerja. Mantap!' },
    { name: 'Linda Kusuma', role: 'Dokter, Medan', rating: 5, text: 'Pelayanan customer service-nya ramah dan responsif. Cicilan ringan sesuai kemampuan saya.' },
    { name: 'Hendra Wijaya', role: 'Petani, Semarang', rating: 5, text: 'Modal usaha pertanian saya jadi lancar. Bunganya sangat kompetitif dibanding tempat lain.' },
    { name: 'Maya Anggraini', role: 'Ibu Rumah Tangga, Makassar', rating: 5, text: 'Untuk kebutuhan biaya persalinan, SMART FUND benar-benar membantu. Prosesnya cepat dan aman.' },
    { name: 'Andi Setiawan', role: 'PNS, Palembang', rating: 5, text: 'Renovasi rumah saya berjalan lancar dengan bantuan pinjaman dari SMART FUND. Recommended!' },
    { name: 'Fitri Handayani', role: 'Wiraswasta, Bogor', rating: 5, text: 'Tidak ada biaya tersembunyi, semuanya transparan. Admin verifikasi sangat cepat dan profesional.' },
    { name: 'Joko Susilo', role: 'Mekanik, Malang', rating: 5, text: 'Buka usaha bengkel jadi lebih mudah. Pinjaman cair tanpa ribet dan syarat yang mudah.' },
    { name: 'Ratna Sari', role: 'Guru, Denpasar', rating: 5, text: 'Saya sangat terbantu untuk biaya pendidikan anak. SMART FUND bisa diandalkan dan terpercaya.' },
  ];

  // Acak urutan testimoni (shuffle)
  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Kelompokkan testimoni per 3
  function chunkArray(arr, size) {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  }

  if (testimoniTrack) {
    const shuffled = shuffleArray([...allTestimoni]);
    const groups = chunkArray(shuffled, 3);
    let currentGroup = 0;

    function renderTestimoniGroup(group) {
      const cards = group.map((t, idx) => {
        const stars = Array(t.rating).fill('<i class="fas fa-star"></i>').join('');
        return `
          <div class="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 card-hover testimonial-card" data-aos="fade-up" data-aos-delay="${idx * 100}">
            <div class="flex text-amber-400 mb-4">${stars}</div>
            <p class="text-slate-600 mb-6 italic">"${t.text}"</p>
            <div class="flex items-center gap-3">
              <div class="w-14 h-14 rounded-full gradient-bg flex items-center justify-center text-white font-bold text-lg shadow-sm">
                ${t.name.charAt(0)}
              </div>
              <div>
                <p class="font-bold text-slate-900">${t.name}</p>
                <p class="text-sm text-slate-500">${t.role}</p>
              </div>
            </div>
          </div>
        `;
      }).join('');
      testimoniTrack.innerHTML = cards;
      // Re-init AOS untuk animasi fade
      if (typeof AOS !== 'undefined') {
        setTimeout(() => AOS.refresh(), 50);
      }
    }

    function renderDots() {
      if (!testimoniDots) return;
      testimoniDots.innerHTML = groups.map((_, i) => `
        <button class="testimoni-dot w-3 h-3 rounded-full transition ${i === currentGroup ? 'bg-blue-600 w-8' : 'bg-slate-300 hover:bg-slate-400'}" data-index="${i}" aria-label="Slide ${i + 1}"></button>
      `).join('');
      testimoniDots.querySelectorAll('.testimoni-dot').forEach((btn) => {
        btn.addEventListener('click', () => {
          currentGroup = parseInt(btn.dataset.index, 10);
          updateTestimoni();
        });
      });
    }

    function updateTestimoni() {
      // Fade out
      testimoniTrack.style.opacity = '0';
      setTimeout(() => {
        renderTestimoniGroup(groups[currentGroup]);
        renderDots();
        // Fade in
        testimoniTrack.style.opacity = '1';
      }, 250);
    }

    // Initial render
    renderTestimoniGroup(groups[currentGroup]);
    renderDots();
    testimoniTrack.style.opacity = '1';

    // Auto-rotate every 30 seconds
    let autoRotateInterval = setInterval(() => {
      currentGroup = (currentGroup + 1) % groups.length;
      updateTestimoni();
    }, 30000);

    // Pause when hover, resume when leave
    const testimoniSection = document.getElementById('testimoni');
    if (testimoniSection) {
      testimoniSection.addEventListener('mouseenter', () => clearInterval(autoRotateInterval));
      testimoniSection.addEventListener('mouseleave', () => {
        clearInterval(autoRotateInterval);
        autoRotateInterval = setInterval(() => {
          currentGroup = (currentGroup + 1) % groups.length;
          updateTestimoni();
        }, 30000);
      });
    }
  }

  // ============================================
  // LANGUAGE CHANGE - Update currency display
  // ============================================
  document.addEventListener('languageChanged', () => {
    if (typeof updateCalculatorRange === 'function') {
      updateCalculatorRange();
    }
    if (typeof updateCalculator === 'function') {
      updateCalculator();
    }
  });

  // ============================================
  // FAQ
  // ============================================
  const faqs = [
    { q: 'Bagaimana cara mengajukan pinjaman di SMART FUND?', a: 'Cukup daftar akun, login ke dashboard, lalu pilih menu Ajukan Pinjaman. Isi data diri dan data pinjaman, lalu submit. Pengajuan akan diproses oleh admin.' },
    { q: 'Berapa bunga yang dikenakan?', a: 'Bunga kompetitif mulai 5% per tahun, sehingga cicilan Anda menjadi lebih ringan dibanding platform lain.' },
    { q: 'Berapa jumlah pinjaman yang bisa diajukan?', a: 'Anda dapat mengajukan pinjaman mulai dari Rp1.000.000 hingga Rp500.000.000 dengan tenor 6-60 bulan.' },
    { q: 'Apakah SMART FUND aman dan terpercaya?', a: 'Ya, SMART FUND berizin dan diawasi oleh Otoritas Jasa Keuangan (OJK), sehingga memberikan rasa aman bagi setiap nasabah.' },
    { q: 'Berapa lama proses persetujuan?', a: 'Proses persetujuan cepat. Setelah submit, admin akan memverifikasi dan memberikan keputusan dalam waktu singkat.' },
    { q: 'Dokumen apa saja yang dibutuhkan?', a: 'Dokumen sederhana seperti KTP dan data pribadi. Proses verifikasi praktis dan tidak rumit.' },
  ];

  const faqContainer = document.getElementById('faqContainer');
  if (faqContainer) {
    faqs.forEach((faq, i) => {
      const item = document.createElement('div');
      item.className = 'bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden';
      item.setAttribute('data-aos', 'fade-up');
      item.setAttribute('data-aos-delay', i * 50);
      item.innerHTML = `
        <button class="faq-btn w-full flex items-center justify-between p-5 text-left font-semibold text-slate-800 hover:bg-blue-50 transition">
          <span>${faq.q}</span>
          <i class="fas fa-chevron-down text-blue-600 transition-transform"></i>
        </button>
        <div class="faq-answer hidden p-5 pt-0 text-slate-600">${faq.a}</div>
      `;
      faqContainer.appendChild(item);
      const btn = item.querySelector('.faq-btn');
      const answer = item.querySelector('.faq-answer');
      const icon = btn.querySelector('i');
      btn.addEventListener('click', () => {
        answer.classList.toggle('hidden');
        icon.classList.toggle('rotate-180');
      });
    });
  }
});