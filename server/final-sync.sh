#!/usr/bin/env bash
set -e
[ -d src/seed ] || { echo "❌ Run from server/"; exit 1; }

cat > src/seed/seed.js <<'SEED_EOF'
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from '../models/Category.js';
import MenuItem from '../models/MenuItem.js';

dotenv.config();

const foodImg = (seed) =>
  `https://picsum.photos/seed/${encodeURIComponent(seed.replace(/\s+/g, '-'))}/400/400`;

const categories = [
  { name: 'Burgers',    slug: 'burgers',    icon: foodImg('burgers'),    sortOrder: 1 },
  { name: 'Bowls',      slug: 'bowls',      icon: foodImg('bowls'),      sortOrder: 2 },
  { name: 'Combos',     slug: 'combos',     icon: foodImg('combos'),     sortOrder: 3 },
  { name: 'Chips',      slug: 'chips',      icon: foodImg('chips'),      sortOrder: 4 },
  { name: 'Wings',      slug: 'wings',      icon: foodImg('wings'),      sortOrder: 5 },
  { name: 'Nuggets',    slug: 'nuggets',    icon: foodImg('nuggets'),    sortOrder: 6 },
  { name: 'Dessert',    slug: 'dessert',    icon: foodImg('dessert'),    sortOrder: 7 },
  { name: 'Subs',       slug: 'subs',       icon: foodImg('subs'),       sortOrder: 8 },
  { name: 'Chicken',    slug: 'chicken',    icon: foodImg('chicken'),    sortOrder: 9 },
  { name: 'Shakes',     slug: 'shakes',     icon: foodImg('shakes'),     sortOrder: 10 },
  { name: 'Snacks',     slug: 'snacks',     icon: foodImg('snacks'),     sortOrder: 11 },
  { name: 'Drinks',     slug: 'drinks',     icon: foodImg('drinks'),     sortOrder: 12 },
  { name: 'Dips',       slug: 'dips',       icon: foodImg('dips'),       sortOrder: 13 },
  { name: 'Extras',     slug: 'extras',     icon: foodImg('extras'),     sortOrder: 14 },
  { name: 'Drumsticks', slug: 'drumsticks', icon: foodImg('drumsticks'), sortOrder: 15 },
];

const itemSpecs = [
  // ─── BURGERS (6) ───
  { name: 'Single Beef Burger',    cat: 'burgers', price: 39000, popular: true, sortHint: 1 },
  { name: 'Single Chicken Burger', cat: 'burgers', price: 39000, sortHint: 2 },
  { name: 'Double Beef Burger',    cat: 'burgers', price: 59000, discount: 10000, sortHint: 3 },
  { name: 'Double Chicken Burger', cat: 'burgers', price: 59000, discount: 10000, sortHint: 4 },
  { name: 'Triple Beef Burger',    cat: 'burgers', price: 79000, discount: 15000, sortHint: 5 },
  { name: 'Triple Chicken Burger', cat: 'burgers', price: 79000, discount: 15000, sortHint: 6 },

  // ─── BOWLS (2) ───
  { name: 'SuperBowl XTRA', cat: 'bowls', price: 59000, sortHint: 1 },
  { name: 'SuperBowl',      cat: 'bowls', price: 39000, popular: true, sortHint: 2 },

  // ─── COMBOS (11) ───
  { name: 'SuperBowl + 1 Drumstick',     cat: 'combos', price: 54000, sortHint: 1 },
  { name: '4 Piece Wings + Chips',       cat: 'combos', price: 40000, sortHint: 2 },
  { name: 'SuperBowl + 4 Nuggets',       cat: 'combos', price: 59000, sortHint: 3 },
  { name: 'SuperBowl + 4 Piece Wings',   cat: 'combos', price: 61000, sortHint: 4 },
  { name: '1/4 Chicken + Regular Chips', cat: 'combos', price: 45000, sortHint: 5 },
  { name: '4 Nuggets + Chips',           cat: 'combos', price: 38000, sortHint: 6 },
  { name: 'TWIN COMBO',                  cat: 'combos', price: 159000, sortHint: 7 },
  { name: '2 Sausages + Chips',          cat: 'combos', price: 32000, sortHint: 8 },
  { name: 'GIGA Combo',                  cat: 'combos', price: 189000, sortHint: 9 },
  { name: 'Mega Combo',                  cat: 'combos', price: 99000, discount: 4000, sortHint: 10 },
  { name: '1/2 Chicken + Chips',         cat: 'combos', price: 65000, sortHint: 11 },

  // ─── CHIPS (3) ───
  { name: 'Special Chips', cat: 'chips', price: 25000, sortHint: 1 },
  { name: 'Spicy Chips',   cat: 'chips', price: 25000, sortHint: 2 },
  { name: 'Plain Chips',   cat: 'chips', price: 18000, popular: true, sortHint: 3 },

  // ─── WINGS (3) ───
  { name: '4 Piece Wings',  cat: 'wings', price: 25000, sortHint: 1 },
  { name: '8 Piece Wings',  cat: 'wings', price: 45000, sortHint: 2 },
  { name: '12 Piece Wings', cat: 'wings', price: 65000, sortHint: 3 },

  // ─── NUGGETS (3) ───
  { name: '4 Piece Nuggets',  cat: 'nuggets', price: 20000, sortHint: 1 },
  { name: '8 Piece Nuggets',  cat: 'nuggets', price: 35000, sortHint: 2 },
  { name: '12 Piece Nuggets', cat: 'nuggets', price: 50000, sortHint: 3 },

  // ─── DESSERT (6) ───
  { name: 'Strawberry Ice Cream',  cat: 'dessert', price: 10000, sortHint: 1 },
  { name: 'Iced Coffee + Brownie', cat: 'dessert', price: 39000, discount: 3900, sortHint: 2 },
  { name: 'Chocolate Ice Cream',   cat: 'dessert', price: 10000, sortHint: 3 },
  { name: 'Vanilla Ice Cream',     cat: 'dessert', price: 10000, sortHint: 4 },
  { name: 'Brownie Sundae',        cat: 'dessert', price: 26000, sortHint: 5 },
  { name: 'Chocolate Brownie',     cat: 'dessert', price: 15000, sortHint: 6 },

  // ─── SUBS (2) ───
  { name: '12-inch Chicken Sub', cat: 'subs', price: 59000, sortHint: 1 },
  { name: '6-inch Chicken Sub',  cat: 'subs', price: 39000, popular: true, sortHint: 2 },

  // ─── CHICKEN (3) ───
  { name: '1/2 Chicken',  cat: 'chicken', price: 54000, sortHint: 1 },
  { name: 'Full Chicken', cat: 'chicken', price: 105000, sortHint: 2 },
  { name: '1/4 Chicken',  cat: 'chicken', price: 27000, sortHint: 3 },

  // ─── SHAKES (6) — all small + 500ml variants ───
  { name: 'Strawberry Shake 300ml', cat: 'shakes', price: 29000, badge: 'small', sortHint: 1 },
  { name: 'Vanilla Shake 300ml',    cat: 'shakes', price: 29000, badge: 'small', sortHint: 2 },
  { name: 'Chocolate Shake 300ml',  cat: 'shakes', price: 29000, badge: 'small', sortHint: 3 },
  { name: 'Strawberry Shake 500ml', cat: 'shakes', price: 39000, sortHint: 4 },
  { name: 'Chocolate Shake 500ml',  cat: 'shakes', price: 39000, sortHint: 5 },
  { name: 'Vanilla Shake 500ml',    cat: 'shakes', price: 39000, sortHint: 6 },

  // ─── SNACKS (1) ───
  { name: 'Beef Sausage', cat: 'snacks', price: 7000, sortHint: 1 },

  // ─── DRINKS (12) ───
  { name: 'Passion Juice Large', cat: 'drinks', price: 20000, sortHint: 1 },
  { name: 'Passion Juice Small', cat: 'drinks', price: 12000, sortHint: 2 },
  { name: 'Sprite 1.25L',        cat: 'drinks', price: 25000, sortHint: 3 },
  { name: 'Coca Cola 1.25L',     cat: 'drinks', price: 25000, sortHint: 4 },
  { name: 'Fanta 1.25L',         cat: 'drinks', price: 25000, sortHint: 5 },
  { name: 'Water 500ml',         cat: 'drinks', price: 5000, sortHint: 6 },
  { name: 'Blackcurrant 1.25L',  cat: 'drinks', price: 25000, sortHint: 7 },
  { name: 'Sprite 350ml',        cat: 'drinks', price: 8000, sortHint: 8 },
  { name: 'Fanta 350ml',         cat: 'drinks', price: 8000, sortHint: 9 },
  { name: 'Blackcurrant 350ml',  cat: 'drinks', price: 8000, sortHint: 10 },
  { name: 'Coca Cola 350ml',     cat: 'drinks', price: 8000, sortHint: 11 },
  { name: 'Iced Coffee',         cat: 'drinks', price: 39000, discount: 4000, popular: true, sortHint: 12 },

  // ─── DIPS (6) ───
  { name: 'Dip Pack (All Dips)', cat: 'dips', price: 23000, discount: 6000, sortHint: 1 },
  { name: 'Sweet Chilli Dip',    cat: 'dips', price: 5000, sortHint: 2 },
  { name: 'BBQ Dip',             cat: 'dips', price: 5000, sortHint: 3 },
  { name: 'Ketchup Dip',         cat: 'dips', price: 3000, sortHint: 4 },
  { name: 'Special Dip',         cat: 'dips', price: 5000, sortHint: 5 },
  { name: 'Garlic Dip',          cat: 'dips', price: 5000, sortHint: 6 },

  // ─── EXTRAS (2) ───
  { name: 'Tomato Sauce Sachet', cat: 'extras', price: 1000, sortHint: 1 },
  { name: 'Slaw',                cat: 'extras', price: 6000, sortHint: 2 },

  // ─── DRUMSTICKS (3) — 4 piece first per Munch ───
  { name: '4 Piece Drumsticks', cat: 'drumsticks', price: 60000, discount: 6000, sortHint: 1 },
  { name: '2 Piece Drumsticks', cat: 'drumsticks', price: 30000, discount: 2000, sortHint: 2 },
  { name: '1 Piece Drumstick',  cat: 'drumsticks', price: 15000, popular: true, sortHint: 3 },
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
    image: foodImg(s.name),
    isPopular: !!s.popular,
    isLatest: !!s.latest,
    discount: s.discount || 0,
    isAvailable: true,
    sortHint: s.sortHint || 0,
  }));

  const inserted = await MenuItem.insertMany(items);
  console.log(`Inserted ${inserted.length} menu items\n`);

  console.log('Per-category counts:');
  for (const cat of catDocs) {
    const count = await MenuItem.countDocuments({ category: cat._id });
    console.log(`  ${cat.name.padEnd(12)} ${count}`);
  }

  await mongoose.disconnect();
  console.log('\n✅ Seed complete.');
}

run().catch(err => { console.error('❌ Seed failed:', err); process.exit(1); });
SEED_EOF

echo "--- seed file updated ($(wc -l < src/seed/seed.js) lines) ---"
echo "--- running seed ---"
npm run seed 2>&1 | tail -30
