#!/usr/bin/env node
/*
 * Standalone menu generator for The Training Table planner.
 * Mirrors the planning logic embedded in artefacts/trainingtable.html
 * (SG_PUBLIC_HOLIDAYS, MOE_SCHOOL_HOLIDAYS, BREAKFASTS, MEALS, RESTAURANTS,
 * generateWeek, buildEmailBody) so it can run headlessly (no DOM) from a
 * scheduled agent. If the planner's data or logic changes in
 * artefacts/trainingtable.html, update this file to match.
 *
 * Usage: node scripts/generate-weekly-menu.js
 * Prints {"subject": "...", "body": "..."} as JSON on stdout.
 */

const SG_PUBLIC_HOLIDAYS = {
  '2026-01-01':"New Year's Day",'2026-02-17':'Chinese New Year','2026-02-18':'Chinese New Year',
  '2026-03-21':'Hari Raya Puasa','2026-04-03':'Good Friday','2026-05-01':'Labour Day',
  '2026-05-27':'Hari Raya Haji','2026-05-31':'Vesak Day','2026-06-01':'Vesak Day (observed)',
  '2026-08-09':'National Day','2026-08-10':'National Day (observed)',
  '2026-11-08':'Deepavali','2026-11-09':'Deepavali (observed)','2026-12-25':'Christmas Day',
  // 2027 (gazetted by MOM 18 Jun 2026)
  '2027-01-01':"New Year's Day",'2027-02-06':'Chinese New Year','2027-02-07':'Chinese New Year',
  '2027-02-08':'Chinese New Year (observed)','2027-03-10':'Hari Raya Puasa','2027-03-26':'Good Friday',
  '2027-05-01':'Labour Day','2027-05-17':'Hari Raya Haji','2027-05-20':'Vesak Day',
  '2027-08-09':'National Day','2027-10-28':'Deepavali','2027-12-25':'Christmas Day'
};
const MOE_SCHOOL_HOLIDAYS = [
  {start:'2026-03-14', end:'2026-03-22', label:'March school holidays'},
  {start:'2026-05-30', end:'2026-06-28', label:'June school holidays'},
  {start:'2026-09-05', end:'2026-09-13', label:'September school holidays'},
  {start:'2026-11-21', end:'2026-12-31', label:'Year-end school holidays'},
  // 2027 (released by MOE 14 Jul 2026)
  {start:'2027-03-13', end:'2027-03-21', label:'March school holidays'},
  {start:'2027-05-29', end:'2027-06-27', label:'June school holidays'},
  {start:'2027-09-04', end:'2027-09-12', label:'September school holidays'},
  {start:'2027-11-20', end:'2027-12-31', label:'Year-end school holidays'}
];

function toKey(d){ return d.toISOString().slice(0,10); }
function publicHolidayName(d){ return SG_PUBLIC_HOLIDAYS[toKey(d)] || null; }
function schoolHolidayLabel(d){
  const k = toKey(d);
  const block = MOE_SCHOOL_HOLIDAYS.find(b => k >= b.start && k <= b.end);
  return block ? block.label : null;
}
function isWeekend(d){ return d.getDay() === 0 || d.getDay() === 6; }

function getUpcomingMonday(base){
  const d = new Date(base);
  const day = d.getDay();
  let diff;
  if(day === 0) diff = 1;
  else if(day === 1) diff = 0;
  else diff = 8 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0,0,0,0);
  return d;
}

const DAY_NAMES = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const weekStart = getUpcomingMonday(new Date());
const WEEK = DAY_NAMES.map((name,i) => {
  const d = new Date(weekStart);
  d.setDate(d.getDate()+i);
  const ph = publicHolidayName(d);
  const sch = schoolHolidayLabel(d);
  return {
    key:name, date:d,
    dateLabel: d.toLocaleDateString('en-GB',{day:'2-digit',month:'short'}),
    isPH: !!ph, phName: ph,
    isSchoolHoliday: !!sch || isWeekend(d) || !!ph, schoolLabel: sch,
    isWeekend: isWeekend(d)
  };
});

const BREAKFASTS = {
  quick: [
    {id:'bq1',name:'Scrambled eggs on wholemeal toast, milk',protein:18,cal:380,ing:['Eggs','Wholemeal bread','Milk']},
    {id:'bq2',name:'Greek yoghurt with granola & berries',protein:16,cal:320,ing:['Greek yoghurt','Granola','Mixed berries']},
    {id:'bq3',name:'Peanut butter wholemeal toast, banana, Milo',protein:14,cal:400,ing:['Peanut butter','Wholemeal bread','Banana','Milo']},
    {id:'bq4',name:'Overnight oats with chia & milk',protein:15,cal:350,ing:['Rolled oats','Chia seeds','Milk','Honey']},
    {id:'bq5',name:'Ham & cheese wholemeal sandwich, milk',protein:20,cal:420,ing:['Ham','Cheese slice','Wholemeal bread','Milk']},
    {id:'bq6',name:'Soft-boiled eggs, kaya toast, Milo',protein:16,cal:380,ing:['Eggs','Kaya toast','Milo']},
    {id:'bq7',name:'Protein overnight oats with peanut butter',protein:18,cal:380,ing:['Rolled oats','Milk','Peanut butter','Protein powder (optional)']}
  ],
  leisurely: [
    {id:'bl1',name:'Scrambled eggs, turkey bacon & wholemeal toast',protein:26,cal:480,ing:['Eggs','Turkey bacon','Wholemeal bread','Butter']},
    {id:'bl2',name:'Pancakes with Greek yoghurt, banana & peanut butter',protein:20,cal:520,ing:['Pancake mix','Greek yoghurt','Banana','Peanut butter']},
    {id:'bl3',name:'Prata with dhal & egg',protein:18,cal:500,ing:['Prata','Dhal curry','Egg']},
    {id:'bl4',name:'Chicken congee with century egg',protein:22,cal:420,ing:['Rice','Shredded chicken','Century egg','Spring onion']},
    {id:'bl5',name:'French toast with scrambled eggs & sausage',protein:24,cal:520,ing:['Bread','Eggs','Chicken sausage','Milk']},
    {id:'bl6',name:'Mee siam with egg',protein:16,cal:460,ing:['Rice vermicelli','Egg','Tofu puff','Gravy']},
    {id:'bl7',name:'Mini nasi lemak with egg & ikan bilis',protein:18,cal:480,ing:['Coconut rice','Egg','Ikan bilis','Sambal']},
    {id:'bl8',name:'Smoothie bowl with yoghurt, granola & fruit',protein:24,cal:420,ing:['Greek yoghurt','Frozen fruit','Granola','Protein powder (optional)']}
  ]
};

const MEALS = [
 {id:'l1',slot:'lunch',name:'Grilled chicken chop, brown rice & broccoli',cuisine:'Western',src:'chicken',protein:38,cal:620,ing:['Chicken thigh','Brown rice','Broccoli','Olive oil']},
 {id:'l2',slot:'lunch',name:'Teriyaki salmon donburi',cuisine:'Asian',src:'fish',protein:34,cal:650,ing:['Salmon fillet','Japanese rice','Edamame','Teriyaki sauce']},
 {id:'l3',slot:'lunch',name:'Beef & broccoli stir-fry with rice',cuisine:'Asian',src:'beef',protein:36,cal:680,ing:['Beef strips','Broccoli','Garlic','Jasmine rice']},
 {id:'l4',slot:'lunch',name:'Tofu & egg fried rice with edamame',cuisine:'Asian',src:'plant',protein:26,cal:560,ing:['Firm tofu','Eggs','Edamame','Rice']},
 {id:'l5',slot:'lunch',name:'Chicken briyani with raita',cuisine:'Asian',src:'chicken',protein:40,cal:720,ing:['Chicken leg','Basmati rice','Yoghurt','Briyani spices']},
 {id:'l6',slot:'lunch',name:'Tuna & chickpea salad wrap',cuisine:'Western',src:'fish',protein:32,cal:540,ing:['Canned tuna','Chickpeas','Wholemeal wrap','Greek yoghurt']},
 {id:'l7',slot:'lunch',name:'Nasi lemak with grilled chicken & egg',cuisine:'Asian',src:'chicken',protein:35,cal:700,ing:['Chicken thigh','Coconut rice','Egg','Ikan bilis','Cucumber']},
 {id:'l8',slot:'lunch',name:'Turkey & cheese wholemeal sandwich, side salad',cuisine:'Western',src:'chicken',protein:30,cal:520,ing:['Turkey breast slices','Wholemeal bread','Cheese','Mixed greens']},
 {id:'l9',slot:'lunch',name:'Prawn & vegetable fried noodles',cuisine:'Asian',src:'fish',protein:28,cal:610,ing:['Prawns','Noodles','Egg','Mixed vegetables']},
 {id:'l10',slot:'lunch',name:'Dhal curry with paneer & brown rice',cuisine:'Asian',src:'plant',protein:24,cal:580,ing:['Red lentils','Paneer','Brown rice','Curry spices']},
 {id:'l11',slot:'lunch',name:'Grilled batang fish with sweet potato mash',cuisine:'Asian',src:'fish',protein:34,cal:590,ing:['Batang fish','Sweet potato','Butter','Lemon']},
 {id:'l12',slot:'lunch',name:'Beef meatball pasta, side salad',cuisine:'Western',src:'beef',protein:33,cal:660,ing:['Beef mince','Pasta','Tomato sauce','Mixed greens']},
 {id:'l13',slot:'lunch',name:'Char siew chicken rice with bok choy',cuisine:'Asian',src:'chicken',protein:37,cal:690,ing:['Chicken char siew','Rice','Bok choy','Char siew sauce']},
 {id:'l14',slot:'lunch',name:'Egg fried rice with satay chicken skewers',cuisine:'Asian',src:'chicken',protein:39,cal:700,ing:['Chicken skewers','Eggs','Rice','Peanut sauce']},
 {id:'l15',slot:'lunch',name:'Quinoa power bowl, grilled chicken & avocado',cuisine:'Western',src:'chicken',protein:36,cal:630,ing:['Chicken breast','Quinoa','Avocado','Cherry tomatoes']},
 {id:'l16',slot:'lunch',name:'Fish ball noodle soup, extra fish cake',cuisine:'Asian',src:'fish',protein:26,cal:520,ing:['Fish balls','Fish cake','Noodles','Bok choy']},
 {id:'l17',slot:'lunch',name:'Butter chicken with basmati rice',cuisine:'Asian',src:'chicken',protein:35,cal:710,ing:['Chicken thigh','Basmati rice','Tomato cream sauce','Naan']},
 {id:'l18',slot:'lunch',name:'Tempeh & vegetable stir-fry with rice',cuisine:'Asian',src:'plant',protein:22,cal:540,ing:['Tempeh','Mixed vegetables','Soy sauce','Rice']},
 {id:'d1',slot:'dinner',name:'Baked salmon, roasted vegetables & rice',cuisine:'Western',src:'fish',protein:36,cal:640,ing:['Salmon fillet','Pumpkin','Carrot','Rice']},
 {id:'d2',slot:'dinner',name:'Chicken curry with rice & cucumber salad',cuisine:'Asian',src:'chicken',protein:38,cal:690,ing:['Chicken leg','Potato','Coconut milk','Rice']},
 {id:'d3',slot:'dinner',name:'Beef steak, mashed potato & greens',cuisine:'Western',src:'beef',protein:40,cal:720,ing:['Beef sirloin','Potato','Butter','Green beans']},
 {id:'d4',slot:'dinner',name:'Mapo tofu with steamed rice',cuisine:'Asian',src:'plant',protein:28,cal:560,ing:['Firm tofu','Minced pork/beef','Doubanjiang','Rice']},
 {id:'d5',slot:'dinner',name:'Lemongrass chicken, rice & papaya salad',cuisine:'Asian',src:'chicken',protein:37,cal:650,ing:['Chicken thigh','Lemongrass','Green papaya','Rice']},
 {id:'d6',slot:'dinner',name:'Spaghetti bolognese, side salad',cuisine:'Western',src:'beef',protein:34,cal:680,ing:['Beef mince','Spaghetti','Tomato sauce','Mixed greens']},
 {id:'d7',slot:'dinner',name:'Steamed garoupa, ginger soy & rice',cuisine:'Asian',src:'fish',protein:33,cal:560,ing:['Garoupa fillet','Ginger','Soy sauce','Rice']},
 {id:'d8',slot:'dinner',name:'Hainanese chicken rice, extra breast meat',cuisine:'Asian',src:'chicken',protein:40,cal:700,ing:['Whole chicken','Rice','Chicken broth','Chilli sauce']},
 {id:'d9',slot:'dinner',name:'Prawn tom yum with rice',cuisine:'Asian',src:'fish',protein:30,cal:540,ing:['Prawns','Tom yum paste','Mushrooms','Rice']},
 {id:'d10',slot:'dinner',name:'Black pepper beef, vegetables & rice',cuisine:'Asian',src:'beef',protein:38,cal:660,ing:['Beef strips','Capsicum','Black pepper sauce','Rice']},
 {id:'d11',slot:'dinner',name:'Egg & tofu claypot with rice',cuisine:'Asian',src:'plant',protein:26,cal:550,ing:['Eggs','Silken tofu','Mushrooms','Rice']},
 {id:'d12',slot:'dinner',name:'Roast chicken thigh, sweet potato & broccoli',cuisine:'Western',src:'chicken',protein:39,cal:660,ing:['Chicken thigh','Sweet potato','Broccoli','Olive oil']},
 {id:'d13',slot:'dinner',name:'Salmon teriyaki bowl with edamame',cuisine:'Asian',src:'fish',protein:35,cal:620,ing:['Salmon fillet','Edamame','Rice','Teriyaki sauce']},
 {id:'d14',slot:'dinner',name:'Beef rendang, brown rice & greens',cuisine:'Asian',src:'beef',protein:36,cal:700,ing:['Beef chunks','Rendang paste','Brown rice','Kai lan']},
 {id:'d15',slot:'dinner',name:'Grilled chicken satay, peanut sauce & rice',cuisine:'Asian',src:'chicken',protein:37,cal:680,ing:['Chicken thigh','Peanut sauce','Rice','Cucumber']},
 {id:'d16',slot:'dinner',name:'Fish curry, brown rice & okra',cuisine:'Asian',src:'fish',protein:32,cal:610,ing:['Fish fillet','Curry paste','Okra','Brown rice']},
 {id:'d17',slot:'dinner',name:'Honey soy pork chop, vegetables & rice',cuisine:'Western',src:'pork',protein:35,cal:650,ing:['Pork chop','Honey soy glaze','Mixed vegetables','Rice']},
 {id:'d18',slot:'dinner',name:'Chickpea & spinach dhal, paneer & rice',cuisine:'Asian',src:'plant',protein:25,cal:560,ing:['Chickpeas','Spinach','Paneer','Rice']}
];

const RESTAURANTS = [
  {name:"Astons Specialities",note:"Western grills - chicken chop, fish, steak sets, generous portions",meal:['lunch','dinner'],protein:35,cal:700},
  {name:"Song Fa Bak Kut Teh",note:"Pork rib soup, protein-rich broth, casual family seating",meal:['lunch','dinner'],protein:30,cal:600},
  {name:"The Manhattan FISH MARKET",note:"Fish & seafood platters, kid-friendly set meals",meal:['lunch','dinner'],protein:32,cal:650},
  {name:"Soup Restaurant",note:"Samsui ginger chicken & home-style Chinese dishes, good for sharing",meal:['lunch','dinner'],protein:34,cal:640},
  {name:"PastaMania",note:"Pasta with grilled chicken or meatball add-ons, easy for younger kids",meal:['lunch','dinner'],protein:26,cal:680},
  {name:"Hawker centre economy rice / Western stall",note:"Pick-your-own chicken/fish/tofu portions, budget-friendly, very adjustable",meal:['lunch','dinner'],protein:30,cal:600},
  {name:"Al-Azhar / Islamic Restaurant",note:"Halal Indian-Muslim briyani & mutton/chicken curries, family style",meal:['lunch','dinner'],protein:36,cal:720},
  {name:"Swensen's",note:"Grilled chicken & fish mains with a treat at the end, easy for a family table",meal:['lunch','dinner'],protein:32,cal:660},
  {name:"Wildseed Cafe / garden brunch cafes",note:"Protein-rich brunch sets - eggs & bacon, grilled chicken salads",meal:['breakfast','lunch'],protein:28,cal:580},
  {name:"Han's Cafe",note:"Affordable Western family cafe - chicken chop, fish & chips",meal:['lunch','dinner'],protein:28,cal:640}
];

let state = {
  allowedSources: new Set(['chicken','fish','beef','pork','plant']),
  allowedCuisines: new Set(['Asian','Western']),
  plan: {},
  restoChoice: {}
};

function mealById(id){ return MEALS.find(m => m.id === id); }
function pool(slot){
  return MEALS.filter(m => m.slot === slot &&
    state.allowedSources.has(m.src) && state.allowedCuisines.has(m.cuisine));
}
function pickMeal(slot, excludeId, excludeSrc, usedThisWeek){
  let candidates = pool(slot).filter(m => m.id !== excludeId);
  if(candidates.length === 0) candidates = pool(slot);
  if(candidates.length === 0) return null;
  let fresh = candidates.filter(m => !usedThisWeek.has(m.id));
  let varied = fresh.filter(m => m.src !== excludeSrc);
  let finalPool = varied.length ? varied : (fresh.length ? fresh : candidates);
  return finalPool[Math.floor(Math.random()*finalPool.length)];
}
function restoOptions(mealSlot){ return RESTAURANTS.filter(r => r.meal.includes(mealSlot)); }

function generateWeek(){
  const used = new Set();
  const newPlan = {};
  const newResto = {};
  WEEK.forEach(day => {
    const breakfastPool = day.isSchoolHoliday ? BREAKFASTS.leisurely : BREAKFASTS.quick;
    const breakfast = breakfastPool[Math.floor(Math.random()*breakfastPool.length)];

    if(day.isPH){
      const lOpts = restoOptions('lunch'), dOpts = restoOptions('dinner');
      newResto[day.key] = {
        lunch: Math.floor(Math.random()*lOpts.length),
        dinner: Math.floor(Math.random()*dOpts.length)
      };
      newPlan[day.key] = { breakfast: breakfast.id, lunch:null, dinner:null };
    } else {
      const lunch = pickMeal('lunch', null, null, used);
      const lunchSrc = lunch ? lunch.src : null;
      const dinner = pickMeal('dinner', null, lunchSrc, used);
      if(lunch) used.add(lunch.id);
      if(dinner) used.add(dinner.id);
      newPlan[day.key] = { breakfast: breakfast.id, lunch: lunch?lunch.id:null, dinner: dinner?dinner.id:null };
    }
  });
  state.plan = newPlan;
  state.restoChoice = newResto;
}

function breakfastById(id){
  return BREAKFASTS.quick.find(b=>b.id===id) || BREAKFASTS.leisurely.find(b=>b.id===id);
}

function buildEmailBody(){
  let lines = [];
  lines.push(`FAMILY MENU - WEEK OF ${WEEK[0].dateLabel} to ${WEEK[6].dateLabel}`);
  lines.push('');
  WEEK.forEach(day => {
    let header = `${day.key} ${day.dateLabel}`;
    if(day.isPH) header += `  [PUBLIC HOLIDAY - ${day.phName}]`;
    else if(day.schoolLabel) header += `  [${day.schoolLabel}]`;
    lines.push(header);
    const p = state.plan[day.key];
    const b = breakfastById(p.breakfast);
    lines.push(`  Breakfast: ${b ? b.name : '-'}`);
    if(day.isPH){
      const lOpts = restoOptions('lunch'), dOpts = restoOptions('dinner');
      const l = lOpts[state.restoChoice[day.key]?.lunch], d = dOpts[state.restoChoice[day.key]?.dinner];
      lines.push(`  Lunch (dining out): ${l ? l.name+' - '+l.note : '-'}`);
      lines.push(`  Dinner (dining out): ${d ? d.name+' - '+d.note : '-'}`);
    } else {
      const l = mealById(p.lunch), d = mealById(p.dinner);
      lines.push(`  Lunch: ${l ? l.name : '-'}`);
      lines.push(`  Dinner: ${d ? d.name : '-'}`);
    }
    lines.push('');
  });
  lines.push('- Sent from The Training Table meal planner');
  return lines.join('\n');
}

generateWeek();
const subject = `Family Menu - Week of ${WEEK[0].dateLabel}`;
const body = buildEmailBody();
process.stdout.write(JSON.stringify({ subject, body, to: ['li.hui.tan@hotmail.com', 'youdateh@gmail.com'] }, null, 2));
