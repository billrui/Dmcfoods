#!/usr/bin/env bash
set -e
[ -d src/seed ] || { echo "❌ Run from server/"; exit 1; }

cat > src/seed/seed.js <<'EOF'
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from '../models/Category.js';
import MenuItem from '../models/MenuItem.js';

dotenv.config();

// Food-specific images via Unsplash Source (stable query URLs)
const foodImg = (query) =>
  `https://source.unsplash.com/400x400/?${encodeURIComponent(query)},food`;

// Fallback if Unsplash source is slow: use picsum with food-related seeds
const fallbackImg = (seed) =>
  `https://picsum.photos/seed/${encodeURIComponent(seed)}/400/400`;

const categories = [
  { name: 'Burgers',     slug: 'burgers',     icon: foodImg('burger'),    sortOrder: 1 },
  { name: 'Bowls',       slug: 'bowls',       icon: foodImg('rice bowl'), sortOrder: 2 },
  { name: 'Combos',      slug: 'combos',      icon: foodImg('fast food combo'), sortOrder: 3 },
  { name: 'Chips',       slug: 'chips',       icon: foodImg('fries'),     sortOrder: 4 },
  { name: 'Wings',       slug: 'wings',       icon: foodImg('chicken wings'), sortOrder: 5 },
  { name: 'Nuggets',     slug: 'nuggets',     icon: foodImg('chicken nuggets'), sortOrder: 6 },
  { name: 'Dessert',     slug: 'dessert',     icon: foodImg('ice cream'), sortOrder: 7 },
  { name: 'Subs',        slug: 'subs',        icon: foodImg('sandwich sub'), sortOrder: 8 },
  { name: 'Chicken',     slug: 'chicken',     icon: foodImg('fried chicken'), sortOrder: 9 },
  { name: 'Shakes',      slug: 'shakes',      icon: foodImg('milkshake'), sortOrder: 10 },
  { name: 'Snacks',      slug: 'snacks',      icon: foodImg('snack'),     sortOrder: 11 },
  { name: 'Drinks',      slug: 'drinks',      icon: foodImg('juice drink'), sortOrder: 12 },
  { name: 'Dips',        slug: 'dips',        icon: foodImg('sauce dip'), sortOrder: 13 },
  { name: 'Extras',      slug: 'extras',      icon: foodImg('side dish'), sortOrder: 14 },
  { name: 'Drumsticks',  slug: 'drumsticks',  icon: foodImg('chicken drumstick'), sortOrder: 15 },
];

const itemSpecs = [
  // BURGERS — full menu matching Munch screenshot
  { name: 'Single Beef Burger',    cat: 'burgers', price: 39000, discount: 0,     popular: true },
  { name: 'Single Chicken Burger', cat: 'burgers', price: 39000, discount: 0,     latest: true },
  { name: 'Double Beef Burger',    cat: 'burgers', price: 59000, discount: 10000 },
  { name: 'Double Chicken Burger', cat: 'burgers', price: 59000, discount: 10000 },
  { name: 'Triple Beef Burger',    cat: 'burgers', price: 79000, discount: 15000 },
  { name: 'Triple Chicken Burger', cat: 'burgers', price: 79000, discount: 15000 },

  // BOWLS
  { name: 'SuperBowl',             cat: 'bowls',   price: 39000, popular: true },
  { name: 'SuperBowl XTRA',        cat: 'bowls',   price: 59000, popular: true },
  { name: 'SuperBowl + 4 Nuggets', cat: 'bowls',   price: 54000, latest: true },
  { name: 'SuperBowl + 4 Piece Wings', cat: 'bowls', price: 64000, latest: true },

  // CHIPS
  { name: 'Plain Chips',           cat: 'chips',   price: 18000, popular: true, latest: true },
  { name: 'Regular Chips',         cat: 'chips',   price: 20000 },
  { name: 'Large Chips',           cat: 'chips',   price: 25000 },

  // WINGS
  { name: '4 Piece Wings + Chips', cat: 'wings',   price: 45000, popular: true },
  { name: '8 Piece Wings',         cat: 'wings',   price: 65000 },
  { name: '12 Piece Wings',        cat: 'wings',   price: 95000 },

  // NUGGETS
  { name: '4 Nuggets + Chips',     cat: 'nuggets', price: 35000, popular: true },
  { name: '6 Nuggets + Chips',     cat: 'nuggets', price: 45000 },
  { name: '10 Nuggets + Chips',    cat: 'nuggets', price: 65000 },

  // SUBS
  { name: '6-inch Chicken Sub',    cat: 'subs',    price: 39000, popular: true },
  { name: '12-inch Chicken Sub',   cat: 'subs',    price: 59000 },

  // CHICKEN
  { name: '1/4 Chicken',           cat: 'chicken', price: 35000 },
  { name: '1/4 Chicken + Regular Chips', cat: 'chicken', price: 45000 },
  { name: '1/2 Chicken',           cat: 'chicken', price: 55000 },

  // DRUMSTICKS
  { name: '1 Piece Drumstick',     cat: 'drumsticks', price: 15000, popular: true },
  { name: '2 Piece Drumsticks',    cat: 'drumsticks', price: 30000, discount: 2000, latest: true },
  { name: '4 Piece Drumsticks',    cat: 'drumsticks', price: 60000, discount: 6000, latest: true },

  // COMBOS
  { name: '2 Sausages + Chips',    cat: 'combos',  price: 35000, popular: true },
  { name: 'Mega Combo',            cat: 'combos',  price: 85000, popular: true },

  // DESSERT
  { name: 'Strawberry Ice Cream',  cat: 'dessert', price: 20000 },
  { name: 'Brownie Sundae',        cat: 'dessert', price: 35000, popular: true },

  // DRINKS
  { name: 'Passion Juice Small',   cat: 'drinks',  price: 10000 },
  { name: 'Passion Juice Large',   cat: 'drinks',  price: 15000 },
  { name: 'Iced Coffee',           cat: 'drinks',  price: 25000, popular: true },

  // DIPS
  { name: 'Sweet Chilli Dip',      cat: 'dips',    price: 5000 },
  { name: 'Dip Pack (All Dips)',   cat: 'dips',    price: 15000, popular: true },
];

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected. Clearing…');
  await Category.deleteMany({});
  await MenuItem.deleteMany({});

  const catDocs = await Category.insertMany(categories);
  const bySlug = Object.fromEntries(catDocs.map(c => [c.slug, c._id]));

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

  await MenuItem.insertMany(items);
  console.log(`Seeded ${catDocs.length} categories and ${items.length} items.`);
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
EOF

echo "✅ Updated seed. Now run: npm run seed"
