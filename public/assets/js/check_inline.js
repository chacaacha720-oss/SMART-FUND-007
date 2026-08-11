const fs = require('fs');
const c = fs.readFileSync('i18n.js', 'utf8');

const keys = [
  'hero.headline', 'hero.subheadline', 'hero.primaryBtn', 'hero.secondaryBtn',
  'features.f5.title', 'features.f5.desc', 'features.f6.title', 'features.f6.desc',
  'products.label', 'products.title', 'products.multiline.title', 'products.multiline.desc',
  'products.business.title', 'products.business.desc', 'products.education.title',
  'products.education.desc', 'products.renovation.title', 'products.renovation.desc',
  'products.personal.title', 'products.personal.desc', 'products.btn',
  'howitworks.label', 'howitworks.title', 'howitworks.desc',
  'timeline.step1.title', 'timeline.step1.desc', 'timeline.step2.title',
  'timeline.step2.desc', 'timeline.step3.title', 'timeline.step3.desc',
  'timeline.step4.title', 'timeline.step4.desc', 'timeline.step5.title', 'timeline.step5.desc',
  'trust.label', 'trust.title', 'trust.desc',
  'trust.transparency.title', 'trust.transparency.desc',
  'trust.security.title', 'trust.security.desc',
  'trust.noHidden.title', 'trust.noHidden.desc',
  'trust.support.title', 'trust.support.desc',
  'finalCta.title', 'finalCta.desc', 'finalCta.btn',
  'nav.products', 'nav.timeline', 'nav.trust', 'nav.testimonial',
  'footer.products', 'footer.help', 'faq.subtitle'
];

let missing = [];
keys.forEach(key => {
  const escaped = key.replace(/\./g, '\\.');
  const regex = new RegExp("'" + escaped + "'", 'g');
  const count = (c.match(regex) || []).length;
  if (count < 3) {
    missing.push(key + ' (found ' + count + '/3)');
  }
});

if (missing.length === 0) {
  console.log('All inline keys present in i18n.js!');
} else {
  console.log('Missing in i18n.js:');
  missing.forEach(m => console.log('  ' + m));
}
