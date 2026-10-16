#!/usr/bin/env bash
set -e
[ -d src/seed ] || { echo "❌ Run from server/"; exit 1; }

cat > src/seed/seed.js <<'SEED_EOF'
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from '../models/Category.js';
import MenuItem from '../models/MenuItem.js';

dotenv.config();

// ─────────────────────────────────────────────────────────────
// IMAGE MAP
// Paste real image URLs from Munch (or your own CDN) here.
// If a URL is missing, we fall back to picsum so nothing breaks.
// ─────────────────────────────────────────────────────────────
const IMG = {
  // Categories
  'cat:burgers':    'https://picsum.photos/seed/burgers/400/400',
  'cat:bowls':      'https://picsum.photos/seed/bowls/400/400',
  'cat:combos':     'https://picsum.photos/seed/combos/400/400',
  'cat:chips':      'https://picsum.photos/seed/chips/400/400',
  'cat:wings':      'https://picsum.photos/seed/wings/400/400',
  'cat:nuggets':    'https://picsum.photos/seed/nuggets/400/400',
  'cat:dessert':    'https://picsum.photos/seed/dessert/400/400',
  'cat:subs':       'https://picsum.photos/seed/subs/400/400',
  'cat:chicken':    'https://picsum.photos/seed/chicken/400/400',
  'cat:shakes':     'https://picsum.photos/seed/shakes/400/400',
  'cat:snacks':     'https://picsum.photos/seed/snacks/400/400',
  'cat:drinks':     'https://picsum.photos/seed/drinks/400/400',
  'cat:dips':       'https://picsum.photos/seed/dips/400/400',
  'cat:extras':     'https://picsum.photos/seed/extras/400/400',
  'cat:drumsticks': 'https://picsum.photos/seed/drumsticks/400/400',

  // Add real item images here. Key = exact product name.
  // 'SuperBowl':            'https://order.munch.co.ke/images/superbowl.jpg',
  // 'SuperBowl XTRA':       'https://order.munch.co.ke/images/superbowl-xtra.jpg',
  // 'Single Beef Burger':   'https://order.munch.co.ke/images/single-beef.jpg',
  // ... etc
};

const imgFor = (name, key = null) => {
  if (key && IMG[key]) return IMG[key];
  if (IMG[name]) return IMG[name];
  return `https://picsum.photos/seed/${encodeURIComponent(name.replace(/\s+/g,'-'))}/400/400`;
};

const categories = [
  { name: 'Burgers',    slug: 'burgers',    icon: imgFor('Burgers',    'cat:burgers'),    sortOrder: 1 },
  { name: 'Bowls',      slug: 'bowls',      icon: imgFor('Bowls',      'cat:bowls'),      sortOrder: 2 },
  { name: 'Combos',     slug: 'combos',     icon: imgFor('Combos',     'cat:combos'),     sortOrder: 3 },
  { name: 'Chips',      slug: 'chips',      icon: imgFor('Chips',      'cat:chips'),      sortOrder: 4 },
  { name: 'Wings',      slug: 'wings',      icon: imgFor('Wings',      'cat:wings'),      sortOrder: 5 },
  { name: 'Nuggets',    slug: 'nuggets',    icon: imgFor('Nuggets',    'cat:nuggets'),    sortOrder: 6 },
  { name: 'Dessert',    slug: 'dessert',    icon: imgFor('Dessert',    'cat:dessert'),    sortOrder: 7 },
  { name: 'Subs',       slug: 'subs',       icon: imgFor('Subs',       'cat:subs'),       sortOrder: 8 },
  { name: 'Chicken',    slug: 'chicken',    icon: imgFor('Chicken',    'cat:chicken'),    sortOrder: 9 },
  { name: 'Shakes',     slug: 'shakes',     icon: imgFor('Shakes',     'cat:shakes'),     sortOrder: 10 },
  { name: 'Snacks',     slug: 'snacks',     icon: imgFor('Snacks',     'cat:snacks'),     sortOrder: 11 },
  { name: 'Drinks',     slug: 'drinks',     icon: imgFor('Drinks',     'cat:drinks'),     sortOrder: 12 },
  { name: 'Dips',       slug: 'dips',       icon: imgFor('Dips',       'cat:dips'),       sortOrder: 13 },
  { name: 'Extras',     slug: 'extras',     icon: imgFor('Extras',     'cat:extras'),     sortOrder: 14 },
  { name: 'Drumsticks', slug: 'drumsticks', icon: imgFor('Drumsticks', 'cat:drumsticks'), sortOrder: 15 },
];

const itemSpecs = [
  // BURGERS — sorted by price ascending to match Munch
  { name: 'Single Beef Burger',    cat: 'burgers', price: 39000, popular: true },
  { name: 'Single Chicken Burger', cat: 'burgers', price: 39000 },
  { name: 'Double Beef Burger',    cat: 'burgers', price: 59000, discount: 10000, badge: 'Ksh100 OFF' },
  { name: 'Double Chicken Burger', cat: 'burgers', price: 59000, discount: 10000, badge: 'Ksh100 OFF' },
  { name: 'Triple Beef Burger',    cat: 'burgers', price: 79000, discount: 15000, badge: 'Ksh150 OFF' },
  { name: 'Triple Chicken Burger', cat: 'burgers', price: 79000, discount: 15000, badge: 'Ksh150 OFF' },

  // BOWLS — Munch shows 2, in this exact order (XTRA first, then SuperBowl)
  { name: 'SuperBowl XTRA', cat: 'bowls', price: 59000, badge: 'XTRA', sortHint: 1 },
  { name: 'SuperBowl',      cat: 'bowls', price: 39000, popular: true, sortHint: 2 },

  // COMBOS — matching Munch's /category/13-combos
  { name: 'SuperBowl + 1 Drumstick',     cat: 'combos', price: 54000, sortHint: 1 },
  { name: '4 Piece Wings + Chips',       cat: 'combos', price: 40000, sortHint: 2 },
  { name: 'SuperBowl + 4 Nuggets',       cat: 'combos', price: 59000, sortHint: 3 },
  { name: 'SuperBowl + 4 Piece Wings',   cat: 'combos', price: 61000, sortHint: 4 },
  { name: '1/4 Chicken + Regular Chips', cat: 'combos', price: 45000, sortHint: 5 },
  { name: '4 Nuggets + Chips',           cat: 'combos', price: 38000, sortHint: 6 },
  { name: 'TWIN COMBO',                  cat: 'combos', price: 159000, sortHint: 7 },
  { name: '2 Sausages + Chips',          cat: 'combos', price: 32000, sortHint: 8 },
  { name: 'GIGA Combo',                  cat: 'combos', price: 189000, sortHint: 9 },
  { name: 'Mega Combo',                  cat: 'combos', price: 99000, discount: 4000, badge: 'Ksh40 OFF', sortHint: 10 },
  { name: '1/2 Chicken + Chips',         cat: 'combos', price: 65000, sortHint: 11 },

  // CHIPS
  { name: 'Plain Chips',   cat: 'chips', price: 18000, popular: true },
  { name: 'Regular Chips', cat: 'chips', price: 20000 },
  { name: 'Large Chips',   cat: 'chips', price: 25000 },

  // WINGS
  { name: '4 Piece Wings + Chips', cat: 'wings', price: 45000, popular: true },
  { name: '8 Piece Wings',         cat: 'wings', price: 65000 },
  { name: '12 Piece Wings',        cat: 'wings', price: 95000 },

  // NUGGETS
  { name: '4 Nuggets + Chips',  cat: 'nuggets', price: 35000 },
  { name: '6 Nuggets + Chips',  cat: 'nuggets', price: 45000 },
  { name: '10 Nuggets + Chips', cat: 'nuggets', price: 65000 },

  // SUBS
  { name: '6-inch Chicken Sub',  cat: 'subs', price: 39000, popular: true },
  { name: '12-inch Chicken Sub', cat: 'subs', price: 59000 },

  // CHICKEN
  { name: '1/4 Chicken',                 cat: 'chicken', price: 35000 },
  { name: '1/4 Chicken + Regular Chips', cat: 'chicken', price: 45000 },
  { name: '1/2 Chicken',                 cat: 'chicken', price: 55000 },

  // DRUMSTICKS
  { name: '1 Piece Drumstick',  cat: 'drumsticks', price: 15000, popular: true },
  { name: '2 Piece Drumsticks', cat: 'drumsticks', price: 30000, discount: 2000, badge: 'Ksh20 OFF' },
  { name: '4 Piece Drumsticks', cat: 'drumsticks', price: 60000, discount: 6000, badge: 'Ksh60 OFF' },

  // DESSERT
  { name: 'Strawberry Ice Cream', cat: 'dessert', price: 20000 },
  { name: 'Brownie Sundae',       cat: 'dessert', price: 35000, popular: true },

  // DRINKS
  { name: 'Passion Juice Small', cat: 'drinks', price: 10000 },
  { name: 'Passion Juice Large', cat: 'drinks', price: 15000 },
  { name: 'Iced Coffee',         cat: 'drinks', price: 25000, popular: true },

  // DIPS
  { name: 'Sweet Chilli Dip',    cat: 'dips', price: 5000 },
  { name: 'Dip Pack (All Dips)', cat: 'dips', price: 15000, popular: true },
];

async function run() {
  console.log('→ Connecting to', process.env.MONGO_URI);
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected');

  const c = await Category.deleteMany({});
  const m = await MenuItem.deleteMany({});
  console.log(`Cleared: ${c.deletedCount} categories, ${m.deletedCount} items`);

  const catDocs = await Category.insertMany(categories);
  const bySlug = Object.fromEntries(catDocs.map(c => [c.slug, c._id]));
  console.log(`Inserted ${catDocs.length} categories`);

  const items = itemSpecs.map(s => ({
    name: s.name,
    category: bySlug[s.cat],
    price: s.price,
    image: imgFor(s.name),
    isPopular: !!s.popular,
    isLatest: !!s.latest,
    discount: s.discount || 0,
    isAvailable: true,
    sortHint: s.sortHint || 0,
  }));

  const inserted = await MenuItem.insertMany(items);
  console.log(`Inserted ${inserted.length} menu items`);

  const burgerCount = await MenuItem.countDocuments({ category: bySlug.burgers });
  const bowlCount   = await MenuItem.countDocuments({ category: bySlug.bowls });
  const comboCount  = await MenuItem.countDocuments({ category: bySlug.combos });
  console.log(`\nBurgers: ${burgerCount}   Bowls: ${bowlCount}   Combos: ${comboCount}`);

  await mongoose.disconnect();
  console.log('\n✅ Seed complete.');
}

run().catch(err => { console.error('❌ Seed failed:', err); process.exit(1); });
SEED_EOF

echo "--- file updated ($(wc -l < src/seed/seed.js) lines) ---"
grep -c "GIGA Combo" src/seed/seed.js
echo "--- running seed ---"
npm run seed 2>&1 | tail -30
