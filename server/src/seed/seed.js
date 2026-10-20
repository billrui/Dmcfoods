import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from '../models/Category.js';
import MenuItem from '../models/MenuItem.js';

dotenv.config();

const IMG = {
  'Single Beef Burger':    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80',
  'Single Chicken Burger': 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=600&q=80',
  'Double Beef Burger':    'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=600&q=80',
  'Double Chicken Burger': 'https://images.unsplash.com/photo-1615297928064-24977384d0da?w=600&q=80',
  'Triple Beef Burger':    'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600&q=80',
  'Triple Chicken Burger': 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=600&q=80',
  'SuperBowl':      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80',
  'SuperBowl XTRA': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80',
  'SuperBowl + 1 Drumstick':     'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&q=80',
  '4 Piece Wings + Chips':       'https://images.unsplash.com/photo-1608039755401-742074f0548d?w=600&q=80',
  'SuperBowl + 4 Nuggets':       'https://images.unsplash.com/photo-1562967914-608f82629710?w=600&q=80',
  'SuperBowl + 4 Piece Wings':   'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=600&q=80',
  '1/4 Chicken + Regular Chips': 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=600&q=80',
  '4 Nuggets + Chips':           'https://images.unsplash.com/photo-1562967916-eb82221dfb92?w=600&q=80',
  'TWIN COMBO':                  'https://images.unsplash.com/photo-1575932444877-5106bee2a599?w=600&q=80',
  '2 Sausages + Chips':          'https://images.unsplash.com/photo-1585325701165-351af916e581?w=600&q=80',
  'GIGA Combo':                  'https://images.unsplash.com/photo-1608039755401-742074f0548d?w=600&q=80',
  'Mega Combo':                  'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&q=80',
  '1/2 Chicken + Chips':         'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=600&q=80',
  'Special Chips': 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=600&q=80',
  'Spicy Chips':   'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&q=80',
  'Plain Chips':   'https://images.unsplash.com/photo-1518013431117-eb1465fa5752?w=600&q=80',
  '4 Piece Wings':  'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=600&q=80',
  '8 Piece Wings':  'https://images.unsplash.com/photo-1608039755401-742074f0548d?w=600&q=80',
  '12 Piece Wings': 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=600&q=80',
  '4 Piece Nuggets':  'https://images.unsplash.com/photo-1562967916-eb82221dfb92?w=600&q=80',
  '8 Piece Nuggets':  'https://images.unsplash.com/photo-1619881586944-36b1c5c3bb80?w=600&q=80',
  '12 Piece Nuggets': 'https://images.unsplash.com/photo-1562967914-608f82629710?w=600&q=80',
  'Strawberry Ice Cream':  'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=600&q=80',
  'Iced Coffee + Brownie': 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&q=80',
  'Chocolate Ice Cream':   'https://images.unsplash.com/photo-1567206563064-6f60f40a2b57?w=600&q=80',
  'Vanilla Ice Cream':     'https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=600&q=80',
  'Brownie Sundae':        'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=600&q=80',
  'Chocolate Brownie':     'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&q=80',
  '12-inch Chicken Sub': 'https://images.unsplash.com/photo-1539252554453-80ab65ce3586?w=600&q=80',
  '6-inch Chicken Sub':  'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=600&q=80',
  '1/2 Chicken':  'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=600&q=80',
  'Full Chicken': 'https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?w=600&q=80',
  '1/4 Chicken':  'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=600&q=80',
  'Strawberry Shake 300ml': 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&q=80',
  'Vanilla Shake 300ml':    'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&q=80',
  'Chocolate Shake 300ml':  'https://images.unsplash.com/photo-1577805947697-89e18249d767?w=600&q=80',
  'Strawberry Shake 500ml': 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&q=80',
  'Chocolate Shake 500ml':  'https://images.unsplash.com/photo-1577805947697-89e18249d767?w=600&q=80',
  'Vanilla Shake 500ml':    'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&q=80',
  'Beef Sausage': 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=600&q=80',
  'Passion Juice Large': 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=600&q=80',
  'Passion Juice Small': 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600&q=80',
  'Sprite 1.25L':        'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=600&q=80',
  'Coca Cola 1.25L':     'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=600&q=80',
  'Fanta 1.25L':         'https://images.unsplash.com/photo-1624517452488-04869289c4ca?w=600&q=80',
  'Water 500ml':         'https://images.unsplash.com/photo-1616118132534-381148898bb4?w=600&q=80',
  'Blackcurrant 1.25L':  'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=600&q=80',
  'Sprite 350ml':        'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=600&q=80',
  'Fanta 350ml':         'https://images.unsplash.com/photo-1624517452488-04869289c4ca?w=600&q=80',
  'Blackcurrant 350ml':  'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=600&q=80',
  'Coca Cola 350ml':     'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=600&q=80',
  'Iced Coffee':         'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600&q=80',
  'Dip Pack (All Dips)': 'https://images.unsplash.com/photo-1607013251379-e6eecfffe234?w=600&q=80',
  'Sweet Chilli Dip':    'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600&q=80',
  'BBQ Dip':             'https://images.unsplash.com/photo-1613514785940-daed07799d9b?w=600&q=80',
  'Ketchup Dip':         'https://images.unsplash.com/photo-1607013251379-e6eecfffe234?w=600&q=80',
  'Special Dip':         'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600&q=80',
  'Garlic Dip':          'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600&q=80',
  'Tomato Sauce Sachet': 'https://images.unsplash.com/photo-1607013251379-e6eecfffe234?w=600&q=80',
  'Slaw':                'https://images.unsplash.com/photo-1625938145312-c96c68e5b7c5?w=600&q=80',
  '4 Piece Drumsticks': 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=600&q=80',
  '2 Piece Drumsticks': 'https://images.unsplash.com/photo-1562967914-608f82629710?w=600&q=80',
  '1 Piece Drumstick':  'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=600&q=80',

  'cat:burgers':    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&q=80',
  'cat:bowls':      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&q=80',
  'cat:combos':     'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=200&q=80',
  'cat:chips':      'https://images.unsplash.com/photo-1518013431117-eb1465fa5752?w=200&q=80',
  'cat:wings':      'https://images.unsplash.com/photo-1608039755401-742074f0548d?w=200&q=80',
  'cat:nuggets':    'https://images.unsplash.com/photo-1562967916-eb82221dfb92?w=200&q=80',
  'cat:dessert':    'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=200&q=80',
  'cat:subs':       'https://images.unsplash.com/photo-1539252554453-80ab65ce3586?w=200&q=80',
  'cat:chicken':    'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=200&q=80',
  'cat:shakes':     'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=200&q=80',
  'cat:snacks':     'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=200&q=80',
  'cat:drinks':     'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=200&q=80',
  'cat:dips':       'https://images.unsplash.com/photo-1607013251379-e6eecfffe234?w=200&q=80',
  'cat:extras':     'https://images.unsplash.com/photo-1607013251379-e6eecfffe234?w=200&q=80',
  'cat:drumsticks': 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=200&q=80',
};

const imgFor = (name, catKey = null) => {
  if (catKey && IMG[catKey]) return IMG[catKey];
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
  { name: 'Single Beef Burger',    cat: 'burgers', price: 39000, popular: true },
  { name: 'Single Chicken Burger', cat: 'burgers', price: 39000 },
  { name: 'Double Beef Burger',    cat: 'burgers', price: 59000, discount: 10000 },
  { name: 'Double Chicken Burger', cat: 'burgers', price: 59000, discount: 10000 },
  { name: 'Triple Beef Burger',    cat: 'burgers', price: 79000, discount: 15000 },
  { name: 'Triple Chicken Burger', cat: 'burgers', price: 79000, discount: 15000 },
  { name: 'SuperBowl XTRA', cat: 'bowls', price: 59000 },
  { name: 'SuperBowl',      cat: 'bowls', price: 39000, popular: true },
  { name: 'SuperBowl + 1 Drumstick',     cat: 'combos', price: 54000 },
  { name: '4 Piece Wings + Chips',       cat: 'combos', price: 40000 },
  { name: 'SuperBowl + 4 Nuggets',       cat: 'combos', price: 59000 },
  { name: 'SuperBowl + 4 Piece Wings',   cat: 'combos', price: 61000 },
  { name: '1/4 Chicken + Regular Chips', cat: 'combos', price: 45000 },
  { name: '4 Nuggets + Chips',           cat: 'combos', price: 38000 },
  { name: 'TWIN COMBO',                  cat: 'combos', price: 159000 },
  { name: '2 Sausages + Chips',          cat: 'combos', price: 32000 },
  { name: 'GIGA Combo',                  cat: 'combos', price: 189000 },
  { name: 'Mega Combo',                  cat: 'combos', price: 99000, discount: 4000 },
  { name: '1/2 Chicken + Chips',         cat: 'combos', price: 65000 },
  { name: 'Special Chips', cat: 'chips', price: 25000 },
  { name: 'Spicy Chips',   cat: 'chips', price: 25000 },
  { name: 'Plain Chips',   cat: 'chips', price: 18000, popular: true },
  { name: '4 Piece Wings',  cat: 'wings', price: 25000 },
  { name: '8 Piece Wings',  cat: 'wings', price: 45000 },
  { name: '12 Piece Wings', cat: 'wings', price: 65000 },
  { name: '4 Piece Nuggets',  cat: 'nuggets', price: 20000 },
  { name: '8 Piece Nuggets',  cat: 'nuggets', price: 35000 },
  { name: '12 Piece Nuggets', cat: 'nuggets', price: 50000 },
  { name: 'Strawberry Ice Cream',  cat: 'dessert', price: 10000 },
  { name: 'Iced Coffee + Brownie', cat: 'dessert', price: 39000, discount: 3900 },
  { name: 'Chocolate Ice Cream',   cat: 'dessert', price: 10000 },
  { name: 'Vanilla Ice Cream',     cat: 'dessert', price: 10000 },
  { name: 'Brownie Sundae',        cat: 'dessert', price: 26000 },
  { name: 'Chocolate Brownie',     cat: 'dessert', price: 15000 },
  { name: '12-inch Chicken Sub', cat: 'subs', price: 59000 },
  { name: '6-inch Chicken Sub',  cat: 'subs', price: 39000, popular: true },
  { name: '1/2 Chicken',  cat: 'chicken', price: 54000 },
  { name: 'Full Chicken', cat: 'chicken', price: 105000 },
  { name: '1/4 Chicken',  cat: 'chicken', price: 27000 },
  { name: 'Strawberry Shake 300ml', cat: 'shakes', price: 29000 },
  { name: 'Vanilla Shake 300ml',    cat: 'shakes', price: 29000 },
  { name: 'Chocolate Shake 300ml',  cat: 'shakes', price: 29000 },
  { name: 'Strawberry Shake 500ml', cat: 'shakes', price: 39000 },
  { name: 'Chocolate Shake 500ml',  cat: 'shakes', price: 39000 },
  { name: 'Vanilla Shake 500ml',    cat: 'shakes', price: 39000 },
  { name: 'Beef Sausage', cat: 'snacks', price: 7000 },
  { name: 'Passion Juice Large', cat: 'drinks', price: 20000 },
  { name: 'Passion Juice Small', cat: 'drinks', price: 12000 },
  { name: 'Sprite 1.25L',        cat: 'drinks', price: 25000 },
  { name: 'Coca Cola 1.25L',     cat: 'drinks', price: 25000 },
  { name: 'Fanta 1.25L',         cat: 'drinks', price: 25000 },
  { name: 'Water 500ml',         cat: 'drinks', price: 5000 },
  { name: 'Blackcurrant 1.25L',  cat: 'drinks', price: 25000 },
  { name: 'Sprite 350ml',        cat: 'drinks', price: 8000 },
  { name: 'Fanta 350ml',         cat: 'drinks', price: 8000 },
  { name: 'Blackcurrant 350ml',  cat: 'drinks', price: 8000 },
  { name: 'Coca Cola 350ml',     cat: 'drinks', price: 8000 },
  { name: 'Iced Coffee',         cat: 'drinks', price: 39000, discount: 4000, popular: true },
  { name: 'Dip Pack (All Dips)', cat: 'dips', price: 23000, discount: 6000 },
  { name: 'Sweet Chilli Dip',    cat: 'dips', price: 5000 },
  { name: 'BBQ Dip',             cat: 'dips', price: 5000 },
  { name: 'Ketchup Dip',         cat: 'dips', price: 3000 },
  { name: 'Special Dip',         cat: 'dips', price: 5000 },
  { name: 'Garlic Dip',          cat: 'dips', price: 5000 },
  { name: 'Tomato Sauce Sachet', cat: 'extras', price: 1000 },
  { name: 'Slaw',                cat: 'extras', price: 6000 },
  { name: '4 Piece Drumsticks', cat: 'drumsticks', price: 60000, discount: 6000 },
  { name: '2 Piece Drumsticks', cat: 'drumsticks', price: 30000, discount: 2000 },
  { name: '1 Piece Drumstick',  cat: 'drumsticks', price: 15000, popular: true },
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

  const items = itemSpecs.map(s => ({
    name: s.name,
    category: bySlug[s.cat],
    price: s.price,
    image: imgFor(s.name),
    isPopular: !!s.popular,
    isLatest: !!s.latest,
    discount: s.discount || 0,
    isAvailable: true,
  }));

  await MenuItem.insertMany(items);
  console.log(`Inserted ${catDocs.length} categories and ${items.length} items`);

  await mongoose.disconnect();
  console.log('✅ Seed complete.');
}

run().catch(err => { console.error('❌ Seed failed:', err); process.exit(1); });
