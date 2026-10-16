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

// Prices in cents (Ksh × 100)
const itemSpecs = [

  // ─── BURGERS ───
  { name: 'Single Beef Burger',    cat: 'burgers', price: 39000, popular: true },
  { name: 'Single Chicken Burger', cat: 'burgers', price: 39000 },
  { name: 'Double Beef Burger',    cat: 'burgers', price: 59000, discount: 10000, badge: 'Ksh100 OFF' },
  { name: 'Double Chicken Burger', cat: 'burgers', price: 59000, discount: 10000, badge: 'Ksh100 OFF' },
  { name: 'Triple Beef Burger',    cat: 'burgers', price: 79000, discount: 15000, badge: 'Ksh150 OFF' },
  { name: 'Triple Chicken Burger', cat: 'burgers', price: 79000, discount: 15000, badge: 'Ksh150 OFF' },

  // ─── BOWLS ───
  { name: 'SuperBowl',      cat: 'bowls', price: 39000, popular: true },
  { name: 'SuperBowl XTRA', cat: 'bowls', price: 59000, badge: 'XTRA' },
  { name: 'SuperBowl + 1 Drumstick', cat: 'bowls', price: 54000, latest: true },

  // ─── COMBOS (from Munch's /category/13-combos page) ───
  { name: 'SuperBowl + 1 Drumstick',       cat: 'combos', price: 54000 },
  { name: '4 Piece Wings + Chips',         cat: 'combos', price: 40000 },
  { name: 'SuperBowl + 4 Nuggets',         cat: 'combos', price: 59000 },
  { name: 'SuperBowl + 4 Piece Wings',     cat: 'combos', price: 61000 },
  { name: '1/4 Chicken + Regular Chips',   cat: 'combos', price: 45000 },
  { name: '4 Nuggets + Chips',             cat: 'combos', price: 38000 },
  { name: 'TWIN COMBO',                    cat: 'combos', price: 159000 },
  { name: '2 Sausages + Chips',            cat: 'combos', price: 32000 },
  { name: 'GIGA Combo',                    cat: 'combos', price: 189000 },
  { name: 'Mega Combo',                    cat: 'combos', price: 99000, discount: 4000, badge: 'Ksh40 OFF' },
  { name: '1/2 Chicken + Chips',           cat: 'combos', price: 65000 },

  // ─── CHIPS ───
  { name: 'Plain Chips',    cat: 'chips', price: 18000, popular: true },
  { name: 'Regular Chips',  cat: 'chips', price: 20000 },
  { name: 'Large Chips',    cat: 'chips', price: 25000 },

  // ─── WINGS ───
  { name: '4 Piece Wings + Chips', cat: 'wings', price: 45000, popular: true },
  { name: '8 Piece Wings',         cat: 'wings', price: 65000 },
  { name: '12 Piece Wings',        cat: 'wings', price: 95000 },

  // ─── NUGGETS ───
  { name: '4 Nuggets + Chips', cat: 'nuggets', price: 35000 },
  { name: '6 Nuggets + Chips', cat: 'nuggets', price: 45000 },
  { name: '10 Nuggets + Chips', cat: 'nuggets', price: 65000 },

  // ─── SUBS ───
  { name: '6-inch Chicken Sub',  cat: 'subs', price: 39000, popular: true },
  { name: '12-inch Chicken Sub', cat: 'subs', price: 59000 },

  // ─── CHICKEN ───
  { name: '1/4 Chicken',                  cat: 'chicken', price: 35000 },
  { name: '1/4 Chicken + Regular Chips',  cat: 'chicken', price: 45000 },
  { name: '1/2 Chicken',                  cat: 'chicken', price: 55000 },

  // ─── DRUMSTICKS ───
  { name: '1 Piece Drumstick',  cat: 'drumsticks', price: 15000, popular: true },
  { name: '2 Piece Drumsticks', cat: 'drumsticks', price: 30000, discount: 2000, badge: 'Ksh20 OFF' },
  { name: '4 Piece Drumsticks', cat: 'drumsticks', price: 60000, discount: 6000, badge: 'Ksh60 OFF' },

  // ─── DESSERT ───
  { name: 'Strawberry Ice Cream', cat: 'dessert', price: 20000 },
  { name: 'Brownie Sundae',       cat: 'dessert', price: 35000, popular: true },

  // ─── DRINKS ───
  { name: 'Passion Juice Small', cat: 'drinks', price: 10000 },
  { name: 'Passion Juice Large', cat: 'drinks', price: 15000 },
  { name: 'Iced Coffee',         cat: 'drinks', price: 25000, popular: true },

  // ─── DIPS ───
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
    image: foodImg(s.name),
    isPopular: !!s.popular,
    isLatest: !!s.latest,
    discount: s.discount || 0,
    isAvailable: true,
  }));

  const inserted = await MenuItem.insertMany(items);
  console.log(`Inserted ${inserted.length} menu items`);

  const counts = await MenuItem.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  console.log('\nPer-category counts:');
  for (const row of counts) {
    const cat = catDocs.find(c => c._id.equals(row._id));
    console.log(`  ${cat.name.padEnd(12)} ${row.count}`);
  }

  await mongoose.disconnect();
  console.log('\n✅ Seed complete.');
}

run().catch(err => { console.error('❌ Seed failed:', err); process.exit(1); });
SEED_EOF

echo "--- file written ($(wc -l < src/seed/seed.js) lines) ---"
grep -c "GIGA Combo" src/seed/seed.js
echo "--- running seed ---"
npm run seed 2>&1 | tail -30
