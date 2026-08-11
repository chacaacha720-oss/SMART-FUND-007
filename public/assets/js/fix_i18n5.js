const fs = require('fs');
let content = fs.readFileSync('i18n.js', 'utf8');

// === ID Section ===
// Add features.f5, f6 after features.f4.desc
const idFeaturesOld = `      'features.f4.desc': 'Layanan berizin dan diawasi oleh Otoritas Jasa Keuangan (OJK) untuk keamanan nasabah.',

      // ===== CALCULATOR =====`;
const idFeaturesNew = `      'features.f4.desc': 'Layanan berizin dan diawasi oleh Otoritas Jasa Keuangan (OJK) untuk keamanan nasabah.',
      'features.f5.title': 'Informasi Transparan',
      'features.f5.desc': 'Semua biaya dan syarat kami jelaskan secara lengkap.',
      'features.f6.title': 'Pengelolaan Terintegrasi',
      'features.f6.desc': 'Kelola pinjaman, cicilan, dan penarikan dana dengan nyaman melalui satu dashboard.',

      // ===== PRODUCTS =====
      'products.label': 'PRODUK',
      'products.title': 'Pilihan Pembiayaan',
      'products.desc': 'Kami menyediakan berbagai opsi pinjaman yang disesuaikan dengan kebutuhan Anda',
      'products.multiline.title': 'Pinjaman Multiguna',
      'products.multiline.desc': 'Untuk keperluan mendesak hingga modal usaha lancar.',
      'products.business.title': 'Modal Usaha',
      'products.business.desc': 'Didanai untuk mengembangkan usaha Anda.',
      'products.education.title': 'Pendidikan',
      'products.education.desc': 'Biayai masa depan dengan biaya pendidikan.',
      'products.renovation.title': 'Renovasi Rumah',
      'products.renovation.desc': 'Wujudkan rumah impian Anda.',
      'products.personal.title': 'Kebutuhan Pribadi',
      'products.personal.desc': 'Untuk keperluan pribadi lainnya.',
      'products.btn': 'Ajukan Sekarang',

      // ===== HOW IT WORKS =====
      'howitworks.label': 'CARA KERJA',
      'howitworks.title': 'Proses Pengajuan yang Mudah',
      'howitworks.desc': 'Ikuti 5 langkah sederhana untuk mendapatkan dana yang Anda butuhkan',

      // ===== TIMELINE =====
      'timeline.step1.title': 'Daftar Akun',
      'timeline.step1.desc': 'Buat akun SMART FUND gratis dalam hitungan menit.',
      'timeline.step2.title': 'Ajukan Pinjaman',
      'timeline.step2.desc': 'Isi formulir pinjaman dengan data yang diminta.',
      'timeline.step3.title': 'Verifikasi Data',
      'timeline.step3.desc': 'Tim kami memverifikasi data dan dokumen Anda.',
      'timeline.step4.title': 'Persetujuan',
      'timeline.step4.desc': 'Dapatkan keputusan pinjaman dalam waktu singkat.',
      'timeline.step5.title': 'Dana Diproses',
      'timeline.step5.desc': 'Dana langsung dicairkan ke rekening Anda.',

      // ===== TRUST =====
      'trust.label': 'KEPERCAYAAN',
      'trust.title': 'Kepercayaan dan Keamanan Anda Prioritas Kami',
      'trust.desc': 'SMART FUND menggabungkan teknologi mutakhir dengan prinsip kepercayaan untuk melindungi setiap transaksi Anda.',
      'trust.transparency.title': 'Transparansi Penuh',
      'trust.transparency.desc': 'Semua biaya dan syarat kami jelaskan secara lengkap.',
      'trust.security.title': 'Keamanan Data',
      'trust.security.desc': 'Data pribadi dilindungi dengan enkripsi end-to-end.',
      'trust.noHidden.title': 'Tidak Ada Biaya Tersembunyi',
      'trust.noHidden.desc': 'Apa yang Anda lihat adalah apa yang Anda bayar.',
      'trust.support.title': 'Dukungan 24/7',
      'trust.support.desc': 'Tim dukungan kami siap membantu kapan saja.',

      // ===== CALCULATOR =====`;

content = content.replace(idFeaturesOld, idFeaturesNew);

// Add nav products, timeline, trust, testimonial after nav.register
const idNavOld = `      'nav.register': 'Daftar',`;
const idNavNew = `      'nav.register': 'Daftar',
      'nav.products': 'Produk',
      'nav.timeline': 'Cara Kerja',
      'nav.trust': 'Kepercayaan',
      'nav.testimonial': 'Testimoni',`;
content = content.replace(idNavOld, idNavNew);

// Add footer products, help after footer.contact
const idFooterOld = `      'footer.contact': 'Kontak',
      'footer.rights': 'All rights reserved. Berizin & diawasi OJK.',`;
const idFooterNew = `      'footer.contact': 'Kontak',
      'footer.products': 'Produk',
      'footer.help': 'Bantuan',
      'footer.rights': 'All rights reserved. Berizin & diawasi OJK.',`;
content = content.replace(idFooterOld, idFooterNew);

// Add faq.subtitle after faq.title
const idFaqOld = `      'faq.title': 'Pertanyaan Umum',`;
const idFaqNew = `      'faq.title': 'Pertanyaan Umum',
      'faq.subtitle': 'Pertanyaan yang sering ditanyakan tentang SMART FUND',`;
content = content.replace(idFaqOld, idFaqNew);

// Add finalCta after cta
const idCtaOld = `      'cta.btn': 'Daftar Sekarang',

      // ===== FOOTER =====`;
const idCtaNew = `      'cta.btn': 'Daftar Sekarang',

      // ===== FINAL CTA =====
      'finalCta.title': 'Siap Mengelola Kebutuhan Dana Anda?',
      'finalCta.desc': 'Daftar sekarang dan dapatkan pinjaman online dengan proses cepat dan transparan',
      'finalCta.btn': 'Mulai Pengajuan',

      // ===== FOOTER =====`;
content = content.replace(idCtaOld, idCtaNew);

// === MS Section ===
const msFeaturesOld = `      'features.f4.desc': 'Layanan berlesen dan diawasi oleh Otorati Jasa Kewangan (OJK) untuk keselamatan pelanggan.',

      // ===== CALCULATOR =====`;
const msFeaturesNew = `      'features.f4.desc': 'Layanan berlesen dan diawasi oleh Otorati Jasa Kewangan (OJK) untuk keselamatan pelanggan.',
      'features.f5.title': 'Informasi Transparan',
      'features.f5.desc': 'Semua yuran dan syarat kami terangkan sepenuhnya.',
      'features.f6.title': 'Pengurusan Terintegrasi',
      'features.f6.desc': 'Kelola pinjaman, ansuran, dan penarikan dana dengan selesa melalui satu dashboard.',

      // ===== PRODUCTS =====
      'products.label': 'PRODUK',
      'products.title': 'Pilihan Pembiayaan',
      'products.desc': 'Kami menyediakan pelbagai pilihan pinjaman yang sesuai dengan keperluan anda',
      'products.multiline.title': 'Pinjaman Multiguna',
      'products.multiline.desc': 'Untuk keperluan mendesak hingga modal perniagaan lancar.',
      'products.business.title': 'Modal Perniagaan',
      'products.business.desc': 'Didanai untuk mengembangkan perniagaan anda.',
      'products.education.title': 'Pendidikan',
      'products.education.desc': 'Biayai masa depan dengan kos pendidikan.',
      'products.renovation.title': 'Pengubahsuaian Rumah',
      'products.renovation.desc': 'Wujudkan rumah impian anda.',
      'products.personal.title': 'Keperluan Peribadi',
      'products.personal.desc': 'Untuk keperluan peribadi lainnya.',
      'products.btn': 'Ajukan Sekarang',

      // ===== HOW IT WORKS =====
      'howitworks.label': 'CARA KERJA',
      'howitworks.title': 'Proses Pengajuan yang Mudah',
      'howitworks.desc': 'Ikuti 5 langkah sederhana untuk mendapatkan dana yang Anda butuhkan',

      // ===== TIMELINE =====
      'timeline.step1.title': 'Daftar Akun',
      'timeline.step1.desc': 'Buat akaun SMART FUND gratis dalam hitungan minit.',
      'timeline.step2.title': 'Ajukan Pinjaman',
      'timeline.step2.desc': 'Isi formulir pinjaman dengan data yang diminta.',
      'timeline.step3.title': 'Verifikasi Data',
      'timeline.step3.desc': 'Tim kami memverifikasi data dan dokumen Anda.',
      'timeline.step4.title': 'Persetujuan',
      'timeline.step4.desc': 'Dapatkan keputusan pinjaman dalam waktu singkat.',
      'timeline.step5.title': 'Dana Diproses',
      'timeline.step5.desc': 'Dana langsung dicairkan ke rekening Anda.',

      // ===== TRUST =====
      'trust.label': 'KEPERCAYAAN',
      'trust.title': 'Kepercayaan dan Keamanan Anda Prioritas Kami',
      'trust.desc': 'SMART FUND menggabungkan teknologi mutakhir dengan prinsip kepercayaan untuk melindungi setiap transaksi Anda.',
      'trust.transparency.title': 'Ketelusan Penuh',
      'trust.transparency.desc': 'Semua yuran dan syarat kami terangkan sepenuhnya.',
      'trust.security.title': 'Keselamatan Data',
      'trust.security.desc': 'Data peribadi dilindungi dengan enkripsi end-to-end.',
      'trust.noHidden.title': 'Tiada Yuran Tersembunyi',
      'trust.noHidden.desc': 'Apa yang anda lihat adalah apa yang anda bayar.',
      'trust.support.title': 'Sokongan 24/7',
      'trust.support.desc': 'Pasukan sokongan kami sedia membantu pada bila-bila masa.',

      // ===== CALCULATOR =====`;
content = content.replace(msFeaturesOld, msFeaturesNew);

// MS nav
const msNavOld = `      'nav.register': 'Daftar',`;
const msNavNew = `      'nav.register': 'Daftar',
      'nav.products': 'Produk',
      'nav.timeline': 'Cara Kerja',
      'nav.trust': 'Kepercayaan',
      'nav.testimonial': 'Testimoni',`;
content = content.replace(msNavOld, msNavNew);

// MS footer
const msFooterOld = `      'footer.contact': 'Hubungi',
      'footer.rights': 'Hak cipta terpelihara. Berlesen & diawasi OJK.',`;
const msFooterNew = `      'footer.contact': 'Hubungi',
      'footer.products': 'Produk',
      'footer.help': 'Bantuan',
      'footer.rights': 'Hak cipta terpelihara. Berlesen & diawasi OJK.',`;
content = content.replace(msFooterOld, msFooterNew);

// MS faq
const msFaqOld = `      'faq.title': 'Soalan Lazim',`;
const msFaqNew = `      'faq.title': 'Soalan Lazim',
      'faq.subtitle': 'Soalan yang sering ditanyakan tentang SMART FUND',`;
content = content.replace(msFaqOld, msFaqNew);

// MS cta
const msCtaOld = `      'cta.btn': 'Daftar Sekarang',

      // ===== FOOTER =====`;
const msCtaNew = `      'cta.btn': 'Daftar Sekarang',

      // ===== FINAL CTA =====
      'finalCta.title': 'Siap Mengelola Kebutuhan Dana Anda?',
      'finalCta.desc': 'Daftar sekarang dan dapatkan pinjaman online dengan proses cepat dan transparan',
      'finalCta.btn': 'Mulai Pengajuan',

      // ===== FOOTER =====`;
content = content.replace(msCtaOld, msCtaNew);

// === EN Section ===
const enFeaturesOld = `      'features.f4.desc': 'Licensed and supervised by the Financial Services Authority (OJK) for customer safety.',

      // ===== CALCULATOR =====`;
const enFeaturesNew = `      'features.f4.desc': 'Licensed and supervised by the Financial Services Authority (OJK) for customer safety.',
      'features.f5.title': 'Full Transparency',
      'features.f5.desc': 'All fees and terms are explained in full.',
      'features.f6.title': 'Integrated Management',
      'features.f6.desc': 'Manage loans, installments, and withdrawals conveniently through one dashboard.',

      // ===== PRODUCTS =====
      'products.label': 'PRODUCTS',
      'products.title': 'Financing Options',
      'products.desc': 'We provide various loan options tailored to your needs',
      'products.multiline.title': 'Multi-purpose Loan',
      'products.multiline.desc': 'For urgent needs to working capital.',
      'products.business.title': 'Business Capital',
      'products.business.desc': 'Funded to grow your business.',
      'products.education.title': 'Education',
      'products.education.desc': 'Finance your future with education costs.',
      'products.renovation.title': 'Home Renovation',
      'products.renovation.desc': 'Create your dream home.',
      'products.personal.title': 'Personal Needs',
      'products.personal.desc': 'For other personal needs.',
      'products.btn': 'Apply Now',

      // ===== HOW IT WORKS =====
      'howitworks.label': 'HOW IT WORKS',
      'howitworks.title': 'Easy Application Process',
      'howitworks.desc': 'Follow 5 simple steps to get the funds you need',

      // ===== TIMELINE =====
      'timeline.step1.title': 'Create Account',
      'timeline.step1.desc': 'Create a SMART FUND account for free in seconds.',
      'timeline.step2.title': 'Apply for Loan',
      'timeline.step2.desc': 'Fill in the loan form with the required data.',
      'timeline.step3.title': 'Data Verification',
      'timeline.step3.desc': 'Our team verifies your data and documents.',
      'timeline.step4.title': 'Approval',
      'timeline.step4.desc': 'Get your loan decision quickly.',
      'timeline.step5.title': 'Funds Processed',
      'timeline.step5.desc': 'Funds are disbursed directly to your account.',

      // ===== TRUST =====
      'trust.label': 'TRUST',
      'trust.title': 'Your Trust and Security Are Our Priority',
      'trust.desc': 'SMART FUND combines cutting-edge technology with trust principles to protect every transaction.',
      'trust.transparency.title': 'Full Transparency',
      'trust.transparency.desc': 'All fees and terms are explained in full.',
      'trust.security.title': 'Data Security',
      'trust.security.desc': 'Personal data is protected with end-to-end encryption.',
      'trust.noHidden.title': 'No Hidden Fees',
      'trust.noHidden.desc': 'What you see is what you pay.',
      'trust.support.title': '24/7 Support',
      'trust.support.desc': 'Our support team is ready to help anytime.',

      // ===== CALCULATOR =====`;
content = content.replace(enFeaturesOld, enFeaturesNew);

// EN nav
const enNavOld = `      'nav.register': 'Register',`;
const enNavNew = `      'nav.register': 'Register',
      'nav.products': 'Products',
      'nav.timeline': 'How It Works',
      'nav.trust': 'Trust',
      'nav.testimonial': 'Testimonials',`;
content = content.replace(enNavOld, enNavNew);

// EN footer
const enFooterOld = `      'footer.contact': 'Contact',
      'footer.rights': 'All rights reserved. Licensed & supervised by OJK.',`;
const enFooterNew = `      'footer.contact': 'Contact',
      'footer.products': 'Products',
      'footer.help': 'Help',
      'footer.rights': 'All rights reserved. Licensed & supervised by OJK.',`;
content = content.replace(enFooterOld, enFooterNew);

// EN faq
const enFaqOld = `      'faq.title': 'Frequently Asked Questions',`;
const enFaqNew = `      'faq.title': 'Frequently Asked Questions',
      'faq.subtitle': 'Frequently asked questions about SMART FUND',`;
content = content.replace(enFaqOld, enFaqNew);

// EN cta
const enCtaOld = `      'cta.btn': 'Register Now',

      // ===== FOOTER =====`;
const enCtaNew = `      'cta.btn': 'Register Now',

      // ===== FINAL CTA =====
      'finalCta.title': 'Ready to Manage Your Funding Needs?',
      'finalCta.desc': 'Register now and get online loans with fast and transparent processes',
      'finalCta.btn': 'Start Application',

      // ===== FOOTER =====`;
content = content.replace(enCtaOld, enCtaNew);

fs.writeFileSync('i18n.js', content, 'utf8');
console.log('i18n.js fully updated with all new translation keys');

// Verify
const verification = [];
['hero.headline', 'hero.subheadline', 'hero.primaryBtn', 'hero.secondaryBtn', 
 'features.f5.title', 'features.f5.desc', 'features.f6.title', 'features.f6.desc',
 'products.label', 'products.title', 'products.btn',
 'howitworks.label', 'howitworks.title', 'howitworks.desc',
 'timeline.step1.title', 'timeline.step5.desc',
 'trust.label', 'trust.title', 'trust.desc',
 'trust.transparency.title', 'trust.security.title',
 'finalCta.title', 'finalCta.btn',
 'nav.products', 'nav.timeline', 'nav.trust', 'nav.testimonial',
 'footer.products', 'footer.help',
 'faq.subtitle'].forEach(key => {
  // Check if key appears in all 3 language sections
  const count = (content.match(new RegExp("'" + key.replace(/\./g, '\\.') + "'", 'g')) || []).length;
  if (count < 3) {
    verification.push('MISSING: ' + key + ' (found ' + count + ' times, expected 3)');
  }
});

if (verification.length === 0) {
  console.log('All keys verified present in all 3 languages');
} else {
  console.log('Verification issues:');
  verification.forEach(v => console.log(v));
}
