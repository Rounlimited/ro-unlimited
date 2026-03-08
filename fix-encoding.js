const fs = require('fs');

// Fix Hero.tsx
const heroPath = 'src/components/sections/Hero.tsx';
let hero = fs.readFileSync(heroPath, 'utf8');

// Replace all variations of garbled em dashes
// The pattern is: optional space + ?" or ?\u201C or ?\u201D + optional space
// Should become: space + em dash + space (or just em dash in comments)
hero = hero.replace(/ ?\?\u201C ?/g, ' \u2014 ');
hero = hero.replace(/ ?\?\u201D ?/g, ' \u2014 ');
hero = hero.replace(/ ?\?" ?/g, ' \u2014 ');

// Clean up double spaces
hero = hero.replace(/  +/g, ' ');
// Fix " — " inside comments to be clean
hero = hero.replace(/\/\* (.+?) \*\//g, (match) => match.replace(/ +/g, ' '));

fs.writeFileSync(heroPath, hero, 'utf8');
console.log('Hero.tsx fixed');

// Fix site-editor page.tsx
const sePath = 'src/app/admin/site-editor/page.tsx';
let se = fs.readFileSync(sePath, 'utf8');
se = se.replace(/ ?\?\u201C ?/g, ' \u2014 ');
se = se.replace(/ ?\?\u201D ?/g, ' \u2014 ');
se = se.replace(/ ?\?" ?/g, ' \u2014 ');
se = se.replace(/  +/g, ' ');
fs.writeFileSync(sePath, se, 'utf8');
console.log('site-editor/page.tsx fixed');

// Verify
const check = fs.readFileSync(heroPath, 'utf8');
const idx = check.indexOf('One company');
console.log('Verify:', check.substring(idx, idx + 50));
const remaining = (check.match(/\?"/g) || []).length;
console.log('Remaining ?" in Hero:', remaining);
