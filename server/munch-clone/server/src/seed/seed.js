import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from '../models/Category.js';
import MenuItem from '../models/MenuItem.js';

dotenv.config();

const img = (seed) => `https://picsum.photos/seed/${encodeURIComponent(seed)}/400/400`;

const categories = [
  { name: 'Burgers',  slug: 'burgers',  icon: img('burger'),  sortOrder: 1 },
  { name: 'Bowls',    slug: 'bowls',    icon: img('bowl'),    sortOrder: 2 },
  { name: 'Combos',   slug: 'combos',   icon: img('combo'),   sortOrder: 3 },
  { name: 'Chips',    slug: 'chips',    icon: img('fries'),   sortOrder: 4 },
  { name: 'Wings',    slug: 'wings',    icon: img('wings'),   sortOrder: 5 },
  { name: 'Nuggets',  slug: 'nuggets',  icon: img('nuggets'), sortOrder: 6 },
  { name: 'Dessert',  slug: 'dessert',  icon: img('dessert'), sortOrder: 7 },
  { name: 'Subs',     slug: 'subs',     icon: img('sub'),     sortOrder: 8 },
  { name: 'Chicken',  slug: 'chicken',  icon: img('chicken'), sortOrder: 9 },
  { name: 'Shakes',   slug: 'shakes',   icon: img('shake'),   sortOrder: 10 },
  { name: 'Snacks',   slug: 'snacks',   icon: img('snack'),   sortOrder: 11 },
  { name: 'Drinks',   slug: 'drinks',   icon: img('drink'),   sortOrder: 12 },
  { name: 'Dips',     slug: 'dips',     icon: img('dip'),     sortOrder: 13 },
  { name: 'Extras',   slug: 'extras',   icon: img('extra'),   sortOrder: 14 },
  { name: 'Drumsticks', slug: 'drumsticks', icon: img('drumstick'), sortOrder: 15 },
];

const itemSpecs = [
  { name: 'SuperBowl',              cat: 'bowls',    price: 39000, popular: true },
  { name: 'Plain Chips',            cat: 'chips',    price: 18000, popular: true, latest: true },
  { name: 'SuperBowl XTRA',         cat: 'bowls',    price: 59000, popular: true },
  { name: 'Single Beef Burger',     cat: 'burgers',  price: 39000, popular: true },
  { name: '6-inch Chicken Sub',     cat: 'subs',     price: 39000, popular: true },
  { name: '8 Piece Wings',          cat: 'wings',    price: 65000 },
  { name: '4 Piece Wings + Chips',  cat: 'wings',    price: 45000, popular: true },
  { name: '4 Nuggets + Chips',      cat: 'nuggets',  price: 35000, popular: true },
  { name: 'SuperBowl + 4 Nuggets',  cat: 'combos',   price: 54000, latest: true },
  { name: 'SuperBowl + 4 Piece Wings', cat: 'combos', price: 64000, latest: true },
  { name: '4 Piece Drumsticks',     cat: 'drumsticks', price: 60000, discount: 6000, latest: true },
  { name: '2 Piece Drumsticks',     cat: 'drumsticks', price: 30000, discount: 2000, latest: true },
  { name: '1 Piece Drumstick',      cat: 'drumsticks', price: 15000, popular: true },
  { name: '1/2 Chicken',            cat: 'chicken',  price: 55000 },
  { name: '1/4 Chicken + Regular Chips', cat: 'chicken', price: 45000 },
  { name: 'Sweet Chilli Dip',       cat: 'dips',     price: 5000 },
  { name: 'Dip Pack (All Dips)',    cat: 'dips',     price: 15000, popular: true },
  { name: 'Strawberry Ice Cream',   cat: 'dessert',  price: 20000 },
  { name: 'Passion Juice Small',    cat: 'drinks',   price: 10000 },
  { name: 'Passion Juice Large',    cat: 'drinks',   price: 15000 },
  { name: '12 Piece Wings',         cat: 'wings',    price: 95000 },
  { name: '2 Sausages + Chips',     cat: 'combos',   price: 35000, popular: true },
  { name: 'Mega Combo',             cat: 'combos',   price: 85000, popular: true },
  { name: 'Iced Coffee',            cat: 'drinks',   price: 25000, popular: true },
  { name: 'Brownie Sundae',         cat: 'dessert',  price: 35000, popular: true },
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
    image: img(s.name),
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
