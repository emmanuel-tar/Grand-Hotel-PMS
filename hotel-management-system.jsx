import { useState, useEffect, useRef, useCallback } from "react";

// ═══════════════════════════════════════════════════════════
//  GRAND IMPERIAL — COMPLETE HOTEL MANAGEMENT SYSTEM v5.0
//  Login · RBAC · Rooms · Restaurant POS · Inventory · Reports
//  + Online Booking · Gift Shop · Events · Shuttle · Staff · Audit
//  + Feedback · Loyalty · WhatsApp · Payments · Notifications
//  + Maintenance · Channel Manager · Tasks
// ═══════════════════════════════════════════════════════════

// ─── DESIGN TOKENS (Dark Mode) ─────────────────────────────
const T_DARK = {
  bg:"#06080c", s1:"#0d1117", s2:"#131b24", s3:"#1a2433",
  bdr:"#1e2d3d", bdrG:"#2a2000",
  gold:"#D4AF37", goldL:"#f0cc5a", goldD:"#7a6420",
  txt:"#d8cdb8", muted:"#4a5568", mutedL:"#718096",
  green:"#22c55e", red:"#ef4444", orange:"#f59e0b",
  blue:"#3b82f6", purple:"#8b5cf6", pink:"#ec4899",
  teal:"#14b8a6", cyan:"#06b6d4",
};

// ─── DESIGN TOKENS (Light Mode) ────────────────────────────
const T_LIGHT = {
  bg:"#f5f5f5", s1:"#ffffff", s2:"#fafafa", s3:"#f0f0f0",
  bdr:"#e0e0e0", bdrG:"#d4e0d4",
  gold:"#B8962E", goldL:"#D4AF37", goldD:"#8B7355",
  txt:"#1a1a1a", muted:"#666666", mutedL:"#888888",
  green:"#16a34a", red:"#dc2626", orange:"#ea580c",
  blue:"#2563eb", purple:"#7c3aed", pink:"#db2777",
  teal:"#0d9488", cyan:"#0891b2",
};

// Theme context
const ThemeContext = React.createContext({ theme: 'dark', T: T_DARK, toggleTheme: () => {} });

// ─── DEFAULT THEME ─────────────────────────────────────────
let currentTheme = 'dark';
const getTheme = () => currentTheme === 'dark' ? T_DARK : T_LIGHT;
const toggleTheme = () => { currentTheme = currentTheme === 'dark' ? 'light' : 'dark'; };

// ─── DESIGN TOKENS (Current) ────────────────────────────────
const T = getTheme();

// ─── ROLE DEFINITIONS ──────────────────────────────────────
const ROLES = {
  admin:        { label:"Administrator",    color:T.red,    icon:"👑", level:5,
                  pages:["dashboard","rooms","restaurant","inventory","housekeeping","bookings","guests","reports","settings","giftshop","events","shuttle","staff","audit","feedback","loyalty","maintenance","tasks"] },
  manager:      { label:"Manager",          color:T.orange, icon:"⭐", level:4,
                  pages:["dashboard","rooms","restaurant","inventory","housekeeping","bookings","guests","reports","settings","giftshop","events","shuttle","staff","audit","feedback","loyalty","maintenance","tasks"] },
  frontdesk:    { label:"Front Desk",       color:T.blue,   icon:"🖥️", level:3,
                  pages:["dashboard","rooms","bookings","guests","giftshop","events","shuttle"] },
  restaurant:   { label:"Restaurant Staff", color:T.green,  icon:"🍽️", level:2,
                  pages:["restaurant","inventory"] },
  housekeeping: { label:"Housekeeping",     color:T.teal,   icon:"🧹", level:1,
                  pages:["housekeeping"] },
};

// ─── DEFAULT USERS ──────────────────────────────────────────
const SEED_USERS = [
  { id:1, username:"admin",        password:"Admin@123",    name:"Alex Morgan",        role:"admin",        email:"admin@grandimperial.com",        phone:"",active:true, createdAt:"2024-01-01" },
  { id:2, username:"manager",      password:"Mgr@123",      name:"Maria Santos",       role:"manager",      email:"manager@grandimperial.com",      phone:"",active:true, createdAt:"2024-01-01" },
  { id:3, username:"frontdesk",    password:"Desk@123",     name:"James Okonkwo",      role:"frontdesk",    email:"frontdesk@grandimperial.com",    phone:"",active:true, createdAt:"2024-01-01" },
  { id:4, username:"restaurant",   password:"Food@123",     name:"Chef Adaeze Nwosu",  role:"restaurant",   email:"restaurant@grandimperial.com",   phone:"",active:true, createdAt:"2024-01-01" },
  { id:5, username:"housekeeping", password:"House@123",    name:"Fatima Al-Hassan",   role:"housekeeping", email:"housekeeping@grandimperial.com", phone:"",active:true, createdAt:"2024-01-01" },
];

// ─── HOTEL SETTINGS ─────────────────────────────────────────
const SEED_SETTINGS = {
  hotelName:"Grand Imperial Hotel", tagline:"Where Excellence Meets Comfort",
  address:"12 Victoria Island Boulevard", city:"Lagos", country:"Nigeria",
  phone:"+234 801 234 5678", email:"info@grandimperial.com",
  website:"www.grandimperial.com", stars:5,
  checkInTime:"14:00", checkOutTime:"11:00",
  taxRate:7.5, serviceCharge:10, currency:"$", currencyCode:"USD",
  totalRooms:50, logo:"⬥",
  wifi:"Grand_Imperial_5G", wifiPass:"GrandGuest2025",
  emergencyContact:"+234 801 999 0000",
  breakfastPrice:18, lateCheckoutFee:50, earlyCheckinFee:30,
};

// ─── ROOM TYPES ─────────────────────────────────────────────
const ROOM_TYPES = {
  standard:  { label:"Standard",   price:75,  color:T.blue,   beds:"1 Queen Bed",   maxGuests:2, sqft:280, amenities:["WiFi","TV","AC","Safe"] },
  deluxe:    { label:"Deluxe",     price:120, color:T.purple, beds:"1 King Bed",    maxGuests:2, sqft:380, amenities:["WiFi","TV","AC","Safe","Minibar","Bathtub"] },
  suite:     { label:"Suite",      price:200, color:T.gold,   beds:"King + Living", maxGuests:4, sqft:600, amenities:["WiFi","TV","AC","Safe","Minibar","Jacuzzi","Lounge"] },
  executive: { label:"Executive",  price:160, color:T.green,  beds:"1 King Bed",    maxGuests:2, sqft:450, amenities:["WiFi","TV","AC","Safe","Minibar","Work Desk","City View"] },
};

const ROOM_STATUS = {
  available:   { label:"Available",    color:T.green,     bg:"#052010" },
  occupied:    { label:"Occupied",     color:T.red,       bg:"#200505" },
  reserved:    { label:"Reserved",     color:T.orange,    bg:"#201005" },
  maintenance: { label:"Maintenance",  color:"#6b7280",   bg:"#111111" },
  checkout:    { label:"Checkout",     color:"#f97316",   bg:"#201508" },
};

// ─── INVENTORY DATA ─────────────────────────────────────────
const INV_CATS = {
  fb:       { label:"Food & Beverage",     icon:"🍱", color:T.red    },
  beverage: { label:"Beverages",           icon:"🥤", color:T.cyan   },
  linen:    { label:"Linen & Bedding",     icon:"🛏️", color:T.blue   },
  amenity:  { label:"Room Amenities",      icon:"🧴", color:T.purple },
  cleaning: { label:"Cleaning Supplies",   icon:"🧹", color:T.teal   },
  minibar:  { label:"Mini Bar Stock",      icon:"🥃", color:"#9b59b6"},
  maint:    { label:"Maintenance",         icon:"🔧", color:T.orange },
};

const SEED_INVENTORY = [
  {id:1, name:"All-Purpose Flour",         cat:"fb",       unit:"kg",      qty:80,  min:20, cost:1.2,  supplier:"Lagos Fresh Co."},
  {id:2, name:"Eggs (tray/30)",            cat:"fb",       unit:"tray",    qty:25,  min:8,  cost:5.5,  supplier:"Lagos Fresh Co."},
  {id:3, name:"Chicken Breast",            cat:"fb",       unit:"kg",      qty:40,  min:15, cost:6.0,  supplier:"Premium Meats"},
  {id:4, name:"Beef Ribeye",               cat:"fb",       unit:"kg",      qty:20,  min:8,  cost:18.0, supplier:"Premium Meats"},
  {id:5, name:"Salmon Fillet",             cat:"fb",       unit:"kg",      qty:15,  min:5,  cost:22.0, supplier:"Ocean Fresh"},
  {id:6, name:"Pasta (500g)",              cat:"fb",       unit:"pack",    qty:60,  min:15, cost:1.8,  supplier:"Gourmet Pantry"},
  {id:7, name:"Basmati Rice",              cat:"fb",       unit:"kg",      qty:100, min:25, cost:2.1,  supplier:"Gourmet Pantry"},
  {id:8, name:"Cooking Oil",               cat:"fb",       unit:"litre",   qty:35,  min:10, cost:3.5,  supplier:"Lagos Fresh Co."},
  {id:9, name:"Fresh Tomatoes",            cat:"fb",       unit:"kg",      qty:30,  min:10, cost:1.0,  supplier:"Lagos Fresh Co."},
  {id:10,name:"Mixed Vegetables",          cat:"fb",       unit:"kg",      qty:20,  min:8,  cost:2.5,  supplier:"Lagos Fresh Co."},
  {id:11,name:"Mineral Water 50cl",        cat:"beverage", unit:"carton",  qty:50,  min:15, cost:8.0,  supplier:"AquaPure"},
  {id:12,name:"Coca-Cola 35cl",            cat:"beverage", unit:"carton",  qty:30,  min:10, cost:12.0, supplier:"Coca-Cola"},
  {id:13,name:"Orange Juice (1L)",         cat:"beverage", unit:"litre",   qty:25,  min:8,  cost:3.2,  supplier:"Fruity Fresh"},
  {id:14,name:"Sparkling Water",           cat:"beverage", unit:"carton",  qty:20,  min:6,  cost:10.0, supplier:"AquaPure"},
  {id:15,name:"Energy Drink",              cat:"beverage", unit:"carton",  qty:15,  min:5,  cost:18.0, supplier:"Beverage Hub"},
  {id:16,name:"King Bed Sheet Set",        cat:"linen",    unit:"set",     qty:80,  min:20, cost:35.0, supplier:"Textile House"},
  {id:17,name:"Queen Bed Sheet Set",       cat:"linen",    unit:"set",     qty:60,  min:15, cost:28.0, supplier:"Textile House"},
  {id:18,name:"Bath Towel Large",          cat:"linen",    unit:"piece",   qty:200, min:50, cost:8.0,  supplier:"Textile House"},
  {id:19,name:"Hand Towel",               cat:"linen",    unit:"piece",   qty:200, min:50, cost:4.0,  supplier:"Textile House"},
  {id:20,name:"Duvet Cover",              cat:"linen",    unit:"piece",   qty:60,  min:15, cost:22.0, supplier:"Textile House"},
  {id:21,name:"Shampoo 50ml",             cat:"amenity",  unit:"piece",   qty:500, min:100,cost:0.8,  supplier:"Hygiene Pro"},
  {id:22,name:"Conditioner 50ml",         cat:"amenity",  unit:"piece",   qty:400, min:80, cost:0.9,  supplier:"Hygiene Pro"},
  {id:23,name:"Body Lotion 50ml",         cat:"amenity",  unit:"piece",   qty:400, min:80, cost:1.0,  supplier:"Hygiene Pro"},
  {id:24,name:"Soap Bar",                 cat:"amenity",  unit:"piece",   qty:600, min:120,cost:0.5,  supplier:"Hygiene Pro"},
  {id:25,name:"Toothbrush Kit",           cat:"amenity",  unit:"piece",   qty:300, min:60, cost:1.2,  supplier:"Hygiene Pro"},
  {id:26,name:"Slippers (pair)",          cat:"amenity",  unit:"pair",    qty:200, min:40, cost:2.0,  supplier:"Comfort Co."},
  {id:27,name:"Bathrobe",                 cat:"amenity",  unit:"piece",   qty:80,  min:20, cost:15.0, supplier:"Comfort Co."},
  {id:28,name:"Floor Cleaner 5L",         cat:"cleaning", unit:"bottle",  qty:40,  min:10, cost:6.5,  supplier:"CleanPro"},
  {id:29,name:"Bathroom Disinfectant",    cat:"cleaning", unit:"bottle",  qty:60,  min:15, cost:4.2,  supplier:"CleanPro"},
  {id:30,name:"Laundry Detergent 5kg",    cat:"cleaning", unit:"bag",     qty:20,  min:5,  cost:12.0, supplier:"CleanPro"},
  {id:31,name:"Garbage Bags (pack)",      cat:"cleaning", unit:"pack",    qty:80,  min:20, cost:3.0,  supplier:"CleanPro"},
  {id:32,name:"Whiskey Miniature 50ml",   cat:"minibar",  unit:"piece",   qty:150, min:40, cost:5.0,  supplier:"Spirits Direct"},
  {id:33,name:"Red Wine 375ml",           cat:"minibar",  unit:"bottle",  qty:60,  min:15, cost:8.0,  supplier:"Wine House"},
  {id:34,name:"Craft Beer 330ml",         cat:"minibar",  unit:"can",     qty:200, min:50, cost:2.5,  supplier:"Brewery Direct"},
  {id:35,name:"Mixed Nuts 50g",           cat:"minibar",  unit:"pack",    qty:200, min:50, cost:1.5,  supplier:"Snack World"},
  {id:36,name:"Chocolate Bar",            cat:"minibar",  unit:"piece",   qty:180, min:40, cost:1.8,  supplier:"Snack World"},
  {id:37,name:"LED Bulb 9W",              cat:"maint",    unit:"piece",   qty:50,  min:15, cost:2.5,  supplier:"ElectroPlus"},
  {id:38,name:"Door Lock Battery AA",     cat:"maint",    unit:"pack",    qty:30,  min:10, cost:3.0,  supplier:"ElectroPlus"},
  {id:39,name:"WD-40 Lubricant",          cat:"maint",    unit:"can",     qty:8,   min:3,  cost:4.5,  supplier:"Hardware Hub"},
  {id:40,name:"Plunger",                  cat:"maint",    unit:"piece",   qty:10,  min:3,  cost:5.0,  supplier:"Hardware Hub"},
];

// ─── RESTAURANT MENU ────────────────────────────────────────
const MENU_CATS = {
  breakfast:{ label:"Breakfast",      icon:"🌅", color:"#f59e0b" },
  starters: { label:"Starters",       icon:"🥗", color:T.green   },
  mains:    { label:"Main Courses",   icon:"🍽️", color:T.red     },
  desserts: { label:"Desserts",       icon:"🍰", color:T.pink    },
  drinks:   { label:"Drinks",         icon:"🥤", color:T.blue    },
  specials: { label:"Chef's Special", icon:"⭐", color:T.gold    },
};

const SEED_MENU = [
  // Breakfast
  {id:"m1", name:"Continental Breakfast",  cat:"breakfast", price:18, desc:"Croissant, jam, OJ, coffee",                  prep:15, avail:true, popular:false, veg:false},
  {id:"m2", name:"Full English Breakfast", cat:"breakfast", price:24, desc:"Eggs, bacon, sausage, beans, toast, tomato",   prep:20, avail:true, popular:true,  veg:false},
  {id:"m3", name:"Pancake Stack",          cat:"breakfast", price:16, desc:"Buttermilk pancakes, maple syrup, berries",    prep:15, avail:true, popular:true,  veg:true},
  {id:"m4", name:"Avocado Toast",          cat:"breakfast", price:14, desc:"Sourdough, smashed avo, poached egg",          prep:12, avail:true, popular:false, veg:true},
  {id:"m5", name:"Oatmeal & Fruits",       cat:"breakfast", price:10, desc:"Rolled oats, honey, seasonal fruits, nuts",    prep:8,  avail:true, popular:false, veg:true},
  // Starters
  {id:"m6", name:"Caesar Salad",           cat:"starters",  price:14, desc:"Romaine, parmesan, croutons, dressing",        prep:10, avail:true, popular:true,  veg:false},
  {id:"m7", name:"Prawn Cocktail",         cat:"starters",  price:18, desc:"Tiger prawns, Marie Rose, avocado",            prep:10, avail:true, popular:false, veg:false},
  {id:"m8", name:"Soup of the Day",        cat:"starters",  price:10, desc:"Chef's selection with warm bread",             prep:8,  avail:true, popular:false, veg:false},
  {id:"m9", name:"Buffalo Chicken Wings",  cat:"starters",  price:16, desc:"6pcs, spicy buffalo, celery, blue cheese",     prep:18, avail:true, popular:true,  veg:false},
  {id:"m10",name:"Bruschetta",             cat:"starters",  price:12, desc:"Tomato, basil, garlic, olive oil, ciabatta",   prep:8,  avail:true, popular:false, veg:true},
  // Mains
  {id:"m11",name:"Grilled Chicken Breast", cat:"mains",     price:28, desc:"Herb-marinated, seasonal veg, garlic mash",    prep:25, avail:true, popular:true,  veg:false},
  {id:"m12",name:"Ribeye Steak 300g",      cat:"mains",     price:55, desc:"Choice of temp, chimichurri, fries",           prep:30, avail:true, popular:true,  veg:false},
  {id:"m13",name:"Grilled Atlantic Salmon",cat:"mains",     price:38, desc:"Lemon butter, asparagus, basmati rice",        prep:22, avail:true, popular:false, veg:false},
  {id:"m14",name:"Pasta Carbonara",        cat:"mains",     price:22, desc:"Spaghetti, pancetta, egg yolk, parmesan",      prep:20, avail:true, popular:true,  veg:false},
  {id:"m15",name:"Jollof Rice & Chicken",  cat:"mains",     price:20, desc:"Party jollof, grilled chicken, plantain",      prep:20, avail:true, popular:true,  veg:false},
  {id:"m16",name:"Beef Burger",            cat:"mains",     price:24, desc:"6oz patty, cheddar, lettuce, fries",           prep:20, avail:true, popular:true,  veg:false},
  {id:"m17",name:"Vegetable Curry",        cat:"mains",     price:18, desc:"Mixed veg, coconut milk, basmati, naan",       prep:20, avail:true, popular:false, veg:true},
  {id:"m18",name:"Seafood Linguine",       cat:"mains",     price:42, desc:"Prawns, mussels, squid, white wine",           prep:25, avail:true, popular:false, veg:false},
  // Desserts
  {id:"m19",name:"Chocolate Fondant",      cat:"desserts",  price:14, desc:"Warm dark chocolate, vanilla ice cream",       prep:15, avail:true, popular:true,  veg:true},
  {id:"m20",name:"Crème Brûlée",           cat:"desserts",  price:12, desc:"Classic French vanilla custard",               prep:10, avail:true, popular:false, veg:true},
  {id:"m21",name:"New York Cheesecake",    cat:"desserts",  price:13, desc:"Classic slice, berry coulis",                  prep:5,  avail:true, popular:true,  veg:true},
  {id:"m22",name:"Ice Cream 3 Scoops",     cat:"desserts",  price:10, desc:"Vanilla, chocolate or strawberry",             prep:5,  avail:true, popular:false, veg:true},
  // Drinks
  {id:"m23",name:"Fresh Orange Juice",     cat:"drinks",    price:8,  desc:"Freshly squeezed",                             prep:3,  avail:true, popular:false, veg:true},
  {id:"m24",name:"Smoothie of the Day",    cat:"drinks",    price:10, desc:"Seasonal fresh fruit blend",                   prep:5,  avail:true, popular:false, veg:true},
  {id:"m25",name:"Espresso",               cat:"drinks",    price:5,  desc:"Single or double shot",                        prep:3,  avail:true, popular:true,  veg:true},
  {id:"m26",name:"Cappuccino / Latte",     cat:"drinks",    price:7,  desc:"Espresso with steamed milk",                   prep:4,  avail:true, popular:true,  veg:true},
  {id:"m27",name:"Still / Sparkling Water",cat:"drinks",    price:4,  desc:"500ml premium mineral water",                  prep:1,  avail:true, popular:false, veg:true},
  {id:"m28",name:"Signature Cocktail",     cat:"drinks",    price:18, desc:"Bartender's signature mix",                    prep:7,  avail:true, popular:true,  veg:true},
  {id:"m29",name:"Wine by the Glass",      cat:"drinks",    price:14, desc:"House red or white selection",                  prep:2,  avail:true, popular:false, veg:true},
  {id:"m30",name:"Craft Beer",             cat:"drinks",    price:10, desc:"Rotating selection, tap or bottle",            prep:2,  avail:true, popular:false, veg:true},
  // Specials
  {id:"m31",name:"Surf & Turf",            cat:"specials",  price:68, desc:"Lobster tail + tenderloin, truffle butter",    prep:35, avail:true, popular:true,  veg:false},
  {id:"m32",name:"Chef's 5-Course Menu",   cat:"specials",  price:95, desc:"Seasonal ingredients, wine pairing optional",  prep:60, avail:true, popular:false, veg:false},
];

// ─── RESTAURANT TABLES ──────────────────────────────────────
const SEED_TABLES = [
  ...Array.from({length:6}, (_,i) => ({ id:i+1,  no:`T${String(i+1).padStart(2,"0")}`, cap:i<2?2:4, status:"available", section:"Indoor A", orderId:null })),
  ...Array.from({length:6}, (_,i) => ({ id:i+7,  no:`T${String(i+7).padStart(2,"0")}`, cap:4,       status:"available", section:"Indoor B", orderId:null })),
  ...Array.from({length:4}, (_,i) => ({ id:i+13, no:`T${String(i+13).padStart(2,"0")}`,cap:i<2?4:6, status:"available", section:"Terrace",  orderId:null })),
  ...Array.from({length:4}, (_,i) => ({ id:i+17, no:`T${String(i+17).padStart(2,"0")}`,cap:i<2?6:8, status:"available", section:"Private",  orderId:null })),
];

// ─── HELPERS ────────────────────────────────────────────────
const ls = {
  get:(k,d)=>{ try{ const v=localStorage.getItem(k); return v?JSON.parse(v):d; }catch{ return d; } },
  set:(k,v)=>{ try{ localStorage.setItem(k,JSON.stringify(v)); }catch{} },
};

const today = () => new Date().toISOString().split("T")[0];
const nowStr = () => new Date().toLocaleString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"});
const nights = (a,b) => Math.max(1, Math.ceil((new Date(b)-new Date(a))/86400000));
const fmtDate = () => new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"});

const GUEST_NAMES = ["James Wilson","Sarah Johnson","Michael Brown","Emily Davis","Robert Miller",
  "Jennifer Garcia","William Martinez","Amanda Anderson","David Taylor","Jessica Thomas",
  "Chidi Okafor","Ngozi Adeyemi","Kwame Mensah","Amara Diallo","Priya Patel","Carlos Rivera"];

function randGuest(){ return GUEST_NAMES[Math.floor(Math.random()*GUEST_NAMES.length)]; }
function randPast(d=4){ const x=new Date(); x.setDate(x.getDate()-Math.floor(Math.random()*d)-1); return x.toISOString().split("T")[0]; }
function randFuture(d=7){ const x=new Date(); x.setDate(x.getDate()+Math.floor(Math.random()*d)+1); return x.toISOString().split("T")[0]; }

function buildRooms(){
  const types=["standard","standard","standard","standard","deluxe","deluxe","suite","executive"];
  const sts=["available","available","available","occupied","occupied","reserved","available","available","maintenance"];
  return Array.from({length:50},(_,i)=>{
    const id=i+1, floor=Math.ceil(id/10);
    const num=`${floor}${String(id%10===0?10:id%10).padStart(2,"0")}`;
    const type=types[Math.floor(Math.random()*types.length)];
    const status=sts[Math.floor(Math.random()*sts.length)];
    const guest=(status==="occupied"||status==="checkout")?randGuest():null;
    return {
      id, number:num, floor, type, status, guest,
      checkIn:guest?randPast(4):null, checkOut:guest?randFuture(6):null,
      phone:guest?`+234 80${Math.floor(10000000+Math.random()*89999999)}`:null,
      adults:guest?Math.ceil(Math.random()*3):1,
      notes:"", charges:[], hk:[], dnd:false, wakeUp:"",
    };
  });
}

// ─── UI PRIMITIVES ──────────────────────────────────────────
function Btn({children,color=T.gold,onClick,full,sm,ghost,style={},disabled=false}){
  const [hov,setHov]=useState(false);
  return (
    <button onClick={disabled?undefined:onClick}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      disabled={disabled}
      style={{background:ghost?"transparent":hov?color+"30":color+"18",border:`1px solid ${color}${hov?"88":"44"}`,
        color:disabled?"#333":color,padding:sm?"5px 11px":"10px 18px",borderRadius:7,cursor:disabled?"not-allowed":"pointer",
        fontSize:sm?11:13,fontWeight:"bold",transition:"all .15s",width:full?"100%":undefined,opacity:disabled?.5:1,...style}}>
      {children}
    </button>
  );
}

function Badge({children,color=T.gold}){
  return <span style={{background:color+"22",border:`1px solid ${color}44`,color,padding:"2px 10px",borderRadius:12,fontSize:11,fontWeight:"bold",display:"inline-block"}}>{children}</span>;
}

function Card({children,style={}}){
  return <div style={{background:T.s1,border:`1px solid ${T.bdr}`,borderRadius:10,...style}}>{children}</div>;
}

function Modal({onClose,children,width=520,noPad=false}){
  useEffect(()=>{ const h=e=>e.key==="Escape"&&onClose(); window.addEventListener("keydown",h); return()=>window.removeEventListener("keydown",h); },[]);
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.88)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:16,backdropFilter:"blur(4px)"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:T.s1,border:`1px solid ${T.gold}30`,borderRadius:12,width:"100%",maxWidth:width,maxHeight:"92vh",overflow:"auto",boxShadow:`0 32px 100px rgba(0,0,0,.9),0 0 0 1px ${T.gold}10`}}>
        {children}
      </div>
    </div>
  );
}

function ModalHeader({title,onClose}){
  return (
    <div style={{padding:"18px 24px",borderBottom:`1px solid ${T.bdr}`,display:"flex",justifyContent:"space-between",alignItems:"center",background:`linear-gradient(135deg,${T.s2},${T.s1})`}}>
      <div style={{color:T.gold,fontSize:15,letterSpacing:1,fontWeight:"normal"}}>{title}</div>
      <button onClick={onClose} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:22,lineHeight:1,padding:"0 4px"}} onMouseEnter={e=>e.target.style.color=T.txt} onMouseLeave={e=>e.target.style.color=T.muted}>×</button>
    </div>
  );
}

function Inp({label,value,onChange,placeholder,type="text",options,disabled=false,style={},inputStyle={}}){
  const base={background:T.s2,border:`1px solid ${T.bdr}`,borderRadius:7,color:T.txt,padding:"10px 14px",fontSize:13,width:"100%",outline:"none",transition:"border .15s",...inputStyle};
  return (
    <div style={style}>
      {label&&<div style={{color:T.muted,fontSize:10,letterSpacing:1.5,marginBottom:5,textTransform:"uppercase"}}>{label}</div>}
      {options ? (
        <select value={value} onChange={e=>onChange(e.target.value)} disabled={disabled} style={{...base,opacity:disabled?.6:1}}>
          {options.map(o=><option key={o.value??o} value={o.value??o}>{o.label??o}</option>)}
        </select>
      ) : (
        <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} disabled={disabled}
          style={{...base,opacity:disabled?.6:1}}
          onFocus={e=>e.target.style.borderColor=T.gold+"66"}
          onBlur={e=>e.target.style.borderColor=T.bdr}/>
      )}
    </div>
  );
}

function SectionHead({children,style={}}){
  return <h2 style={{color:T.gold,fontSize:19,fontWeight:"normal",letterSpacing:2,marginBottom:20,...style}}>{children}</h2>;
}

function Toast({msg,type="success"}){
  const col=type==="error"?T.red:type==="warn"?T.orange:T.green;
  return (
    <div style={{position:"fixed",bottom:20,right:20,background:T.s2,border:`1px solid ${col}66`,color:T.txt,padding:"13px 18px",borderRadius:9,boxShadow:`0 8px 32px rgba(0,0,0,.7),0 0 0 1px ${col}22`,fontSize:13,zIndex:3000,animation:"toastIn .3s ease",maxWidth:380,display:"flex",alignItems:"center",gap:10}}>
      <span style={{color:col,fontSize:16}}>{type==="error"?"✕":type==="warn"?"⚠":"✓"}</span>
      {msg}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  LOGIN PAGE
// ═══════════════════════════════════════════════════════════
function LoginPage({onLogin, settings}){
  const [username,setUsername]=useState("");
  const [password,setPassword]=useState("");
  const [showPw,setShowPw]=useState(false);
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false);
  const users = ls.get("hotel_users", SEED_USERS);

  const attempt = () => {
    if(!username||!password){ setErr("Please enter username and password"); return; }
    setLoading(true);
    setTimeout(()=>{
      const u=users.find(u=>u.username===username.trim()&&u.password===password&&u.active);
      if(!u){ setErr("Invalid credentials or account is disabled"); setLoading(false); return; }
      onLogin({...u,loginAt:nowStr()});
    },600);
  };

  const demos=[
    {role:"admin",u:"admin",p:"Admin@123"},
    {role:"manager",u:"manager",p:"Mgr@123"},
    {role:"frontdesk",u:"frontdesk",p:"Desk@123"},
    {role:"restaurant",u:"restaurant",p:"Food@123"},
    {role:"housekeeping",u:"housekeeping",p:"House@123"},
  ];

  return (
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Georgia','Times New Roman',serif",padding:16,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",inset:0,backgroundImage:`radial-gradient(ellipse at 20% 40%,${T.gold}07 0%,transparent 55%),radial-gradient(ellipse at 80% 70%,${T.blue}05 0%,transparent 50%)`,pointerEvents:"none"}}/>
      <div style={{position:"absolute",top:0,left:0,right:0,height:1,background:`linear-gradient(90deg,transparent 0%,${T.gold}60 50%,transparent 100%)`}}/>

      <div style={{width:"100%",maxWidth:460,position:"relative"}}>
        {/* Logo */}
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{fontSize:52,color:T.gold,textShadow:`0 0 60px ${T.gold}50`,marginBottom:14,animation:"pulse 3s ease-in-out infinite"}}>{settings.logo}</div>
          <div style={{fontSize:24,fontWeight:"bold",color:T.gold,letterSpacing:4,marginBottom:4}}>{settings.hotelName.toUpperCase()}</div>
          <div style={{color:T.muted,fontSize:11,letterSpacing:3}}>{settings.tagline||"MANAGEMENT SYSTEM"}</div>
          <div style={{width:80,height:1,background:`linear-gradient(90deg,transparent,${T.gold},transparent)`,margin:"18px auto 0"}}/>
        </div>

        {/* Login Card */}
        <Card style={{padding:32,boxShadow:`0 24px 80px rgba(0,0,0,.6),0 0 0 1px ${T.gold}10`}}>
          <div style={{color:T.muted,fontSize:12,letterSpacing:2,textAlign:"center",marginBottom:24}}>STAFF SIGN IN</div>
          {err&&(
            <div style={{background:"#200505",border:`1px solid ${T.red}44`,color:T.red,padding:"11px 14px",borderRadius:7,marginBottom:16,fontSize:13,display:"flex",alignItems:"center",gap:8}}>
              <span>⚠</span>{err}
            </div>
          )}
          <div style={{display:"flex",flexDirection:"column",gap:15}}>
            <Inp label="Username" value={username} onChange={v=>{setUsername(v);setErr("");}} placeholder="Enter your username"/>
            <div>
              <div style={{color:T.muted,fontSize:10,letterSpacing:1.5,marginBottom:5,textTransform:"uppercase"}}>Password</div>
              <div style={{position:"relative"}}>
                <input type={showPw?"text":"password"} value={password} onChange={e=>{setPassword(e.target.value);setErr("");}}
                  onKeyDown={e=>e.key==="Enter"&&attempt()} placeholder="Enter your password"
                  style={{background:T.s2,border:`1px solid ${T.bdr}`,borderRadius:7,color:T.txt,padding:"10px 44px 10px 14px",fontSize:13,width:"100%",outline:"none"}}
                  onFocus={e=>e.target.style.borderColor=T.gold+"66"} onBlur={e=>e.target.style.borderColor=T.bdr}/>
                <button onClick={()=>setShowPw(p=>!p)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:15}}>{showPw?"🙈":"👁"}</button>
              </div>
            </div>
            <button onClick={attempt} disabled={loading}
              style={{background:`linear-gradient(135deg,${T.gold}dd,${T.goldD}dd)`,border:"none",color:"#0a0800",padding:"13px",borderRadius:8,cursor:loading?"wait":"pointer",fontSize:14,fontWeight:"bold",letterSpacing:1,marginTop:6,transition:"all .2s",opacity:loading?.7:1}}>
              {loading?"Authenticating…":"🔐  SIGN IN"}
            </button>
          </div>
        </Card>

        {/* Demo Credentials */}
        <Card style={{padding:20,marginTop:16}}>
          <div style={{color:T.muted,fontSize:10,letterSpacing:2,marginBottom:14,textAlign:"center"}}>DEMO CREDENTIALS — CLICK TO AUTOFILL</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {demos.map(d=>{
              const r=ROLES[d.role];
              return (
                <button key={d.role} onClick={()=>{setUsername(d.u);setPassword(d.p);setErr("");}}
                  style={{background:T.s2,border:`1px solid ${r.color}25`,borderRadius:8,padding:"10px 12px",cursor:"pointer",textAlign:"left",transition:"all .15s"}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=r.color+"66";e.currentTarget.style.background=r.color+"10";}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=r.color+"25";e.currentTarget.style.background=T.s2;}}>
                  <div style={{fontSize:12,color:r.color,fontWeight:"bold",marginBottom:2}}>{r.icon} {r.label}</div>
                  <div style={{fontSize:10,color:T.muted}}>{d.u} / {d.p}</div>
                </button>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  SETTINGS PAGE
// ═══════════════════════════════════════════════════════════
function SettingsPage({settings,onSave,currentUser,addToast}){
  const [tab,setTab]=useState("hotel");
  const [hf,setHf]=useState({...settings});
  const [users,setUsers]=useState(()=>ls.get("hotel_users",SEED_USERS));
  const [showUM,setShowUM]=useState(false);
  const [editU,setEditU]=useState(null);
  const [uf,setUf]=useState({username:"",password:"",name:"",role:"frontdesk",email:"",phone:"",active:true});
  const [pwShow,setPwShow]=useState(false);
  const canAdmin=["admin","manager"].includes(currentUser.role);

  const saveHotel=()=>{ onSave(hf); addToast("Hotel settings saved"); };

  const saveUser=()=>{
    if(!uf.username||!uf.name||!uf.password){ addToast("Fill required fields","error"); return; }
    let updated;
    if(editU){ updated=users.map(u=>u.id===editU.id?{...u,...uf}:u); }
    else {
      if(users.find(u=>u.username===uf.username)){ addToast("Username already exists","error"); return; }
      updated=[...users,{...uf,id:Date.now(),createdAt:today()}];
    }
    setUsers(updated); ls.set("hotel_users",updated);
    setShowUM(false); setEditU(null);
    addToast(`User ${editU?"updated":"created"} successfully`);
  };

  const toggleUser=(id)=>{
    if(id===currentUser.id){ addToast("Cannot deactivate your own account","warn"); return; }
    const u=users.map(u=>u.id===id?{...u,active:!u.active}:u);
    setUsers(u); ls.set("hotel_users",u); addToast("User status updated");
  };

  const deleteUser=(id)=>{
    if(id===currentUser.id){ addToast("Cannot delete your own account","warn"); return; }
    if(currentUser.role!=="admin"){ addToast("Only Admin can delete users","error"); return; }
    const u=users.filter(u=>u.id!==id); setUsers(u); ls.set("hotel_users",u); addToast("User deleted");
  };

  const TABS=[
    {id:"hotel",label:"🏨 Hotel Profile"},
    {id:"billing",label:"💰 Billing & Tax"},
    {id:"users",label:"👥 User Management",admin:true},
    {id:"access",label:"🔐 Access Control",admin:true},
    {id:"system",label:"⚙️ System"},
    {id:"printer",label:"🖨️ Printer"},
  ].filter(t=>!t.admin||canAdmin);

  return (
    <div>
      <SectionHead>Settings</SectionHead>
      <div style={{display:"flex",gap:0,borderBottom:`1px solid ${T.bdr}`,marginBottom:28,overflowX:"auto"}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{background:"none",border:"none",borderBottom:tab===t.id?`2px solid ${T.gold}`:"2px solid transparent",
            color:tab===t.id?T.gold:T.muted,padding:"10px 18px",cursor:"pointer",fontSize:13,whiteSpace:"nowrap",transition:"all .15s",marginBottom:-1}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* HOTEL PROFILE */}
      {tab==="hotel"&&(
        <div style={{maxWidth:620}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:15,marginBottom:15}}>
            <Inp label="Hotel Name" value={hf.hotelName} onChange={v=>setHf(f=>({...f,hotelName:v}))}/>
            <Inp label="Tagline" value={hf.tagline||""} onChange={v=>setHf(f=>({...f,tagline:v}))} placeholder="Where Excellence Meets Comfort"/>
          </div>
          <Inp label="Address" value={hf.address} onChange={v=>setHf(f=>({...f,address:v}))} style={{marginBottom:15}}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:15,marginBottom:15}}>
            <Inp label="City" value={hf.city} onChange={v=>setHf(f=>({...f,city:v}))}/>
            <Inp label="Country" value={hf.country} onChange={v=>setHf(f=>({...f,country:v}))}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:15,marginBottom:15}}>
            <Inp label="Phone" value={hf.phone} onChange={v=>setHf(f=>({...f,phone:v}))}/>
            <Inp label="Email" value={hf.email} onChange={v=>setHf(f=>({...f,email:v}))}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:15,marginBottom:15}}>
            <Inp label="Website" value={hf.website} onChange={v=>setHf(f=>({...f,website:v}))}/>
            <Inp label="Star Rating" value={hf.stars||5} onChange={v=>setHf(f=>({...f,stars:Number(v)}))} options={[{value:3,label:"★★★ 3 Star"},{value:4,label:"★★★★ 4 Star"},{value:5,label:"★★★★★ 5 Star"}]}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:15,marginBottom:15}}>
            <Inp label="Check-In Time" type="time" value={hf.checkInTime} onChange={v=>setHf(f=>({...f,checkInTime:v}))}/>
            <Inp label="Check-Out Time" type="time" value={hf.checkOutTime} onChange={v=>setHf(f=>({...f,checkOutTime:v}))}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:15,marginBottom:15}}>
            <Inp label="WiFi Network" value={hf.wifi||""} onChange={v=>setHf(f=>({...f,wifi:v}))}/>
            <Inp label="WiFi Password" value={hf.wifiPass||""} onChange={v=>setHf(f=>({...f,wifiPass:v}))}/>
          </div>
          <Inp label="Emergency Contact" value={hf.emergencyContact||""} onChange={v=>setHf(f=>({...f,emergencyContact:v}))} style={{marginBottom:20}}/>
          <Btn color={T.gold} onClick={saveHotel}>💾 Save Hotel Profile</Btn>
        </div>
      )}

      {/* BILLING */}
      {tab==="billing"&&(
        <div style={{maxWidth:520}}>
          <Card style={{padding:22,marginBottom:20}}>
            <div style={{color:T.gold,fontSize:12,letterSpacing:1,marginBottom:16}}>ROOM RATES (read-only)</div>
            {Object.entries(ROOM_TYPES).map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:`1px solid ${T.bdr}`,fontSize:13}}>
                <span style={{color:v.color}}>{v.label} — {v.beds}</span>
                <span style={{color:T.gold,fontWeight:"bold"}}>{hf.currency||"$"}{v.price}/night</span>
              </div>
            ))}
            <div style={{marginTop:12,color:T.muted,fontSize:12}}>Rate changes require code update. Contact IT admin.</div>
          </Card>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:15,marginBottom:15}}>
            <div>
              <div style={{color:T.muted,fontSize:10,letterSpacing:1.5,marginBottom:5}}>TAX RATE (%)</div>
              <input type="number" value={hf.taxRate} onChange={e=>setHf(f=>({...f,taxRate:Number(e.target.value)}))} style={{background:T.s2,border:`1px solid ${T.bdr}`,borderRadius:7,color:T.txt,padding:"10px 14px",fontSize:13,width:"100%",outline:"none"}} min={0} max={50}/>
            </div>
            <div>
              <div style={{color:T.muted,fontSize:10,letterSpacing:1.5,marginBottom:5}}>SERVICE CHARGE (%)</div>
              <input type="number" value={hf.serviceCharge} onChange={e=>setHf(f=>({...f,serviceCharge:Number(e.target.value)}))} style={{background:T.s2,border:`1px solid ${T.bdr}`,borderRadius:7,color:T.txt,padding:"10px 14px",fontSize:13,width:"100%",outline:"none"}} min={0} max={30}/>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:15,marginBottom:15}}>
            <Inp label="Currency Symbol" value={hf.currency||"$"} onChange={v=>setHf(f=>({...f,currency:v}))} placeholder="$"/>
            <Inp label="Currency Code" value={hf.currencyCode||"USD"} onChange={v=>setHf(f=>({...f,currencyCode:v}))} options={["USD","EUR","GBP","NGN","GHS","KES","ZAR"]}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:15,marginBottom:20}}>
            <div>
              <div style={{color:T.muted,fontSize:10,letterSpacing:1.5,marginBottom:5}}>LATE CHECKOUT FEE ($)</div>
              <input type="number" value={hf.lateCheckoutFee||50} onChange={e=>setHf(f=>({...f,lateCheckoutFee:Number(e.target.value)}))} style={{background:T.s2,border:`1px solid ${T.bdr}`,borderRadius:7,color:T.txt,padding:"10px 14px",fontSize:13,width:"100%",outline:"none"}} min={0}/>
            </div>
            <div>
              <div style={{color:T.muted,fontSize:10,letterSpacing:1.5,marginBottom:5}}>EARLY CHECK-IN FEE ($)</div>
              <input type="number" value={hf.earlyCheckinFee||30} onChange={e=>setHf(f=>({...f,earlyCheckinFee:Number(e.target.value)}))} style={{background:T.s2,border:`1px solid ${T.bdr}`,borderRadius:7,color:T.txt,padding:"10px 14px",fontSize:13,width:"100%",outline:"none"}} min={0}/>
            </div>
          </div>
          <Btn color={T.gold} onClick={saveHotel}>💾 Save Billing Settings</Btn>
        </div>
      )}

      {/* USER MANAGEMENT */}
      {tab==="users"&&canAdmin&&(
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
            <div style={{color:T.mutedL,fontSize:13}}>{users.length} registered users · {users.filter(u=>u.active).length} active</div>
            <Btn color={T.green} onClick={()=>{setEditU(null);setUf({username:"",password:"",name:"",role:"frontdesk",email:"",phone:"",active:true});setShowUM(true);}}>+ Add User</Btn>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {users.map(u=>{
              const r=ROLES[u.role];
              return (
                <Card key={u.id} style={{padding:16,display:"flex",alignItems:"center",gap:16}}>
                  <div style={{width:44,height:44,borderRadius:"50%",background:`${r.color}18`,border:`2px solid ${r.color}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{r.icon}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
                      <span style={{color:T.txt,fontWeight:"bold",fontSize:14}}>{u.name}</span>
                      {u.id===currentUser.id&&<span style={{fontSize:10,background:`${T.gold}22`,color:T.gold,padding:"1px 6px",borderRadius:8}}>YOU</span>}
                    </div>
                    <div style={{color:T.muted,fontSize:12,marginBottom:6}}>@{u.username} · {u.email||"No email"}</div>
                    <div style={{display:"flex",gap:8}}>
                      <Badge color={r.color}>{r.icon} {r.label}</Badge>
                      <Badge color={u.active?T.green:T.red}>{u.active?"Active":"Inactive"}</Badge>
                    </div>
                  </div>
                  <div style={{color:T.muted,fontSize:11,textAlign:"right",flexShrink:0}}>
                    <div>Created: {u.createdAt||"—"}</div>
                    {u.lastLogin&&<div style={{marginTop:2}}>Last: {u.lastLogin}</div>}
                  </div>
                  <div style={{display:"flex",gap:7,flexShrink:0}}>
                    <Btn sm color={T.blue} onClick={()=>{setEditU(u);setUf({username:u.username,password:u.password,name:u.name,role:u.role,email:u.email||"",phone:u.phone||"",active:u.active});setShowUM(true);}}>Edit</Btn>
                    <Btn sm color={u.active?T.orange:T.green} onClick={()=>toggleUser(u.id)}>{u.active?"Disable":"Enable"}</Btn>
                    {currentUser.role==="admin"&&u.id!==currentUser.id&&<Btn sm color={T.red} onClick={()=>deleteUser(u.id)}>Del</Btn>}
                  </div>
                </Card>
              );
            })}
          </div>
          {showUM&&(
            <Modal onClose={()=>setShowUM(false)} width={500}>
              <ModalHeader title={editU?"Edit User Account":"Create New User"} onClose={()=>setShowUM(false)}/>
              <div style={{padding:24,display:"flex",flexDirection:"column",gap:14}}>
                <Inp label="Full Name *" value={uf.name} onChange={v=>setUf(f=>({...f,name:v}))} placeholder="Employee full name"/>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                  <Inp label="Username *" value={uf.username} onChange={v=>setUf(f=>({...f,username:v}))} placeholder="login.name" disabled={!!editU}/>
                  <div>
                    <div style={{color:T.muted,fontSize:10,letterSpacing:1.5,marginBottom:5}}>PASSWORD *</div>
                    <div style={{position:"relative"}}>
                      <input type={pwShow?"text":"password"} value={uf.password} onChange={e=>setUf(f=>({...f,password:e.target.value}))} placeholder="••••••••"
                        style={{background:T.s2,border:`1px solid ${T.bdr}`,borderRadius:7,color:T.txt,padding:"10px 40px 10px 14px",fontSize:13,width:"100%",outline:"none"}}/>
                      <button onClick={()=>setPwShow(p=>!p)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:14}}>{pwShow?"🙈":"👁"}</button>
                    </div>
                  </div>
                </div>
                <Inp label="Email" value={uf.email} onChange={v=>setUf(f=>({...f,email:v}))} placeholder="user@hotel.com"/>
                <Inp label="Phone" value={uf.phone} onChange={v=>setUf(f=>({...f,phone:v}))} placeholder="+234 ..."/>
                <Inp label="Role" value={uf.role} onChange={v=>setUf(f=>({...f,role:v}))} options={Object.entries(ROLES).map(([k,v])=>({value:k,label:`${v.icon} ${v.label}`}))}/>
                <div style={{background:T.s2,borderRadius:8,padding:14,fontSize:12}}>
                  <div style={{color:T.gold,marginBottom:8}}>📋 {ROLES[uf.role]?.label} — Access to:</div>
                  <div style={{color:T.mutedL}}>{ROLES[uf.role]?.pages.join(" · ")}</div>
                </div>
                <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",color:T.txt,fontSize:13}}>
                  <input type="checkbox" checked={uf.active} onChange={e=>setUf(f=>({...f,active:e.target.checked}))} style={{accentColor:T.green}}/> Account Active
                </label>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:6}}>
                  <Btn color={T.muted} onClick={()=>setShowUM(false)} full ghost>Cancel</Btn>
                  <Btn color={T.green} onClick={saveUser} full>{editU?"Update User":"Create User"}</Btn>
                </div>
              </div>
            </Modal>
          )}
        </div>
      )}

      {/* ACCESS CONTROL */}
      {tab==="access"&&canAdmin&&(
        <div style={{maxWidth:700}}>
          <div style={{color:T.mutedL,fontSize:13,marginBottom:20}}>System access matrix — what each role can access.</div>
          <Card style={{overflow:"hidden"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead>
                <tr style={{background:T.s2}}>
                  <th style={{color:T.gold,fontSize:11,letterSpacing:1,padding:"12px 16px",textAlign:"left",borderBottom:`1px solid ${T.bdr}`,fontWeight:"normal"}}>MODULE</th>
                  {Object.entries(ROLES).map(([k,v])=>(
                    <th key={k} style={{color:v.color,fontSize:11,letterSpacing:1,padding:"12px 14px",textAlign:"center",borderBottom:`1px solid ${T.bdr}`,fontWeight:"normal"}}>{v.icon}<br/>{v.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {["dashboard","rooms","restaurant","inventory","housekeeping","bookings","guests","reports","settings"].map(pg=>(
                  <tr key={pg} style={{borderBottom:`1px solid ${T.bdr}`}} onMouseEnter={e=>e.currentTarget.style.background=T.s2} onMouseLeave={e=>e.currentTarget.style.background=""}>
                    <td style={{padding:"10px 16px",color:T.txt,fontSize:13,textTransform:"capitalize",fontWeight:"bold"}}>{pg}</td>
                    {Object.entries(ROLES).map(([k,v])=>(
                      <td key={k} style={{padding:"10px 14px",textAlign:"center"}}>
                        {v.pages.includes(pg) ? <span style={{color:T.green,fontSize:16}}>✓</span> : <span style={{color:T.muted,fontSize:16}}>—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* SYSTEM */}
      {tab==="system"&&(
        <div style={{maxWidth:500}}>
          <Card style={{padding:22,marginBottom:16}}>
            <div style={{color:T.gold,fontSize:12,letterSpacing:1,marginBottom:16}}>SYSTEM INFO</div>
            {[["Software","Grand Imperial HMS v4.0"],["Edition","Web / Browser Edition"],["Session User",`${currentUser.name} (${ROLES[currentUser.role].label})`],["Login Time",currentUser.loginAt||"—"],["Total Rooms","50"],["Currency",settings.currency||"$"],["Tax Rate",`${settings.taxRate}%`],["Service Charge",`${settings.serviceCharge}%`]].map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${T.bdr}`,fontSize:13}}>
                <span style={{color:T.muted}}>{k}</span><span style={{color:T.txt}}>{v}</span>
              </div>
            ))}
          </Card>
          <Card style={{padding:22,marginBottom:16}}>
            <div style={{color:T.gold,fontSize:12,letterSpacing:1,marginBottom:12}}>DATA MANAGEMENT</div>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              <Btn color={T.orange} sm onClick={()=>{ls.set("hotel_users",SEED_USERS);ls.set("hotel_inv",SEED_INVENTORY);ls.set("hotel_menu",SEED_MENU);addToast("Default data restored");}}>↺ Restore Defaults</Btn>
              {currentUser.role==="admin"&&<Btn color={T.red} sm onClick={()=>{if(confirm("Reset ALL hotel data? This cannot be undone.")){localStorage.clear();window.location.reload();}}}>🗑 Reset All Data</Btn>}
            </div>
          </Card>
        </div>
      )}

      {/* PRINTER CONFIGURATION */}
      {tab==="printer"&&(
        <div style={{maxWidth:520}}>
          <Card style={{padding:22,marginBottom:16}}>
            <div style={{color:T.gold,fontSize:12,letterSpacing:1,marginBottom:16}}>🖨️ PRINTER SETTINGS</div>
            <div style={{color:T.muted,fontSize:12,marginBottom:16}}>Configure default printer settings for invoice and report printing.</div>
            
            <div style={{marginBottom:16}}>
              <Inp label="Default Printer Name" value={hf.printerName||""} onChange={v=>setHf(f=>({...f,printerName:v}))} placeholder="e.g. Front Desk Printer"/>
            </div>

            <div style={{marginBottom:16}}>
              <Inp label="Paper Size" value={hf.paperSize||"A4"} onChange={v=>setHf(f=>({...f,paperSize:v}))} options={[{value:"A4",label:"A4 (Standard)"},{value:"Letter",label:"Letter (US)"},{value:"Legal",label:"Legal (US)"}]}/>
            </div>

            <div style={{marginBottom:16}}>
              <Inp label="Print Orientation" value={hf.printOrientation||"portrait"} onChange={v=>setHf(f=>({...f,printOrientation:v}))} options={[{value:"portrait",label:"Portrait"},{value:"landscape",label:"Landscape"}]}/>
            </div>

            <div style={{marginBottom:16}}>
              <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",color:T.txt,fontSize:13}}>
                <input type="checkbox" checked={hf.includeHeaderFooter??false} onChange={e=>setHf(f=>({...f,includeHeaderFooter:e.target.checked}))} style={{accentColor:T.gold}}/>
                Include Header/Footer in Print
              </label>
            </div>

            <Btn color={T.gold} onClick={()=>{saveHotel();addToast("Printer settings saved");}}>💾 Save Printer Settings</Btn>
          </Card>

          <Card style={{padding:22,marginBottom:16}}>
            <div style={{color:T.gold,fontSize:12,letterSpacing:1,marginBottom:12}}>🧪 TEST PRINT</div>
            <div style={{color:T.muted,fontSize:12,marginBottom:12}}>Print a test page to verify your printer settings.</div>
            <Btn color={T.blue} onClick={()=>window.print()}>🖨️ Print Test Page</Btn>
          </Card>

          <Card style={{padding:22}}>
            <div style={{color:T.gold,fontSize:12,letterSpacing:1,marginBottom:12}}>📋 PRINTING TIPS</div>
            <div style={{color:T.muted,fontSize:12,lineHeight:1.6}}>
              <div style={{marginBottom:8}}>• Use the <strong style={{color:T.txt}}>Print Invoice</strong> button in the Invoice tab to print guest invoices</div>
              <div style={{marginBottom:8}}>• Use <strong style={{color:T.txt}}>Ctrl+P</strong> (Windows) or <strong style={{color:T.txt}}>Cmd+P</strong> (Mac) for quick print</div>
              <div>• Select your printer from the print dialog</div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  INVENTORY PAGE
// ═══════════════════════════════════════════════════════════
function InventoryPage({currentUser,addToast}){
  const [inv,setInv]=useState(()=>ls.get("hotel_inv",SEED_INVENTORY));
  const [cat,setCat]=useState("all");
  const [search,setSearch]=useState("");
  const [sort,setSort]=useState("name");
  const [modal,setModal]=useState(null); // add|edit|adjust|log
  const [form,setForm]=useState({name:"",cat:"fb",unit:"piece",qty:0,min:5,cost:0,supplier:""});
  const [adjItem,setAdjItem]=useState(null);
  const [adjQty,setAdjQty]=useState("");
  const [adjReason,setAdjReason]=useState("Restock");
  const [editItem,setEditItem]=useState(null);
  const [log,setLog]=useState(()=>ls.get("hotel_inv_log",[]));

  const saveInv=u=>{setInv(u);ls.set("hotel_inv",u);};
  const saveLog=u=>{setLog(u);ls.set("hotel_inv_log",u);};

  const filtered=inv
    .filter(i=>cat==="all"||i.cat===cat)
    .filter(i=>!search||i.name.toLowerCase().includes(search.toLowerCase())||i.supplier.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b)=>sort==="qty"?a.qty-b.qty:sort==="low"?(a.qty/a.min)-(b.qty/b.min):a.name.localeCompare(b.name));

  const lowStock=inv.filter(i=>i.qty<=i.min);
  const totalVal=inv.reduce((s,i)=>s+i.qty*i.cost,0);

  const handleSave=()=>{
    if(!form.name||!form.supplier){addToast("Fill required fields","error");return;}
    const item={...form,qty:+form.qty,min:+form.min,cost:+form.cost};
    let u;
    if(editItem){u=inv.map(i=>i.id===editItem.id?{...i,...item}:i);addToast("Item updated");}
    else{u=[...inv,{...item,id:Date.now()}];addToast("Item added to inventory");}
    saveInv(u);setModal(null);
  };

  const handleAdj=()=>{
    const n=+adjQty;
    if(!adjQty||isNaN(n)){addToast("Enter a valid quantity","error");return;}
    const u=inv.map(i=>i.id===adjItem.id?{...i,qty:Math.max(0,i.qty+n)}:i);
    saveInv(u);
    const entry={id:Date.now(),item:adjItem.name,change:n,reason:adjReason,newQty:Math.max(0,adjItem.qty+n),by:currentUser.name,at:nowStr()};
    saveLog([entry,...log]);
    addToast(`Stock adjusted: ${n>0?"+":""}${n} ${adjItem.unit}`);
    setModal(null);setAdjQty("");
  };

  const openEdit=i=>{setEditItem(i);setForm({name:i.name,cat:i.cat,unit:i.unit,qty:i.qty,min:i.min,cost:i.cost,supplier:i.supplier});setModal("edit");};
  const openAdj=i=>{setAdjItem(i);setAdjQty("");setAdjReason("Restock");setModal("adjust");};

  const numInp={background:T.s2,border:`1px solid ${T.bdr}`,borderRadius:7,color:T.txt,padding:"10px 14px",fontSize:13,width:"100%",outline:"none"};

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20,flexWrap:"wrap",gap:12}}>
        <SectionHead style={{margin:0}}>Inventory Management</SectionHead>
        <div style={{display:"flex",gap:8}}>
          <Btn sm color={T.muted} onClick={()=>setModal("log")}>📋 Adj. Log</Btn>
          <Btn sm color={T.green} onClick={()=>{setEditItem(null);setForm({name:"",cat:"fb",unit:"piece",qty:0,min:5,cost:0,supplier:""});setModal("add");}}>+ Add Item</Btn>
        </div>
      </div>

      {/* Summary */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:13,marginBottom:20}}>
        {[{l:"Total Items",v:inv.length,c:T.gold,i:"📦"},{l:"Low Stock",v:lowStock.length,c:lowStock.length?T.red:T.green,i:"⚠️"},{l:"Total Value",v:`$${totalVal.toFixed(0)}`,c:T.gold,i:"💰"},{l:"Categories",v:Object.keys(INV_CATS).length,c:T.blue,i:"🗂"}].map((s,i)=>(
          <Card key={i} style={{padding:15,borderTop:`3px solid ${s.c}`}}>
            <div style={{fontSize:20,marginBottom:5}}>{s.i}</div>
            <div style={{fontSize:20,fontWeight:"bold",color:s.c}}>{s.v}</div>
            <div style={{fontSize:11,color:T.muted,marginTop:2}}>{s.l}</div>
          </Card>
        ))}
      </div>

      {/* Low stock alert */}
      {lowStock.length>0&&(
        <div style={{background:"#200e00",border:`1px solid ${T.orange}44`,borderRadius:9,padding:14,marginBottom:18}}>
          <div style={{color:T.orange,fontSize:12,fontWeight:"bold",marginBottom:8}}>⚠️ LOW STOCK — {lowStock.length} item{lowStock.length>1?"s":""} need restocking</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
            {lowStock.map(i=>(
              <button key={i.id} onClick={()=>openAdj(i)} style={{background:T.s2,border:`1px solid ${T.orange}44`,color:T.orange,padding:"4px 10px",borderRadius:20,fontSize:11,cursor:"pointer"}}>
                {i.name}: {i.qty}/{i.min} {i.unit}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search item or supplier…" style={{background:T.s2,border:`1px solid ${T.bdr}`,borderRadius:7,color:T.txt,padding:"9px 13px",fontSize:13,width:220,outline:"none"}}/>
        <select value={sort} onChange={e=>setSort(e.target.value)} style={{background:T.s2,border:`1px solid ${T.bdr}`,borderRadius:7,color:T.txt,padding:"9px 12px",fontSize:13,outline:"none"}}>
          <option value="name">Sort: A–Z</option><option value="qty">Sort: Quantity</option><option value="low">Sort: Low First</option>
        </select>
        <div style={{flex:1}}/>
        <div style={{color:T.muted,fontSize:12}}>{filtered.length} items</div>
      </div>

      {/* Category Pills */}
      <div style={{display:"flex",gap:7,marginBottom:18,flexWrap:"wrap"}}>
        <button onClick={()=>setCat("all")} style={{background:cat==="all"?`${T.gold}22`:T.s2,border:`1px solid ${cat==="all"?T.gold:T.bdr}`,color:cat==="all"?T.gold:T.muted,padding:"6px 14px",borderRadius:20,cursor:"pointer",fontSize:12}}>All ({inv.length})</button>
        {Object.entries(INV_CATS).map(([k,v])=>{
          const cnt=inv.filter(i=>i.cat===k).length;
          return <button key={k} onClick={()=>setCat(k)} style={{background:cat===k?`${v.color}22`:T.s2,border:`1px solid ${cat===k?v.color:T.bdr}`,color:cat===k?v.color:T.muted,padding:"6px 14px",borderRadius:20,cursor:"pointer",fontSize:12}}>{v.icon} {v.label} ({cnt})</button>;
        })}
      </div>

      {/* Table */}
      <Card style={{overflow:"hidden"}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead>
            <tr style={{background:T.s2}}>
              {["Item Name","Category","Stock","Min","Cost/Unit","Value","Supplier","Status","Actions"].map(h=>(
                <th key={h} style={{color:T.gold,fontSize:10,letterSpacing:1,padding:"11px 14px",textAlign:"left",borderBottom:`1px solid ${T.bdr}`,fontWeight:"normal"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(item=>{
              const cv=INV_CATS[item.cat];
              const isLow=item.qty<=item.min;
              const pct=Math.min(100,(item.qty/Math.max(item.min*2,1))*100);
              return (
                <tr key={item.id} style={{borderBottom:`1px solid ${T.bdr}`}} onMouseEnter={e=>e.currentTarget.style.background=T.s2} onMouseLeave={e=>e.currentTarget.style.background=""}>
                  <td style={{padding:"10px 14px",color:T.txt,fontSize:13}}>{item.name}</td>
                  <td style={{padding:"10px 14px"}}><span style={{color:cv?.color,fontSize:12}}>{cv?.icon} {cv?.label}</span></td>
                  <td style={{padding:"10px 14px"}}>
                    <div style={{color:isLow?T.red:T.txt,fontWeight:isLow?"bold":"normal",fontSize:13}}>{item.qty} {item.unit}</div>
                    <div style={{background:T.bg,borderRadius:3,height:4,width:80,marginTop:3}}><div style={{background:isLow?T.red:T.green,borderRadius:3,height:4,width:`${pct}%`}}/></div>
                  </td>
                  <td style={{padding:"10px 14px",color:T.muted,fontSize:13}}>{item.min}</td>
                  <td style={{padding:"10px 14px",color:T.txt,fontSize:13}}>${item.cost.toFixed(2)}</td>
                  <td style={{padding:"10px 14px",color:T.gold,fontWeight:"bold",fontSize:13}}>${(item.qty*item.cost).toFixed(2)}</td>
                  <td style={{padding:"10px 14px",color:T.muted,fontSize:12}}>{item.supplier}</td>
                  <td style={{padding:"10px 14px"}}><Badge color={isLow?T.red:T.green}>{isLow?"LOW":"OK"}</Badge></td>
                  <td style={{padding:"10px 14px"}}>
                    <div style={{display:"flex",gap:6}}>
                      <Btn sm color={T.cyan} onClick={()=>openAdj(item)}>±Qty</Btn>
                      <Btn sm color={T.gold} onClick={()=>openEdit(item)}>Edit</Btn>
                      {currentUser.role==="admin"&&<Btn sm color={T.red} onClick={()=>{saveInv(inv.filter(i=>i.id!==item.id));addToast("Item deleted");}}>Del</Btn>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length===0&&<div style={{color:T.muted,textAlign:"center",padding:40}}>No inventory items found</div>}
      </Card>

      {/* Add/Edit Modal */}
      {(modal==="add"||modal==="edit")&&(
        <Modal onClose={()=>setModal(null)} width={540}>
          <ModalHeader title={modal==="add"?"Add Inventory Item":"Edit Item"} onClose={()=>setModal(null)}/>
          <div style={{padding:24,display:"flex",flexDirection:"column",gap:14}}>
            <Inp label="Item Name *" value={form.name} onChange={v=>setForm(f=>({...f,name:v}))} placeholder="e.g. Bath Towel Large"/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              <Inp label="Category" value={form.cat} onChange={v=>setForm(f=>({...f,cat:v}))} options={Object.entries(INV_CATS).map(([k,v2])=>({value:k,label:`${v2.icon} ${v2.label}`}))}/>
              <Inp label="Unit" value={form.unit} onChange={v=>setForm(f=>({...f,unit:v}))} options={["piece","kg","litre","set","pack","pair","tray","bottle","can","ream","bag","carton"]}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
              <div><div style={{color:T.muted,fontSize:10,letterSpacing:1.5,marginBottom:5}}>CURRENT QTY</div><input type="number" value={form.qty} onChange={e=>setForm(f=>({...f,qty:e.target.value}))} style={numInp} min={0}/></div>
              <div><div style={{color:T.muted,fontSize:10,letterSpacing:1.5,marginBottom:5}}>MIN QTY</div><input type="number" value={form.min} onChange={e=>setForm(f=>({...f,min:e.target.value}))} style={numInp} min={0}/></div>
              <div><div style={{color:T.muted,fontSize:10,letterSpacing:1.5,marginBottom:5}}>COST / UNIT ($)</div><input type="number" value={form.cost} onChange={e=>setForm(f=>({...f,cost:e.target.value}))} style={numInp} min={0} step={0.1}/></div>
            </div>
            <Inp label="Supplier *" value={form.supplier} onChange={v=>setForm(f=>({...f,supplier:v}))} placeholder="Supplier name"/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:6}}>
              <Btn color={T.muted} onClick={()=>setModal(null)} full ghost>Cancel</Btn>
              <Btn color={T.green} onClick={handleSave} full>{modal==="add"?"Add Item":"Save Changes"}</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* Adjust Modal */}
      {modal==="adjust"&&adjItem&&(
        <Modal onClose={()=>setModal(null)} width={420}>
          <ModalHeader title="Adjust Stock" onClose={()=>setModal(null)}/>
          <div style={{padding:24}}>
            <div style={{background:T.s2,borderRadius:8,padding:14,marginBottom:18}}>
              <div style={{color:T.txt,fontWeight:"bold",marginBottom:4}}>{adjItem.name}</div>
              <div style={{color:T.muted,fontSize:13}}>Current: <span style={{color:adjItem.qty<=adjItem.min?T.red:T.green,fontWeight:"bold"}}>{adjItem.qty} {adjItem.unit}</span> &nbsp;·&nbsp; Min: {adjItem.min}</div>
            </div>
            <div style={{marginBottom:14}}>
              <div style={{color:T.muted,fontSize:10,letterSpacing:1.5,marginBottom:5}}>QUANTITY CHANGE (+ add / − remove)</div>
              <input type="number" value={adjQty} onChange={e=>setAdjQty(e.target.value)} placeholder="e.g.  20  or  -5" style={numInp}/>
            </div>
            <Inp label="Reason" value={adjReason} onChange={v=>setAdjReason(v)} options={["Restock","Room Usage","Kitchen Usage","Damaged / Spoiled","Transfer Out","Stock Count Correction","Theft / Loss","Other"]} style={{marginBottom:18}}/>
            {adjQty&&!isNaN(+adjQty)&&(
              <div style={{background:"#0a200a",borderRadius:8,padding:12,marginBottom:14,display:"flex",justifyContent:"space-between",fontSize:13}}>
                <span style={{color:T.muted}}>New quantity will be:</span>
                <span style={{color:T.gold,fontWeight:"bold"}}>{Math.max(0,adjItem.qty+(+adjQty))} {adjItem.unit}</span>
              </div>
            )}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <Btn color={T.muted} onClick={()=>setModal(null)} full ghost>Cancel</Btn>
              <Btn color={T.gold} onClick={handleAdj} full>Apply Adjustment</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* Log Modal */}
      {modal==="log"&&(
        <Modal onClose={()=>setModal(null)} width={600}>
          <ModalHeader title="Stock Adjustment Log" onClose={()=>setModal(null)}/>
          <div style={{padding:24,maxHeight:500,overflow:"auto"}}>
            {log.length===0&&<div style={{color:T.muted,textAlign:"center",padding:40}}>No adjustments yet</div>}
            {log.map(e=>(
              <div key={e.id} style={{borderBottom:`1px solid ${T.bdr}`,paddingBottom:10,marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{color:T.txt,fontSize:13,fontWeight:"bold"}}>{e.item}</span>
                  <span style={{color:e.change>0?T.green:T.red,fontSize:13,fontWeight:"bold"}}>{e.change>0?"+":""}{e.change}</span>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:12}}>
                  <span style={{color:T.muted}}>{e.reason} · by {e.by}</span>
                  <span style={{color:T.muted}}>→ {e.newQty} units &nbsp;·&nbsp; {e.at}</span>
                </div>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  RESTAURANT & POS SYSTEM
// ═══════════════════════════════════════════════════════════
function RestaurantPage({rooms, onRoomCharge, addToast, currentUser}){
  const [tab,setTab]=useState("pos");
  const [menu,setMenu]=useState(()=>ls.get("hotel_menu",SEED_MENU));
  const [tables,setTables]=useState(()=>ls.get("hotel_tables",SEED_TABLES));
  const [orders,setOrders]=useState(()=>ls.get("hotel_orders",[]));
  const [mcat,setMcat]=useState("all");
  const [msearch,setMsearch]=useState("");
  const [cart,setCart]=useState([]);
  const [target,setTarget]=useState({type:"table",tableId:null,roomNum:null,walkName:""});
  const [modal,setModal]=useState(null);
  const [selOrder,setSelOrder]=useState(null);
  const [menuForm,setMenuForm]=useState(null);
  const [kFilter,setKFilter]=useState("active");
  const [vegOnly,setVegOnly]=useState(false);

  const saveTables=u=>{setTables(u);ls.set("hotel_tables",u);};
  const saveOrders=u=>{setOrders(u);ls.set("hotel_orders",u);};
  const saveMenu=u=>{setMenu(u);ls.set("hotel_menu",u);};

  const cartSub=cart.reduce((a,c)=>a+c.item.price*c.qty,0);
  const cartSvc=Math.round(cartSub*0.1);
  const cartTotal=cartSub+cartSvc;

  const filtMenu=menu
    .filter(m=>(mcat==="all"||m.cat===mcat)&&(!msearch||m.name.toLowerCase().includes(msearch.toLowerCase()))&&m.avail&&(!vegOnly||m.veg));

  const addToCart=item=>setCart(p=>{const e=p.find(c=>c.item.id===item.id);return e?p.map(c=>c.item.id===item.id?{...c,qty:c.qty+1}:c):[...p,{item,qty:1,note:""}];});
  const rmCart=id=>setCart(p=>p.filter(c=>c.item.id!==id));
  const adjCart=(id,d)=>setCart(p=>p.map(c=>c.item.id===id?{...c,qty:Math.max(1,c.qty+d)}:c));

  const placeOrder=()=>{
    if(!cart.length){addToast("Add items first","error");return;}
    if(target.type==="table"&&!target.tableId){addToast("Select a table","error");return;}
    if(target.type==="room"&&!target.roomNum){addToast("Select a room","error");return;}
    const ordId=`ORD-${Date.now().toString().slice(-6)}`;
    const ord={
      id:ordId,
      items:cart.map(c=>({...c.item,qty:c.qty,note:c.note,sub:c.item.price*c.qty})),
      target:{...target},
      sub:cartSub, svc:cartSvc, total:cartTotal,
      status:"pending",
      placedAt:nowStr(), placedBy:currentUser.name,
    };
    if(target.type==="table") saveTables(tables.map(t=>t.id===target.tableId?{...t,status:"occupied",orderId:ordId}:t));
    if(target.type==="room"){
      onRoomCharge(target.roomNum,{id:Date.now()+Math.random(),name:`Room Service — ${cart.map(c=>c.item.name).slice(0,2).join(", ")}${cart.length>2?"…":""}`,category:"restaurant",qty:1,unitPrice:cartTotal,total:cartTotal,date:nowStr(),note:ordId});
    }
    saveOrders([ord,...orders]);
    setCart([]);
    setTarget({type:"table",tableId:null,roomNum:null,walkName:""});
    addToast(`✓ ${ordId} placed!`);
  };

  const setStatus=(oid,st)=>{
    const upd=orders.map(o=>o.id===oid?{...o,status:st,updatedAt:nowStr()}:o);
    saveOrders(upd);
    if(st==="served"||st==="billed"){
      const o=orders.find(x=>x.id===oid);
      if(o?.target?.type==="table") saveTables(tables.map(t=>t.id===o.target.tableId?{...t,status:"cleaning",orderId:null}:t));
    }
    if(selOrder?.id===oid) setSelOrder(p=>({...p,status:st}));
    addToast(`Order ${oid} → ${st}`);
  };

  const ST_COLOR={pending:T.orange,preparing:T.blue,ready:T.green,served:T.muted,billed:T.gold,cancelled:T.red};

  const RTABS=[
    {id:"pos",label:"🛒 New Order",roles:["admin","manager","frontdesk","restaurant"]},
    {id:"tables",label:"🪑 Tables",roles:["admin","manager","frontdesk","restaurant"]},
    {id:"kitchen",label:"👨‍🍳 Kitchen",roles:["admin","manager","restaurant"]},
    {id:"orders",label:"📋 Orders",roles:["admin","manager","frontdesk","restaurant"]},
    {id:"menu",label:"📖 Menu",roles:["admin","manager","restaurant"]},
  ].filter(t=>t.roles.includes(currentUser.role));

  const occupiedRooms=rooms.filter(r=>r.status==="occupied");

  return (
    <div>
      <SectionHead>Restaurant & POS</SectionHead>
      <div style={{display:"flex",gap:0,borderBottom:`1px solid ${T.bdr}`,marginBottom:22,overflowX:"auto"}}>
        {RTABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{background:"none",border:"none",borderBottom:tab===t.id?`2px solid ${T.gold}`:"2px solid transparent",color:tab===t.id?T.gold:T.muted,padding:"10px 18px",cursor:"pointer",fontSize:13,whiteSpace:"nowrap",transition:"all .15s",marginBottom:-1}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── POS ── */}
      {tab==="pos"&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 360px",gap:18,height:"calc(100vh-230px)",minHeight:500}}>
          {/* Left: Menu browser */}
          <div style={{display:"flex",flexDirection:"column",overflow:"hidden",gap:12}}>
            {/* Order Target */}
            <Card style={{padding:14}}>
              <div style={{display:"flex",gap:16,alignItems:"center",flexWrap:"wrap"}}>
                <span style={{color:T.muted,fontSize:12,letterSpacing:1}}>ORDER FOR:</span>
                {[{v:"table",l:"🪑 Table"},{v:"room",l:"🏨 Room Service"},{v:"walkin",l:"🚶 Walk-In"}].map(opt=>(
                  <label key={opt.v} style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",color:target.type===opt.v?T.gold:T.muted,fontSize:13}}>
                    <input type="radio" name="ot" value={opt.v} checked={target.type===opt.v} onChange={()=>setTarget({type:opt.v,tableId:null,roomNum:null,walkName:""})} style={{accentColor:T.gold}}/>{opt.l}
                  </label>
                ))}
                {target.type==="table"&&(
                  <select value={target.tableId||""} onChange={e=>setTarget(t=>({...t,tableId:+e.target.value||null}))}
                    style={{background:T.s2,border:`1px solid ${T.bdr}`,borderRadius:7,color:T.txt,padding:"7px 12px",fontSize:12,outline:"none"}}>
                    <option value="">— Select table —</option>
                    {tables.map(t=><option key={t.id} value={t.id} disabled={t.status==="occupied"}>{t.no} ({t.section}, {t.cap}p){t.status==="occupied"?" ●":""}</option>)}
                  </select>
                )}
                {target.type==="room"&&(
                  <select value={target.roomNum||""} onChange={e=>setTarget(t=>({...t,roomNum:e.target.value||null}))}
                    style={{background:T.s2,border:`1px solid ${T.bdr}`,borderRadius:7,color:T.txt,padding:"7px 12px",fontSize:12,outline:"none"}}>
                    <option value="">— Select room —</option>
                    {occupiedRooms.map(r=><option key={r.id} value={r.number}>Room {r.number} — {r.guest}</option>)}
                  </select>
                )}
                {target.type==="walkin"&&(
                  <input value={target.walkName} onChange={e=>setTarget(t=>({...t,walkName:e.target.value}))} placeholder="Guest name (optional)"
                    style={{background:T.s2,border:`1px solid ${T.bdr}`,borderRadius:7,color:T.txt,padding:"7px 12px",fontSize:12,outline:"none",width:180}}/>
                )}
              </div>
            </Card>

            {/* Menu filters */}
            <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
              <input value={msearch} onChange={e=>setMsearch(e.target.value)} placeholder="Search menu…"
                style={{background:T.s2,border:`1px solid ${T.bdr}`,borderRadius:7,color:T.txt,padding:"8px 13px",fontSize:12,outline:"none",width:170}}/>
              <label style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",color:vegOnly?T.green:T.muted,fontSize:12}}>
                <input type="checkbox" checked={vegOnly} onChange={e=>setVegOnly(e.target.checked)} style={{accentColor:T.green}}/>🌿 Veg only
              </label>
              <button onClick={()=>setMcat("all")} style={{background:mcat==="all"?`${T.gold}22`:T.s2,border:`1px solid ${mcat==="all"?T.gold:T.bdr}`,color:mcat==="all"?T.gold:T.muted,padding:"7px 13px",borderRadius:20,cursor:"pointer",fontSize:12}}>All</button>
              {Object.entries(MENU_CATS).map(([k,v])=>(
                <button key={k} onClick={()=>setMcat(k)} style={{background:mcat===k?`${v.color}20`:T.s2,border:`1px solid ${mcat===k?v.color:T.bdr}`,color:mcat===k?v.color:T.muted,padding:"7px 13px",borderRadius:20,cursor:"pointer",fontSize:12}}>{v.icon} {v.label}</button>
              ))}
            </div>

            {/* Menu Grid */}
            <div style={{flex:1,overflow:"auto",display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",gap:9,alignContent:"start"}}>
              {filtMenu.map(item=>{
                const cd=MENU_CATS[item.cat];
                const inC=cart.find(c=>c.item.id===item.id);
                return (
                  <div key={item.id} onClick={()=>addToCart(item)}
                    style={{background:inC?`${cd.color}15`:T.s1,border:`1px solid ${inC?cd.color+"55":T.bdr}`,borderRadius:9,padding:13,cursor:"pointer",transition:"all .15s",position:"relative"}}
                    onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow=`0 6px 20px ${cd.color}20`;}}
                    onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="";}}>
                    {item.popular&&<span style={{position:"absolute",top:8,right:8,fontSize:9,background:`${T.gold}22`,color:T.gold,padding:"1px 5px",borderRadius:6}}>★ HOT</span>}
                    {item.veg&&<span style={{position:"absolute",top:8,left:8,fontSize:9,background:`${T.green}22`,color:T.green,padding:"1px 5px",borderRadius:6}}>🌿</span>}
                    <div style={{fontSize:18,marginBottom:5}}>{cd.icon}</div>
                    <div style={{color:T.txt,fontSize:13,fontWeight:"bold",marginBottom:3,lineHeight:1.3}}>{item.name}</div>
                    <div style={{color:T.muted,fontSize:11,marginBottom:8,lineHeight:1.4}}>{item.desc}</div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span style={{color:T.gold,fontWeight:"bold",fontSize:15}}>${item.price}</span>
                      <span style={{color:T.muted,fontSize:10}}>~{item.prep}min</span>
                    </div>
                    {inC&&<div style={{marginTop:6,color:cd.color,fontSize:11,fontWeight:"bold"}}>In order: {inC.qty}</div>}
                  </div>
                );
              })}
              {filtMenu.length===0&&<div style={{color:T.muted,gridColumn:"1/-1",textAlign:"center",padding:40}}>No items found</div>}
            </div>
          </div>

          {/* Right: Cart */}
          <div style={{display:"flex",flexDirection:"column",background:T.s1,border:`1px solid ${T.bdr}`,borderRadius:10,overflow:"hidden"}}>
            <div style={{padding:"14px 18px",borderBottom:`1px solid ${T.bdr}`,background:T.s2,color:T.gold,fontSize:13,letterSpacing:1}}>🛒 ORDER SUMMARY</div>
            <div style={{flex:1,overflow:"auto",padding:"14px 18px"}}>
              {cart.length===0&&<div style={{color:T.muted,textAlign:"center",padding:"50px 0",fontSize:13}}>Select items from the menu<br/><span style={{fontSize:24,display:"block",marginTop:12}}>🍽️</span></div>}
              {cart.map(c=>(
                <div key={c.item.id} style={{borderBottom:`1px solid ${T.bdr}`,paddingBottom:12,marginBottom:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                    <div style={{flex:1,paddingRight:8}}>
                      <div style={{color:T.txt,fontSize:13,fontWeight:"bold",lineHeight:1.3}}>{c.item.name}</div>
                      <div style={{color:T.gold,fontSize:12,marginTop:1}}>${c.item.price} each</div>
                    </div>
                    <button onClick={()=>rmCart(c.item.id)} style={{background:"none",border:"none",color:T.red,cursor:"pointer",fontSize:18,lineHeight:1,padding:"0 2px"}}>×</button>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <button onClick={()=>adjCart(c.item.id,-1)} style={{background:T.s2,border:`1px solid ${T.bdr}`,color:T.txt,width:26,height:26,borderRadius:5,cursor:"pointer",fontSize:16,lineHeight:1}}>−</button>
                      <span style={{color:T.txt,fontWeight:"bold",minWidth:18,textAlign:"center"}}>{c.qty}</span>
                      <button onClick={()=>adjCart(c.item.id,1)} style={{background:T.s2,border:`1px solid ${T.bdr}`,color:T.txt,width:26,height:26,borderRadius:5,cursor:"pointer",fontSize:16,lineHeight:1}}>+</button>
                    </div>
                    <span style={{color:T.gold,fontWeight:"bold",fontSize:14}}>${c.item.price*c.qty}</span>
                  </div>
                  <input value={c.note} onChange={e=>setCart(p=>p.map(x=>x.item.id===c.item.id?{...x,note:e.target.value}:x))}
                    placeholder="Special request…"
                    style={{marginTop:6,background:T.bg,border:`1px solid ${T.bdr}`,borderRadius:5,color:T.muted,padding:"5px 9px",fontSize:11,width:"100%",outline:"none"}}/>
                </div>
              ))}
            </div>
            {cart.length>0&&(
              <div style={{padding:"14px 18px",borderTop:`1px solid ${T.bdr}`,background:T.s2}}>
                <div style={{marginBottom:8}}>
                  {[["Subtotal",`$${cartSub}`],["Service (10%)",`$${cartSvc}`]].map(([k,v])=>(
                    <div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:4}}>
                      <span style={{color:T.muted}}>{k}</span><span style={{color:T.txt}}>{v}</span>
                    </div>
                  ))}
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:16,fontWeight:"bold",borderTop:`1px solid ${T.gold}44`,paddingTop:8,marginTop:4}}>
                    <span style={{color:T.gold}}>TOTAL</span><span style={{color:T.gold}}>${cartTotal}</span>
                  </div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  <Btn color={T.green} onClick={placeOrder} full>✅ Place Order</Btn>
                  <Btn color={T.red} onClick={()=>setCart([])} full ghost>🗑 Clear Cart</Btn>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TABLES ── */}
      {tab==="tables"&&(
        <div>
          {["Indoor A","Indoor B","Terrace","Private"].map(sec=>(
            <div key={sec} style={{marginBottom:24}}>
              <div style={{color:T.gold,fontSize:12,letterSpacing:2,marginBottom:12,borderBottom:`1px solid ${T.bdr}`,paddingBottom:6}}>📍 {sec.toUpperCase()}</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(185px,1fr))",gap:10}}>
                {tables.filter(t=>t.section===sec).map(t=>{
                  const sc=t.status==="available"?T.green:t.status==="occupied"?T.red:t.status==="reserved"?T.orange:T.muted;
                  const rel=orders.find(o=>o.id===t.orderId);
                  return (
                    <div key={t.id} style={{background:T.s1,border:`1px solid ${sc}44`,borderRadius:9,padding:16,borderLeft:`4px solid ${sc}`}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                        <span style={{color:T.txt,fontWeight:"bold",fontSize:16}}>{t.no}</span>
                        <Badge color={sc}>{t.status}</Badge>
                      </div>
                      <div style={{color:T.muted,fontSize:12,marginBottom:10}}>👥 {t.cap} seats</div>
                      {rel&&(
                        <div style={{fontSize:12,marginBottom:8,background:T.s2,borderRadius:6,padding:"8px 10px"}}>
                          <div style={{color:ST_COLOR[rel.status]||T.muted,fontWeight:"bold",marginBottom:3}}>● {rel.status.toUpperCase()}</div>
                          <div style={{color:T.muted}}>{rel.items.length} items · ${rel.total}</div>
                          <div style={{color:T.muted,fontSize:11,marginTop:2}}>{rel.placedAt}</div>
                        </div>
                      )}
                      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                        {t.status==="available"&&<Btn sm color={T.green} onClick={()=>{setTab("pos");setTarget({type:"table",tableId:t.id,roomNum:null,walkName:""});}}>Order</Btn>}
                        {t.status==="available"&&<Btn sm color={T.orange} onClick={()=>saveTables(tables.map(x=>x.id===t.id?{...x,status:"reserved"}:x))}>Reserve</Btn>}
                        {t.status==="reserved"&&<Btn sm color={T.green} onClick={()=>saveTables(tables.map(x=>x.id===t.id?{...x,status:"available"}:x))}>Free</Btn>}
                        {t.status==="occupied"&&rel&&<Btn sm color={T.blue} onClick={()=>{setSelOrder(rel);setModal("vieworder");}}>View</Btn>}
                        {(t.status==="occupied"||t.status==="cleaning")&&<Btn sm color={T.orange} onClick={()=>saveTables(tables.map(x=>x.id===t.id?{...x,status:"available",orderId:null}:x))}>Clear</Btn>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── KITCHEN DISPLAY ── */}
      {tab==="kitchen"&&(
        <div>
          <div style={{display:"flex",gap:8,marginBottom:18,flexWrap:"wrap"}}>
            {["active","pending","preparing","ready","all"].map(f=>{
              const cnt=f==="active"?orders.filter(o=>["pending","preparing","ready"].includes(o.status)).length
                       :f==="all"?orders.length:orders.filter(o=>o.status===f).length;
              return <button key={f} onClick={()=>setKFilter(f)} style={{background:kFilter===f?(ST_COLOR[f]||T.gold)+"25":T.s2,border:`1px solid ${kFilter===f?(ST_COLOR[f]||T.gold):T.bdr}`,color:kFilter===f?(ST_COLOR[f]||T.gold):T.muted,padding:"7px 16px",borderRadius:20,cursor:"pointer",fontSize:12}}>
                {f==="active"?"🔥 Active":f==="all"?"All":f.charAt(0).toUpperCase()+f.slice(1)} ({cnt})
              </button>;
            })}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(295px,1fr))",gap:14}}>
            {orders.filter(o=>kFilter==="active"?["pending","preparing","ready"].includes(o.status):kFilter==="all"?true:o.status===kFilter).map(ord=>(
              <div key={ord.id} style={{background:T.s1,border:`2px solid ${ST_COLOR[ord.status]||T.bdr}`,borderRadius:10,padding:18}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
                  <div>
                    <div style={{color:T.gold,fontWeight:"bold",fontSize:14}}>{ord.id}</div>
                    <div style={{color:T.muted,fontSize:12,marginTop:2}}>
                      {ord.target.type==="table"?`Table ${tables.find(t=>t.id===ord.target.tableId)?.no||"?"}`:ord.target.type==="room"?`Room ${ord.target.roomNum}`:`Walk-in${ord.target.walkName?" — "+ord.target.walkName:""}`}
                    </div>
                  </div>
                  <Badge color={ST_COLOR[ord.status]||T.muted}>{ord.status.toUpperCase()}</Badge>
                </div>
                <div style={{borderBottom:`1px solid ${T.bdr}`,paddingBottom:10,marginBottom:10}}>
                  {ord.items.map((it,i)=>(
                    <div key={i} style={{display:"flex",gap:8,fontSize:13,padding:"3px 0"}}>
                      <span style={{color:T.gold,fontWeight:"bold",minWidth:20}}>{it.qty}×</span>
                      <span style={{color:T.txt}}>{it.name}</span>
                      {it.note&&<span style={{color:T.muted,fontSize:11}}>({it.note})</span>}
                    </div>
                  ))}
                </div>
                <div style={{color:T.muted,fontSize:11,marginBottom:12}}>
                  {ord.placedAt} · by {ord.placedBy}
                </div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {ord.status==="pending"&&<Btn sm color={T.blue} onClick={()=>setStatus(ord.id,"preparing")} style={{flex:1}}>👨‍🍳 Start Prep</Btn>}
                  {ord.status==="preparing"&&<Btn sm color={T.green} onClick={()=>setStatus(ord.id,"ready")} style={{flex:1}}>✅ Mark Ready</Btn>}
                  {ord.status==="ready"&&<Btn sm color={T.muted} onClick={()=>setStatus(ord.id,"served")} style={{flex:1}}>🍽 Served</Btn>}
                  {ord.status!=="billed"&&ord.status!=="cancelled"&&<Btn sm color={T.gold} onClick={()=>{setSelOrder(ord);setModal("vieworder");}} style={{flexShrink:0}}>View</Btn>}
                </div>
              </div>
            ))}
            {orders.filter(o=>kFilter==="active"?["pending","preparing","ready"].includes(o.status):kFilter==="all"?true:o.status===kFilter).length===0&&(
              <div style={{color:T.muted,gridColumn:"1/-1",textAlign:"center",padding:60,fontSize:15}}>✅ {kFilter==="active"?"Kitchen clear — no active orders":"No orders"}</div>
            )}
          </div>
        </div>
      )}

      {/* ── ORDER HISTORY ── */}
      {tab==="orders"&&(
        <div>
          {orders.length===0?<div style={{color:T.muted,textAlign:"center",padding:60}}>No orders yet</div>:(
            <Card style={{overflow:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead>
                  <tr style={{background:T.s2}}>
                    {["Order ID","For","Items","Sub","Svc","Total","Status","Placed By","Time","Actions"].map(h=>(
                      <th key={h} style={{color:T.gold,fontSize:10,letterSpacing:1,padding:"11px 12px",textAlign:"left",borderBottom:`1px solid ${T.bdr}`,fontWeight:"normal"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map(ord=>(
                    <tr key={ord.id} style={{borderBottom:`1px solid ${T.bdr}`}} onMouseEnter={e=>e.currentTarget.style.background=T.s2} onMouseLeave={e=>e.currentTarget.style.background=""}>
                      <td style={{padding:"9px 12px",color:T.gold,fontWeight:"bold",fontSize:12}}>{ord.id}</td>
                      <td style={{padding:"9px 12px",color:T.txt,fontSize:12}}>
                        {ord.target.type==="table"?`${tables.find(t=>t.id===ord.target.tableId)?.no||"T?"}`:ord.target.type==="room"?`Rm ${ord.target.roomNum}`:"Walk-in"}
                      </td>
                      <td style={{padding:"9px 12px",color:T.muted,fontSize:12}}>{ord.items.length}</td>
                      <td style={{padding:"9px 12px",color:T.txt,fontSize:12}}>${ord.sub}</td>
                      <td style={{padding:"9px 12px",color:T.muted,fontSize:12}}>${ord.svc}</td>
                      <td style={{padding:"9px 12px",color:T.gold,fontWeight:"bold"}}>${ord.total}</td>
                      <td style={{padding:"9px 12px"}}><Badge color={ST_COLOR[ord.status]||T.muted}>{ord.status}</Badge></td>
                      <td style={{padding:"9px 12px",color:T.muted,fontSize:12}}>{ord.placedBy}</td>
                      <td style={{padding:"9px 12px",color:T.muted,fontSize:11}}>{ord.placedAt}</td>
                      <td style={{padding:"9px 12px"}}>
                        <div style={{display:"flex",gap:5}}>
                          <Btn sm color={T.blue} onClick={()=>{setSelOrder(ord);setModal("vieworder");}}>View</Btn>
                          {ord.status==="ready"&&<Btn sm color={T.green} onClick={()=>setStatus(ord.id,"served")}>Serve</Btn>}
                          {ord.status==="served"&&<Btn sm color={T.gold} onClick={()=>setStatus(ord.id,"billed")}>Bill</Btn>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      )}

      {/* ── MENU MANAGEMENT ── */}
      {tab==="menu"&&["admin","manager","restaurant"].includes(currentUser.role)&&(
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
            <div style={{color:T.mutedL,fontSize:13}}>{menu.length} menu items · {menu.filter(m=>m.avail).length} active</div>
            <Btn color={T.green} sm onClick={()=>setMenuForm({id:`m${Date.now()}`,name:"",cat:"mains",price:0,desc:"",prep:20,avail:true,popular:false,veg:false})}>+ Add Item</Btn>
          </div>
          <div style={{display:"flex",gap:7,marginBottom:16,flexWrap:"wrap"}}>
            <button onClick={()=>setMcat("all")} style={{background:mcat==="all"?`${T.gold}22`:T.s2,border:`1px solid ${mcat==="all"?T.gold:T.bdr}`,color:mcat==="all"?T.gold:T.muted,padding:"6px 13px",borderRadius:20,cursor:"pointer",fontSize:12}}>All</button>
            {Object.entries(MENU_CATS).map(([k,v])=>(
              <button key={k} onClick={()=>setMcat(k)} style={{background:mcat===k?`${v.color}20`:T.s2,border:`1px solid ${mcat===k?v.color:T.bdr}`,color:mcat===k?v.color:T.muted,padding:"6px 13px",borderRadius:20,cursor:"pointer",fontSize:12}}>{v.icon} {v.label}</button>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(275px,1fr))",gap:10}}>
            {menu.filter(m=>mcat==="all"||m.cat===mcat).map(item=>{
              const cd=MENU_CATS[item.cat];
              return (
                <Card key={item.id} style={{padding:16,opacity:item.avail?1:.55}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                    <span style={{color:cd.color,fontSize:12}}>{cd.icon} {cd.label}</span>
                    <div style={{display:"flex",gap:6}}>
                      {item.popular&&<Badge color={T.gold}>★</Badge>}
                      {item.veg&&<Badge color={T.green}>🌿</Badge>}
                      <Badge color={item.avail?T.green:T.red}>{item.avail?"On":"Off"}</Badge>
                    </div>
                  </div>
                  <div style={{color:T.txt,fontWeight:"bold",fontSize:14,marginBottom:4}}>{item.name}</div>
                  <div style={{color:T.muted,fontSize:11,marginBottom:8,lineHeight:1.4}}>{item.desc}</div>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
                    <span style={{color:T.gold,fontWeight:"bold",fontSize:15}}>${item.price}</span>
                    <span style={{color:T.muted,fontSize:12}}>~{item.prep} min</span>
                  </div>
                  <div style={{display:"flex",gap:7}}>
                    <Btn sm color={T.blue} onClick={()=>setMenuForm({...item})} style={{flex:1}}>Edit</Btn>
                    <Btn sm color={item.avail?T.orange:T.green} onClick={()=>saveMenu(menu.map(m=>m.id===item.id?{...m,avail:!m.avail}:m))} style={{flex:1}}>{item.avail?"Disable":"Enable"}</Btn>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* View Order Modal */}
      {modal==="vieworder"&&selOrder&&(
        <Modal onClose={()=>setModal(null)} width={460}>
          <ModalHeader title={`Order ${selOrder.id}`} onClose={()=>setModal(null)}/>
          <div style={{padding:22}}>
            <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
              <Badge color={ST_COLOR[selOrder.status]||T.muted}>{selOrder.status.toUpperCase()}</Badge>
              <span style={{color:T.muted,fontSize:12,alignSelf:"center"}}>
                {selOrder.target.type==="table"?`Table ${tables.find(t=>t.id===selOrder.target.tableId)?.no||"?"}`:selOrder.target.type==="room"?`Room ${selOrder.target.roomNum}`:"Walk-in"}
              </span>
            </div>
            {selOrder.items.map((it,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${T.bdr}`,fontSize:13}}>
                <div>
                  <span style={{color:T.txt}}>{it.qty}× {it.name}</span>
                  {it.note&&<div style={{color:T.muted,fontSize:11,marginTop:2}}>Note: {it.note}</div>}
                </div>
                <span style={{color:T.gold,fontWeight:"bold"}}>${it.sub}</span>
              </div>
            ))}
            <div style={{marginTop:14}}>
              {[["Subtotal",`$${selOrder.sub}`],["Service Charge",`$${selOrder.svc}`]].map(([k,v])=>(
                <div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:13,padding:"3px 0"}}><span style={{color:T.muted}}>{k}</span><span style={{color:T.txt}}>{v}</span></div>
              ))}
              <div style={{display:"flex",justifyContent:"space-between",fontSize:16,fontWeight:"bold",borderTop:`1px solid ${T.gold}44`,marginTop:8,paddingTop:10}}>
                <span style={{color:T.gold}}>TOTAL</span><span style={{color:T.gold}}>${selOrder.total}</span>
              </div>
            </div>
            <div style={{color:T.muted,fontSize:11,margin:"14px 0"}}>Placed: {selOrder.placedAt} · by {selOrder.placedBy}</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {selOrder.status==="pending"&&<Btn color={T.blue} onClick={()=>setStatus(selOrder.id,"preparing")}>Start Preparing</Btn>}
              {selOrder.status==="preparing"&&<Btn color={T.green} onClick={()=>setStatus(selOrder.id,"ready")}>Mark Ready</Btn>}
              {selOrder.status==="ready"&&<Btn color={T.muted} onClick={()=>setStatus(selOrder.id,"served")}>Mark Served</Btn>}
              {selOrder.status==="served"&&<Btn color={T.gold} onClick={()=>setStatus(selOrder.id,"billed")}>Mark Billed</Btn>}
              {!["cancelled","billed"].includes(selOrder.status)&&<Btn color={T.red} onClick={()=>setStatus(selOrder.id,"cancelled")}>Cancel</Btn>}
            </div>
          </div>
        </Modal>
      )}

      {/* Menu Edit Modal */}
      {menuForm&&(
        <Modal onClose={()=>setMenuForm(null)} width={480}>
          <ModalHeader title={menu.find(m=>m.id===menuForm.id)?"Edit Menu Item":"Add Menu Item"} onClose={()=>setMenuForm(null)}/>
          <div style={{padding:22,display:"flex",flexDirection:"column",gap:14}}>
            <Inp label="Item Name" value={menuForm.name} onChange={v=>setMenuForm(f=>({...f,name:v}))} placeholder="Dish name"/>
            <Inp label="Category" value={menuForm.cat} onChange={v=>setMenuForm(f=>({...f,cat:v}))} options={Object.entries(MENU_CATS).map(([k,v])=>({value:k,label:`${v.icon} ${v.label}`}))}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              <div><div style={{color:T.muted,fontSize:10,letterSpacing:1.5,marginBottom:5}}>PRICE ($)</div><input type="number" value={menuForm.price} onChange={e=>setMenuForm(f=>({...f,price:+e.target.value}))} style={{background:T.s2,border:`1px solid ${T.bdr}`,borderRadius:7,color:T.txt,padding:"10px 14px",fontSize:13,width:"100%",outline:"none"}} min={0}/></div>
              <div><div style={{color:T.muted,fontSize:10,letterSpacing:1.5,marginBottom:5}}>PREP TIME (min)</div><input type="number" value={menuForm.prep} onChange={e=>setMenuForm(f=>({...f,prep:+e.target.value}))} style={{background:T.s2,border:`1px solid ${T.bdr}`,borderRadius:7,color:T.txt,padding:"10px 14px",fontSize:13,width:"100%",outline:"none"}} min={1}/></div>
            </div>
            <Inp label="Description" value={menuForm.desc} onChange={v=>setMenuForm(f=>({...f,desc:v}))} placeholder="Brief description…"/>
            <div style={{display:"flex",gap:20,flexWrap:"wrap"}}>
              {[["avail","Available"],["popular","★ Popular"],["veg","🌿 Vegetarian"]].map(([k,l])=>(
                <label key={k} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",color:T.txt,fontSize:13}}>
                  <input type="checkbox" checked={menuForm[k]} onChange={e=>setMenuForm(f=>({...f,[k]:e.target.checked}))} style={{accentColor:T.gold}}/>{l}
                </label>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:4}}>
              <Btn color={T.muted} onClick={()=>setMenuForm(null)} full ghost>Cancel</Btn>
              <Btn color={T.green} onClick={()=>{
                const ex=menu.find(m=>m.id===menuForm.id);
                if(!menuForm.name){addToast("Enter item name","error");return;}
                saveMenu(ex?menu.map(m=>m.id===menuForm.id?menuForm:m):[...menu,menuForm]);
                setMenuForm(null);addToast(`Menu item ${ex?"updated":"added"}`);
              }} full>Save Item</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  ROOMS MANAGEMENT (modal-based)
// ═══════════════════════════════════════════════════════════
const SVC_CATALOG = {
  restaurant: { label:"Restaurant", icon:"🍽️", color:T.red, items:[
    {id:"r1",name:"Continental Breakfast",price:18},{id:"r2",name:"Full English",price:24},{id:"r3",name:"Club Sandwich",price:16},
    {id:"r4",name:"Grilled Chicken",price:28},{id:"r5",name:"Ribeye Steak",price:48},{id:"r6",name:"Pasta Carbonara",price:22},
    {id:"r7",name:"Jollof Rice",price:20},{id:"r8",name:"Caesar Salad",price:14},{id:"r9",name:"Wine (bottle)",price:45},
    {id:"r10",name:"Cocktail",price:18},{id:"r11",name:"Coffee/Tea",price:5},{id:"r12",name:"Dessert",price:12}] },
  minibar: { label:"Mini Bar", icon:"🥃", color:T.purple, items:[
    {id:"mb1",name:"Whiskey 50ml",price:12},{id:"mb2",name:"Craft Beer",price:8},{id:"mb3",name:"Sparkling Water",price:4},
    {id:"mb4",name:"Soda",price:5},{id:"mb5",name:"Mixed Nuts",price:7},{id:"mb6",name:"Chocolate Bar",price:6}] },
  laundry: { label:"Laundry", icon:"👔", color:T.blue, items:[
    {id:"la1",name:"Shirt (Wash & Iron)",price:6},{id:"la2",name:"Trousers",price:8},{id:"la3",name:"Suit (Dry Clean)",price:22},
    {id:"la4",name:"Dress",price:18},{id:"la5",name:"Express Service",price:35},{id:"la6",name:"Full Bag",price:28}] },
  spa: { label:"Spa & Wellness", icon:"💆", color:T.pink, items:[
    {id:"sp1",name:"Swedish Massage 60min",price:90},{id:"sp2",name:"Deep Tissue",price:110},{id:"sp3",name:"Hot Stone",price:130},
    {id:"sp4",name:"Facial",price:85},{id:"sp5",name:"Manicure & Pedicure",price:60},{id:"sp6",name:"Couple Package",price:220}] },
  gym: { label:"Gym & Fitness", icon:"🏋️", color:T.green, items:[
    {id:"gy1",name:"Personal Training",price:65},{id:"gy2",name:"Yoga Class",price:35},
    {id:"gy3",name:"Pool Access (Day)",price:20},{id:"gy4",name:"Tennis Court 1hr",price:40}] },
  transport: { label:"Transport", icon:"🚗", color:T.orange, items:[
    {id:"tr1",name:"Airport Transfer",price:55},{id:"tr2",name:"City Tour Half Day",price:80},
    {id:"tr3",name:"Car Rental/Day",price:95},{id:"tr4",name:"Parking/Day",price:25}] },
  other: { label:"Other Charges", icon:"✨", color:T.mutedL, items:[
    {id:"ot1",name:"Extra Bed",price:40},{id:"ot2",name:"Late Checkout",price:50},
    {id:"ot3",name:"Lost Key",price:25},{id:"ot4",name:"Flowers / Decoration",price:45},{id:"ot5",name:"Wi-Fi Premium/Day",price:10}] },
};

const HK_TASKS = ["Full Room Cleaning","Turndown Service","Extra Towels","Extra Pillows","Room Sanitization","Bathroom Deep Clean","Change Bed Linen","Carpet Cleaning"];

function RoomModal({room, onClose, onUpdate, settings, addToast}) {
  const [tab, setTab] = useState("overview");
  const [svcCat, setSvcCat] = useState("restaurant");
  const [svcQty, setSvcQty] = useState({});
  const [hkSel, setHkSel] = useState([]);
  const [hkNote, setHkNote] = useState("");
  const [wakeT, setWakeT] = useState(room.wakeUp || "");

  const rt = ROOM_TYPES[room.type];
  const rs = ROOM_STATUS[room.status];
  const ns = room.checkIn && room.checkOut ? nights(room.checkIn, room.checkOut) : 1;
  const roomCharge = rt.price * ns;
  const svcTotal = (room.charges || []).reduce((a, c) => a + c.total, 0);
  const sub = roomCharge + svcTotal;
  const tax = Math.round(sub * (settings.taxRate / 100));
  const svc = Math.round(sub * (settings.serviceCharge / 100));
  const grandTotal = sub + tax + svc;

  const postCharges = () => {
    const newC = [];
    Object.entries(svcQty).forEach(([id, qty]) => {
      if (!qty || qty <= 0) return;
      for (const [cat, cv] of Object.entries(SVC_CATALOG)) {
        const item = cv.items.find(x => x.id === id);
        if (item) { newC.push({ id: Date.now() + Math.random(), itemId: id, name: item.name, category: cat, qty: +qty, unitPrice: item.price, total: item.price * +qty, date: nowStr() }); break; }
      }
    });
    if (!newC.length) { addToast("Select at least one item", "error"); return; }
    const upd = [...(room.charges || []), ...newC];
    onUpdate({ charges: upd });
    setSvcQty({});
    addToast(`✓ ${newC.length} charge(s) posted to Room ${room.number}`);
  };

  const addHK = () => {
    if (!hkSel.length) { addToast("Select a task", "error"); return; }
    const e = { id: Date.now(), tasks: hkSel, note: hkNote, at: nowStr(), status: "pending" };
    onUpdate({ hk: [...(room.hk || []), e] });
    setHkSel([]); setHkNote(""); addToast(`✓ Housekeeping request submitted`);
  };

  const inpS = { background: T.bg, border: `1px solid ${T.bdr}`, borderRadius: 6, color: T.txt, padding: "8px 12px", fontSize: 12, width: "100%", outline: "none" };

  return (
    <Modal onClose={onClose} width={720}>
      {/* Header */}
      <div style={{ padding: "18px 24px", borderBottom: `1px solid ${T.bdr}`, background: `linear-gradient(135deg,${T.s2},${T.s1})`, display: "flex", alignItems: "center", gap: 16 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: "bold", color: T.gold }}>Room {room.number}</div>
          <div style={{ color: rt.color, fontSize: 12, marginTop: 2 }}>{rt.label} · {rt.beds} · Floor {room.floor} · {settings.currency}{rt.price}/night</div>
        </div>
        <div style={{ flex: 1 }} />
        <Badge color={rs.color}>{rs.label}</Badge>
        {room.dnd && <Badge color={T.red}>🔕 DND</Badge>}
        {room.wakeUp && <Badge color={T.green}>⏰ {room.wakeUp}</Badge>}
        <button onClick={onClose} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 22 }}>×</button>
      </div>

      {/* Quick Actions */}
      <div style={{ padding: "12px 24px", borderBottom: `1px solid ${T.bdr}`, display: "flex", gap: 8, flexWrap: "wrap", background: T.s2 }}>
        {room.status === "occupied" && <>
          <Btn sm color={T.red} onClick={() => { setTab("checkout"); }}>🔑 Check Out</Btn>
          <Btn sm color={T.gold} onClick={() => setTab("invoice")}>💰 Invoice</Btn>
          <Btn sm color={room.dnd ? T.green : T.red} onClick={() => { onUpdate({ dnd: !room.dnd }); addToast(room.dnd ? "DND cleared" : "🔕 DND enabled"); }}>
            {room.dnd ? "✅ Clear DND" : "🔕 DND"}
          </Btn>
        </>}
        {room.status === "available" && <>
          <Btn sm color={T.green} onClick={() => setTab("checkin")}>✅ Check In</Btn>
          <Btn sm color={T.orange} onClick={() => { onUpdate({ status: "reserved" }); addToast("Room reserved"); onClose(); }}>📌 Reserve</Btn>
          <Btn sm color={T.muted} onClick={() => { onUpdate({ status: "maintenance" }); addToast("Set to maintenance"); onClose(); }}>🔧 Maintenance</Btn>
        </>}
        {room.status === "reserved" && <>
          <Btn sm color={T.green} onClick={() => setTab("checkin")}>✅ Check In</Btn>
          <Btn sm color={T.red} onClick={() => { onUpdate({ status: "available" }); addToast("Reservation cancelled"); onClose(); }}>❌ Cancel Reservation</Btn>
        </>}
        {room.status === "maintenance" && <Btn sm color={T.green} onClick={() => { onUpdate({ status: "available" }); addToast("Room is now available"); onClose(); }}>✅ Mark Available</Btn>}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: `1px solid ${T.bdr}`, overflowX: "auto" }}>
        {([["overview","📋 Overview"],["services","🛎 Services"],["charges",`📝 Charges (${(room.charges||[]).length})`],["hk","🧹 Housekeeping"],["wakeup","⏰ Preferences"],
          ...(room.status==="occupied"?[["checkin","✅ Check-In"],["checkout","🔑 Check-Out"],["invoice","💰 Invoice"]]:[["checkin","✅ Check-In"]])
        ]).map(([id,l]) => (
          <button key={id} onClick={() => setTab(id)} style={{ background: "none", border: "none", borderBottom: tab === id ? `2px solid ${T.gold}` : "2px solid transparent", color: tab === id ? T.gold : T.muted, padding: "10px 16px", cursor: "pointer", fontSize: 12, whiteSpace: "nowrap", transition: "all .15s", marginBottom: -1 }}>{l}</button>
        ))}
      </div>

      <div style={{ padding: "18px 24px", maxHeight: 420, overflow: "auto" }}>
        {/* Overview */}
        {tab === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              {room.guest ? <>
                {[["Guest", room.guest], ["Phone", room.phone || "—"], ["Adults", room.adults], ["Check-In", room.checkIn], ["Check-Out", room.checkOut], ["Nights", ns]].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${T.bdr}`, fontSize: 13 }}>
                    <span style={{ color: T.muted }}>{k}</span><span style={{ color: T.txt }}>{v}</span>
                  </div>
                ))}
                {room.notes && <div style={{ marginTop: 10, color: T.muted, fontSize: 12 }}>Notes: {room.notes}</div>}
              </> : <div style={{ color: T.muted, textAlign: "center", padding: "30px 0" }}>Room is {room.status}</div>}
            </div>
            <div>
              <div style={{ color: T.muted, fontSize: 11, letterSpacing: 1, marginBottom: 10 }}>AMENITIES</div>
              {rt.amenities.map(a => <div key={a} style={{ color: T.txt, fontSize: 13, padding: "4px 0" }}>✓ {a}</div>)}
              {room.status === "occupied" && (
                <div style={{ marginTop: 16, background: T.s2, borderRadius: 8, padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
                    <span style={{ color: T.muted }}>Accommodation</span><span style={{ color: T.txt }}>{settings.currency}{roomCharge}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
                    <span style={{ color: T.muted }}>Services</span><span style={{ color: T.txt }}>{settings.currency}{svcTotal}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: 14, borderTop: `1px solid ${T.gold}44`, paddingTop: 8 }}>
                    <span style={{ color: T.gold }}>Est. Total</span><span style={{ color: T.gold }}>{settings.currency}{grandTotal}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Services */}
        {tab === "services" && room.status === "occupied" && (
          <div>
            <div style={{ display: "flex", gap: 7, marginBottom: 14, flexWrap: "wrap" }}>
              {Object.entries(SVC_CATALOG).map(([k, v]) => (
                <button key={k} onClick={() => setSvcCat(k)} style={{ background: svcCat === k ? `${v.color}22` : T.bg, border: `1px solid ${svcCat === k ? v.color : T.bdr}`, color: svcCat === k ? v.color : T.muted, padding: "5px 11px", borderRadius: 20, cursor: "pointer", fontSize: 11 }}>{v.icon} {v.label.split(" ")[0]}</button>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 14 }}>
              {SVC_CATALOG[svcCat].items.map(item => (
                <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: T.bg, borderRadius: 7, padding: "9px 12px", border: `1px solid ${(svcQty[item.id] || 0) > 0 ? SVC_CATALOG[svcCat].color + "66" : T.bdr}` }}>
                  <div>
                    <div style={{ fontSize: 12, color: T.txt }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: T.gold }}>{settings.currency}{item.price}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <button onClick={() => setSvcQty(q => ({ ...q, [item.id]: Math.max(0, (q[item.id] || 0) - 1) }))} style={{ background: T.s2, border: `1px solid ${T.bdr}`, color: T.txt, width: 24, height: 24, borderRadius: 5, cursor: "pointer", fontSize: 16, lineHeight: 1 }}>−</button>
                    <span style={{ color: T.txt, fontSize: 13, minWidth: 16, textAlign: "center", fontWeight: "bold" }}>{svcQty[item.id] || 0}</span>
                    <button onClick={() => setSvcQty(q => ({ ...q, [item.id]: (q[item.id] || 0) + 1 }))} style={{ background: T.s2, border: `1px solid ${T.bdr}`, color: T.txt, width: 24, height: 24, borderRadius: 5, cursor: "pointer", fontSize: 16, lineHeight: 1 }}>+</button>
                  </div>
                </div>
              ))}
            </div>
            {Object.values(svcQty).some(v => v > 0) && (
              <div style={{ background: "#051a05", borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 12 }}>
                <div style={{ color: T.green, marginBottom: 6, fontWeight: "bold" }}>Items to post:</div>
                {Object.entries(svcQty).filter(([, v]) => v > 0).map(([id, qty]) => {
                  let found = null; for (const cv of Object.values(SVC_CATALOG)) { const f = cv.items.find(x => x.id === id); if (f) { found = f; break; } }
                  return found ? <div key={id} style={{ display: "flex", justifyContent: "space-between", color: T.txt, marginBottom: 2 }}><span>{found.name} × {qty}</span><span style={{ color: T.gold }}>{settings.currency}{found.price * qty}</span></div> : null;
                })}
                <div style={{ borderTop: `1px solid ${T.bdr}`, marginTop: 8, paddingTop: 8, display: "flex", justifyContent: "space-between", fontWeight: "bold" }}>
                  <span style={{ color: T.txt }}>Total</span>
                  <span style={{ color: T.gold }}>{settings.currency}{Object.entries(svcQty).reduce((acc, [id, qty]) => { for (const cv of Object.values(SVC_CATALOG)) { const f = cv.items.find(x => x.id === id); if (f) return acc + f.price * qty; } return acc; }, 0)}</span>
                </div>
              </div>
            )}
            <Btn color={T.gold} onClick={postCharges} full>✅ Post Charges to Room {room.number}</Btn>
          </div>
        )}
        {tab === "services" && room.status !== "occupied" && <div style={{ color: T.muted, textAlign: "center", padding: 40 }}>Room must be occupied to add charges</div>}

        {/* Charges */}
        {tab === "charges" && (
          <div>
            {!(room.charges || []).length ? <div style={{ color: T.muted, textAlign: "center", padding: 30 }}>No charges posted yet</div> : (
              <>
                {(room.charges || []).map(c => (
                  <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${T.bdr}` }}>
                    <div>
                      <span style={{ color: SVC_CATALOG[c.category]?.color || T.muted, fontSize: 13 }}>{SVC_CATALOG[c.category]?.icon}</span>
                      <span style={{ color: T.txt, fontSize: 13, marginLeft: 8 }}>{c.name}{c.qty > 1 ? ` ×${c.qty}` : ""}</span>
                      <div style={{ color: T.muted, fontSize: 11, marginTop: 1 }}>{c.date}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ color: T.gold, fontWeight: "bold" }}>{settings.currency}{c.total}</span>
                      <button onClick={() => { const upd = (room.charges || []).filter(x => x.id !== c.id); onUpdate({ charges: upd }); addToast("Charge removed"); }} style={{ background: "none", border: "none", color: T.red, cursor: "pointer", fontSize: 16 }}>×</button>
                    </div>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, color: T.gold, fontWeight: "bold", fontSize: 14 }}>
                  <span>Services Total</span><span>{settings.currency}{svcTotal}</span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Housekeeping */}
        {tab === "hk" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
              {HK_TASKS.map(t => (
                <label key={t} style={{ display: "flex", alignItems: "center", gap: 8, background: hkSel.includes(t) ? `${T.teal}15` : T.bg, border: `1px solid ${hkSel.includes(t) ? T.teal : T.bdr}`, borderRadius: 7, padding: "9px 12px", cursor: "pointer", fontSize: 12, color: hkSel.includes(t) ? T.teal : T.txt }}>
                  <input type="checkbox" checked={hkSel.includes(t)} onChange={() => setHkSel(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t])} style={{ accentColor: T.teal }} />{t}
                </label>
              ))}
            </div>
            <input value={hkNote} onChange={e => setHkNote(e.target.value)} placeholder="Additional instructions…" style={{ ...inpS, marginBottom: 12 }} />
            <Btn color={T.teal} onClick={addHK} full>🧹 Submit Housekeeping Request</Btn>
            {(room.hk || []).length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ color: T.muted, fontSize: 11, letterSpacing: 1, marginBottom: 8 }}>PREVIOUS REQUESTS</div>
                {[...(room.hk || [])].reverse().map(h => (
                  <div key={h.id} style={{ background: T.bg, borderRadius: 7, padding: 10, marginBottom: 7 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: T.txt, fontSize: 12 }}>{h.tasks.join(", ")}</span>
                      <span style={{ color: h.status === "done" ? T.green : T.orange, fontSize: 11 }}>{h.status === "done" ? "✓" : "●"} {h.status}</span>
                    </div>
                    {h.note && <div style={{ color: T.muted, fontSize: 11, marginTop: 2 }}>{h.note}</div>}
                    <div style={{ color: T.muted, fontSize: 10, marginTop: 3 }}>{h.at}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Wake-up / DND */}
        {tab === "wakeup" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ background: T.s2, borderRadius: 9, padding: 20 }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>🔕</div>
              <div style={{ color: T.txt, fontWeight: "bold", marginBottom: 6 }}>Do Not Disturb</div>
              <div style={{ color: T.muted, fontSize: 12, marginBottom: 14 }}>Status: <span style={{ color: room.dnd ? T.red : T.green }}>{room.dnd ? "ACTIVE" : "OFF"}</span></div>
              <Btn color={room.dnd ? T.green : T.red} onClick={() => { onUpdate({ dnd: !room.dnd }); addToast(room.dnd ? "DND cleared" : "🔕 DND enabled"); }} full>{room.dnd ? "Disable DND" : "Enable DND"}</Btn>
            </div>
            <div style={{ background: T.s2, borderRadius: 9, padding: 20 }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>⏰</div>
              <div style={{ color: T.txt, fontWeight: "bold", marginBottom: 6 }}>Wake-Up Call</div>
              {room.wakeUp && <div style={{ color: T.green, fontSize: 13, marginBottom: 8 }}>Set: {room.wakeUp}</div>}
              <input type="time" value={wakeT} onChange={e => setWakeT(e.target.value)} style={{ ...inpS, marginBottom: 10 }} />
              <Btn color={T.blue} onClick={() => { if (!wakeT) { addToast("Enter a time", "error"); return; } onUpdate({ wakeUp: wakeT }); addToast(`⏰ Wake-up set: ${wakeT}`); }} full>Set Wake-Up</Btn>
              {room.wakeUp && <Btn color={T.red} onClick={() => { onUpdate({ wakeUp: "" }); addToast("Wake-up cancelled"); }} full style={{ marginTop: 8 }}>Cancel</Btn>}
            </div>
          </div>
        )}

        {/* Check-In form */}
        {tab === "checkin" && (
          <CheckInForm room={room} onCheckin={(patch, booking) => { onUpdate({ ...patch, status: "occupied" }); addToast(`✓ ${patch.guest} checked in → Room ${room.number}`); onClose(); }} settings={settings} addToast={addToast} />
        )}

        {/* Checkout */}
        {tab === "checkout" && room.status === "occupied" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔑</div>
            <div style={{ color: T.txt, fontSize: 15, marginBottom: 16 }}>Room {room.number} · {room.guest}</div>
            <div style={{ background: T.s2, borderRadius: 9, padding: 18, textAlign: "left", marginBottom: 18 }}>
              {[["Duration", `${ns} night${ns !== 1 ? "s" : ""}`], ["Accommodation", `${settings.currency}${roomCharge}`], ...(svcTotal > 0 ? [["Services", `${settings.currency}${svcTotal}`]] : []), [`Tax (${settings.taxRate}%)`, `${settings.currency}${tax}`], [`Service Charge (${settings.serviceCharge}%)`, `${settings.currency}${svc}`]].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${T.bdr}`, fontSize: 13 }}><span style={{ color: T.muted }}>{k}</span><span style={{ color: T.txt }}>{v}</span></div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 10, marginTop: 4 }}>
                <span style={{ color: T.gold, fontWeight: "bold", fontSize: 15 }}>TOTAL DUE</span>
                <span style={{ color: T.gold, fontSize: 22, fontWeight: "bold" }}>{settings.currency}{grandTotal}</span>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Btn color={T.muted} onClick={() => setTab("overview")} full ghost>← Back</Btn>
              <Btn color={T.red} onClick={() => { onUpdate({ status: "available", guest: null, checkIn: null, checkOut: null, phone: null, charges: [], hk: [], dnd: false, wakeUp: "", adults: 1 }); addToast(`✓ Room ${room.number} checked out`); onClose(); }} full>🔑 Confirm Check-Out</Btn>
            </div>
          </div>
        )}

        {/* Invoice */}
        {tab === "invoice" && room.status === "occupied" && (
          <div>
            <div style={{ textAlign: "center", marginBottom: 16, paddingBottom: 14, borderBottom: `1px solid ${T.bdr}` }}>
              <div style={{ color: T.gold, fontSize: 15, letterSpacing: 3 }}>GUEST INVOICE</div>
              <div style={{ color: T.muted, fontSize: 11 }}>{new Date().toLocaleDateString()}</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, background: T.s2, borderRadius: 8, padding: 14, marginBottom: 14, fontSize: 12 }}>
              {[["Room", `${room.number} (${rt.label})`], ["Guest", room.guest], ["Check-In", room.checkIn], ["Check-Out", room.checkOut], ["Nights", ns], ["Adults", room.adults]].map(([k, v]) => (
                <div key={k}><div style={{ color: T.muted, fontSize: 10, marginBottom: 2 }}>{k}</div><div style={{ color: T.txt }}>{v}</div></div>
              ))}
            </div>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, color: T.muted, letterSpacing: 1, marginBottom: 6 }}>ACCOMMODATION</div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "5px 0", borderBottom: `1px solid ${T.bdr}` }}>
                <span style={{ color: T.txt }}>{ns} nights × {settings.currency}{rt.price}</span>
                <span style={{ color: T.txt }}>{settings.currency}{roomCharge}</span>
              </div>
            </div>
            {(room.charges || []).length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, color: T.muted, letterSpacing: 1, marginBottom: 6 }}>SERVICES & EXTRAS</div>
                {(room.charges || []).map(c => (
                  <div key={c.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "3px 0", color: T.muted }}>
                    <span>{SVC_CATALOG[c.category]?.icon} {c.name}{c.qty > 1 ? ` ×${c.qty}` : ""}</span>
                    <span style={{ color: T.txt }}>{settings.currency}{c.total}</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ borderTop: `1px solid ${T.bdr}`, paddingTop: 10 }}>
              {[["Subtotal", `${settings.currency}${sub}`], ...(svcTotal > 0 ? [["Services", `${settings.currency}${svcTotal}`]] : []), [`Tax (${settings.taxRate}%)`, `${settings.currency}${tax}`], [`Service Charge (${settings.serviceCharge}%)`, `${settings.currency}${svc}`]].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0" }}><span style={{ color: T.muted }}>{k}</span><span style={{ color: T.txt }}>{v}</span></div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: `2px solid ${T.gold}44`, paddingTop: 12, marginTop: 4, marginBottom: 16 }}>
              <span style={{ color: T.gold, fontWeight: "bold", fontSize: 15 }}>TOTAL DUE</span>
              <span style={{ color: T.gold, fontSize: 22, fontWeight: "bold" }}>{settings.currency}{grandTotal}</span>
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
              <Btn color={T.blue} onClick={() => window.print()} full>🖨️ Print Invoice</Btn>
            </div>
            <Btn color={T.red} onClick={() => setTab("checkout")} full>Proceed to Check-Out</Btn>
          </div>
        )}
      </div>
    </Modal>
  );
}

function CheckInForm({ room, onCheckin, settings, addToast }) {
  const [f, setF] = useState({ guest: "", phone: "", idNum: "", checkIn: today(), checkOut: "", adults: 1, notes: "" });
  const ns2 = f.checkIn && f.checkOut ? nights(f.checkIn, f.checkOut) : 0;
  const go = () => {
    if (!f.guest || !f.checkIn || !f.checkOut) { addToast("Fill guest name and dates", "error"); return; }
    onCheckin({ ...f, adults: +f.adults, charges: [], hk: [], dnd: false, wakeUp: "" });
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
      <div style={{ background: T.s2, borderRadius: 7, padding: 12, fontSize: 12, color: T.mutedL }}>
        {ROOM_TYPES[room.type].label} · {ROOM_TYPES[room.type].beds} · {settings.currency}{ROOM_TYPES[room.type].price}/night
      </div>
      <Inp label="Guest Full Name *" value={f.guest} onChange={v => setF(x => ({ ...x, guest: v }))} placeholder="Full name as on ID" />
      <Inp label="Phone" value={f.phone} onChange={v => setF(x => ({ ...x, phone: v }))} placeholder="+234 ..." />
      <Inp label="ID / Passport Number" value={f.idNum} onChange={v => setF(x => ({ ...x, idNum: v }))} placeholder="Document number" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 13 }}>
        <Inp label="Check-In Date *" type="date" value={f.checkIn} onChange={v => setF(x => ({ ...x, checkIn: v }))} />
        <Inp label="Check-Out Date *" type="date" value={f.checkOut} onChange={v => setF(x => ({ ...x, checkOut: v }))} />
      </div>
      <Inp label="Adults" value={f.adults} onChange={v => setF(x => ({ ...x, adults: v }))} options={[1, 2, 3, 4].map(n => ({ value: n, label: `${n} Adult${n > 1 ? "s" : ""}` }))} />
      <Inp label="Notes / Special Requests" value={f.notes} onChange={v => setF(x => ({ ...x, notes: v }))} placeholder="e.g. anniversary room, high floor…" />
      {ns2 > 0 && (
        <div style={{ background: "#051a05", border: `1px solid ${T.green}33`, borderRadius: 8, padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: T.muted, fontSize: 13 }}>{ns2} night{ns2 > 1 ? "s" : ""} × {settings.currency}{ROOM_TYPES[room.type].price}</span>
          <span style={{ color: T.gold, fontWeight: "bold", fontSize: 17 }}>{settings.currency}{ns2 * ROOM_TYPES[room.type].price}</span>
        </div>
      )}
      <Btn color={T.green} onClick={go} full>✅ Confirm Check-In</Btn>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  MAIN APPLICATION SHELL
// ═══════════════════════════════════════════════════════════
export default function HotelApp() {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState(() => ls.get("hotel_settings", SEED_SETTINGS));
  const [rooms, setRooms] = useState(() => ls.get("hotel_rooms", null) || buildRooms());
  const [bookings, setBookings] = useState(() => ls.get("hotel_bookings", []));
  const [view, setView] = useState("dashboard");
  const [sidebar, setSidebar] = useState(true);
  const [toast, setToast] = useState(null);
  const [roomModal, setRoomModal] = useState(null);
  const [search, setSearch] = useState("");
  const [stFilter, setStFilter] = useState("all");
  const [tyFilter, setTyFilter] = useState("all");

  const addToast = useCallback((msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); }, []);

  const saveRooms = r => { setRooms(r); ls.set("hotel_rooms", r); };
  const saveSettings = s => { setSettings(s); ls.set("hotel_settings", s); };
  const updateRoom = (id, patch) => saveRooms(rooms.map(r => r.id === id ? { ...r, ...patch } : r));

  const handleLogin = u => {
    const loginU = { ...u, lastLogin: nowStr() };
    setUser(loginU);
    const updated = ls.get("hotel_users", SEED_USERS).map(x => x.id === u.id ? { ...x, lastLogin: loginU.lastLogin } : x);
    ls.set("hotel_users", updated);
    const first = ROLES[u.role].pages[0];
    setView(first);
    addToast(`Welcome, ${u.name}!`);
  };

  const handleLogout = () => { setUser(null); setView("dashboard"); };

  const handleRoomCharge = (roomNumber, charge) => {
    saveRooms(rooms.map(r => r.number === roomNumber ? { ...r, charges: [...(r.charges || []), charge] } : r));
  };

  const handleRoomUpdate = (id, patch) => {
    const wasOccupied = rooms.find(r => r.id === id)?.status === "occupied";
    const nowAvailable = patch.status === "available" && wasOccupied;
    if (nowAvailable) {
      const r = rooms.find(x => x.id === id);
      const upd = bookings.map(b => b.roomId === id && b.status === "active" ? { ...b, status: "completed", checkedOut: nowStr() } : b);
      setBookings(upd); ls.set("hotel_bookings", upd);
    }
    if (patch.guest && patch.checkIn && patch.checkOut) {
      const r = rooms.find(x => x.id === id);
      const nb = [...bookings, { id: Date.now(), roomId: id, room: r.number, guest: patch.guest, checkIn: patch.checkIn, checkOut: patch.checkOut, type: r.type, rate: ROOM_TYPES[r.type].price, status: "active", by: user.name, at: nowStr() }];
      setBookings(nb); ls.set("hotel_bookings", nb);
    }
    updateRoom(id, patch);
    if (roomModal?.id === id) setRoomModal(prev => ({ ...prev, ...patch }));
  };

  const st = {
    avail: rooms.filter(r => r.status === "available").length,
    occ: rooms.filter(r => r.status === "occupied").length,
    res: rooms.filter(r => r.status === "reserved").length,
    maint: rooms.filter(r => r.status === "maintenance").length,
    occPct: Math.round(rooms.filter(r => r.status === "occupied").length / rooms.length * 100),
    roomRev: rooms.filter(r => r.status === "occupied").reduce((a, r) => a + ROOM_TYPES[r.type].price * (r.checkIn && r.checkOut ? nights(r.checkIn, r.checkOut) : 1), 0),
    svcRev: rooms.reduce((a, r) => a + (r.charges || []).reduce((x, c) => x + c.total, 0), 0),
  };
  st.totalRev = st.roomRev + st.svcRev;

  const filteredRooms = rooms.filter(r =>
    (stFilter === "all" || r.status === stFilter) &&
    (tyFilter === "all" || r.type === tyFilter) &&
    (!search || r.number.includes(search) || (r.guest && r.guest.toLowerCase().includes(search.toLowerCase())))
  );

  const canAccess = pg => user && ROLES[user.role].pages.includes(pg);
  const NAV = [
    { id: "dashboard", icon: "◈", label: "Dashboard" },
    { id: "rooms", icon: "⊞", label: "Rooms" },
    { id: "restaurant", icon: "🍽️", label: "Restaurant" },
    { id: "inventory", icon: "📦", label: "Inventory" },
    { id: "housekeeping", icon: "🧹", label: "Housekeeping" },
    { id: "bookings", icon: "📋", label: "Bookings" },
    { id: "guests", icon: "👤", label: "Guests" },
    { id: "reports", icon: "📊", label: "Reports" },
    { id: "settings", icon: "⚙️", label: "Settings" },
    { id: "giftshop", icon: "🎁", label: "Gift Shop" },
    { id: "events", icon: "🎪", label: "Events" },
    { id: "shuttle", icon: "🚌", label: "Shuttle" },
    { id: "staff", icon: "👥", label: "Staff" },
    { id: "audit", icon: "📝", label: "Audit" },
    { id: "feedback", icon: "💬", label: "Feedback" },
    { id: "loyalty", icon: "🏆", label: "Loyalty" },
    { id: "maintenance", icon: "🔧", label: "Maintenance" },
    { id: "tasks", icon: "✅", label: "Tasks" },
  ].filter(n => canAccess(n.id));

  if (!user) return <LoginPage onLogin={handleLogin} settings={settings} />;

  const role = ROLES[user.role];

  return (
    <div style={{ fontFamily: "'Georgia','Times New Roman',serif", background: T.bg, minHeight: "100vh", color: T.txt, display: "flex", flexDirection: "column" }}>
      {/* TOP BAR */}
      <div style={{ background: `linear-gradient(135deg,#08060100,#100d0300,#08060100)`, borderBottom: `1px solid ${T.gold}25`, padding: "0 18px", display: "flex", alignItems: "center", height: 54, gap: 12, flexShrink: 0, boxShadow: `0 2px 30px rgba(0,0,0,.5)`, background: "#080b10" }}>
        <button onClick={() => setSidebar(p => !p)} style={{ background: "none", border: "none", color: T.gold, cursor: "pointer", fontSize: 18, padding: "4px 8px", lineHeight: 1 }}>☰</button>
        <div style={{ fontSize: 18, fontWeight: "bold", color: T.gold, letterSpacing: 3, textShadow: `0 0 30px ${T.gold}40` }}>{settings.logo} {settings.hotelName}</div>
        <div style={{ color: T.muted, fontSize: 10, letterSpacing: 2 }}>HMS</div>
        <div style={{ flex: 1 }} />
        <div style={{ color: T.muted, fontSize: 11 }}>{fmtDate()}</div>
        <Badge color={st.occPct > 70 ? T.green : st.occPct > 40 ? T.orange : T.red}>{st.occPct}% OCC</Badge>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: T.s1, border: `1px solid ${T.bdr}`, borderRadius: 8, padding: "5px 12px" }}>
          <span style={{ fontSize: 14 }}>{role.icon}</span>
          <div>
            <div style={{ color: T.txt, fontSize: 12, fontWeight: "bold" }}>{user.name.split(" ")[0]}</div>
            <div style={{ color: role.color, fontSize: 10 }}>{role.label}</div>
          </div>
        </div>
        <button onClick={handleLogout} style={{ background: "#1a0505", border: `1px solid ${T.red}44`, color: T.red, padding: "7px 14px", borderRadius: 7, cursor: "pointer", fontSize: 12, fontWeight: "bold" }}>Sign Out</button>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* SIDEBAR */}
        {sidebar && (
          <div style={{ width: 185, background: "#080b10", borderRight: `1px solid ${T.bdr}`, display: "flex", flexDirection: "column", flexShrink: 0, overflow: "auto" }}>
            <div style={{ padding: "10px 0" }}>
              {NAV.map(n => (
                <button key={n.id} onClick={() => setView(n.id)}
                  style={{ background: view === n.id ? `linear-gradient(90deg,${T.gold}18,transparent)` : "none", border: "none", borderLeft: view === n.id ? `3px solid ${T.gold}` : "3px solid transparent", color: view === n.id ? T.gold : T.muted, cursor: "pointer", padding: "11px 16px", textAlign: "left", fontSize: 13, display: "flex", alignItems: "center", gap: 9, width: "100%", transition: "all .15s" }}>
                  <span style={{ fontSize: 14 }}>{n.icon}</span>{n.label}
                </button>
              ))}
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ padding: "14px", borderTop: `1px solid ${T.bdr}` }}>
              <div style={{ fontSize: 10, color: T.muted, letterSpacing: 1, marginBottom: 10 }}>LIVE STATUS</div>
              {Object.entries(ROOM_STATUS).map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ color: v.color, fontSize: 11 }}>● {v.label}</span>
                  <span style={{ color: T.txt, fontSize: 12, fontWeight: "bold" }}>{rooms.filter(r => r.status === k).length}</span>
                </div>
              ))}
              <div style={{ borderTop: `1px solid ${T.bdr}`, marginTop: 10, paddingTop: 10 }}>
                <div style={{ color: T.gold, fontSize: 15, fontWeight: "bold" }}>{settings.currency}{st.totalRev.toLocaleString()}</div>
                <div style={{ color: T.muted, fontSize: 10, marginTop: 2 }}>Total Revenue</div>
              </div>
            </div>
          </div>
        )}

        {/* MAIN */}
        <div style={{ flex: 1, overflow: "auto", padding: 22 }}>

          {/* DASHBOARD */}
          {view === "dashboard" && (
            <div>
              <SectionHead>Dashboard</SectionHead>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(145px,1fr))", gap: 13, marginBottom: 22 }}>
                {[
                  { l: "Available", v: st.avail, c: T.green, i: "✅" }, { l: "Occupied", v: st.occ, c: T.red, i: "🔴" },
                  { l: "Reserved", v: st.res, c: T.orange, i: "📌" }, { l: "Maintenance", v: st.maint, c: T.muted, i: "🔧" },
                  { l: "Occupancy", v: `${st.occPct}%`, c: st.occPct > 70 ? T.green : T.orange, i: "📈" },
                  { l: "Room Revenue", v: `${settings.currency}${st.roomRev.toLocaleString()}`, c: T.gold, i: "🏠" },
                  { l: "Services", v: `${settings.currency}${st.svcRev.toLocaleString()}`, c: T.purple, i: "🛎" },
                  { l: "Total Revenue", v: `${settings.currency}${st.totalRev.toLocaleString()}`, c: T.gold, i: "💰" },
                ].map((s, i) => (
                  <Card key={i} style={{ padding: 15, borderTop: `3px solid ${s.c}` }}>
                    <div style={{ fontSize: 20, marginBottom: 5 }}>{s.i}</div>
                    <div style={{ fontSize: 19, fontWeight: "bold", color: s.c }}>{s.v}</div>
                    <div style={{ fontSize: 11, color: T.muted, marginTop: 3 }}>{s.l}</div>
                  </Card>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                <Card style={{ padding: 20 }}>
                  <div style={{ color: T.gold, fontSize: 12, letterSpacing: 1, marginBottom: 14 }}>ROOM TYPE BREAKDOWN</div>
                  {Object.entries(ROOM_TYPES).map(([k, v]) => {
                    const tot = rooms.filter(r => r.type === k).length;
                    const occ = rooms.filter(r => r.type === k && r.status === "occupied").length;
                    return (
                      <div key={k} style={{ marginBottom: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 13 }}>
                          <span style={{ color: v.color }}>{v.label}</span>
                          <span style={{ color: T.muted }}>{occ}/{tot} · <span style={{ color: T.gold }}>{settings.currency}{v.price}/n</span></span>
                        </div>
                        <div style={{ background: T.bg, borderRadius: 4, height: 6 }}>
                          <div style={{ background: v.color, borderRadius: 4, height: 6, width: tot ? `${(occ / tot) * 100}%` : "0%", transition: "width .5s" }} />
                        </div>
                      </div>
                    );
                  })}
                </Card>
                <Card style={{ padding: 20 }}>
                  <div style={{ color: T.gold, fontSize: 12, letterSpacing: 1, marginBottom: 14 }}>RECENT ACTIVITY</div>
                  {bookings.length === 0 && <div style={{ color: T.muted, textAlign: "center", padding: 20, fontSize: 13 }}>No bookings yet</div>}
                  {[...bookings].reverse().slice(0, 7).map(b => (
                    <div key={b.id} style={{ borderBottom: `1px solid ${T.bdr}`, paddingBottom: 8, marginBottom: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: T.txt, fontSize: 13 }}>{b.guest}</span>
                        <Badge color={b.status === "active" ? T.green : T.mutedL}>{b.status}</Badge>
                      </div>
                      <div style={{ color: T.muted, fontSize: 11, marginTop: 2 }}>Room {b.room} · {b.at}</div>
                    </div>
                  ))}
                </Card>
              </div>
            </div>
          )}

          {/* ROOMS */}
          {view === "rooms" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                <SectionHead style={{ margin: 0 }}>Rooms</SectionHead>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search room / guest…" style={{ background: T.s2, border: `1px solid ${T.bdr}`, borderRadius: 7, color: T.txt, padding: "8px 13px", fontSize: 12, outline: "none", width: 180 }} />
                <select value={stFilter} onChange={e => setStFilter(e.target.value)} style={{ background: T.s2, border: `1px solid ${T.bdr}`, borderRadius: 7, color: T.txt, padding: "8px 12px", fontSize: 12, outline: "none" }}>
                  <option value="all">All Status</option>{Object.entries(ROOM_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <select value={tyFilter} onChange={e => setTyFilter(e.target.value)} style={{ background: T.s2, border: `1px solid ${T.bdr}`, borderRadius: 7, color: T.txt, padding: "8px 12px", fontSize: 12, outline: "none" }}>
                  <option value="all">All Types</option>{Object.entries(ROOM_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <div style={{ flex: 1 }} />
                <span style={{ color: T.muted, fontSize: 12 }}>{filteredRooms.length} rooms</span>
              </div>
              <div style={{ display: "flex", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
                {Object.entries(ROOM_STATUS).map(([k, v]) => (
                  <div key={k} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: v.color }} />
                    <span style={{ color: T.muted }}>{v.label} ({rooms.filter(r => r.status === k).length})</span>
                  </div>
                ))}
              </div>
              {[1, 2, 3, 4, 5].map(floor => {
                const fr = filteredRooms.filter(r => r.floor === floor);
                if (!fr.length) return null;
                return (
                  <div key={floor} style={{ marginBottom: 20 }}>
                    <div style={{ color: T.gold, fontSize: 11, letterSpacing: 2, marginBottom: 10, borderBottom: `1px solid ${T.bdr}`, paddingBottom: 5 }}>FLOOR {floor}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 9 }}>
                      {fr.map(room => {
                        const s = ROOM_STATUS[room.status]; const t = ROOM_TYPES[room.type];
                        const sc = (room.charges || []).length; const hkp = (room.hk || []).filter(h => h.status === "pending").length;
                        return (
                          <div key={room.id} onClick={() => setRoomModal(room)}
                            style={{ background: s.bg, border: `1px solid ${s.color}35`, borderRadius: 8, padding: 12, cursor: "pointer", transition: "all .2s", borderLeft: `4px solid ${s.color}`, position: "relative" }}
                            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 6px 20px ${s.color}20`; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
                            {room.dnd && <span style={{ position: "absolute", top: 6, right: 6, fontSize: 9 }}>🔕</span>}
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                              <span style={{ fontSize: 17, fontWeight: "bold", color: T.txt }}>{room.number}</span>
                              <span style={{ fontSize: 9, background: `${s.color}22`, color: s.color, padding: "2px 5px", borderRadius: 4 }}>{s.label}</span>
                            </div>
                            <div style={{ fontSize: 10, color: t.color, marginBottom: 3 }}>{t.label} · {settings.currency}{t.price}/n</div>
                            {room.guest && <div style={{ fontSize: 10, color: T.txt, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>👤 {room.guest}</div>}
                            {room.checkOut && <div style={{ fontSize: 9, color: T.muted, marginTop: 2 }}>Out: {room.checkOut}</div>}
                            {room.status === "available" && <div style={{ fontSize: 10, color: T.green, marginTop: 2 }}>Ready</div>}
                            {(sc > 0 || hkp > 0) && (
                              <div style={{ display: "flex", gap: 4, marginTop: 5 }}>
                                {sc > 0 && <span style={{ fontSize: 9, background: "#1a0a2a", color: T.purple, padding: "1px 5px", borderRadius: 6 }}>🛎{sc}</span>}
                                {hkp > 0 && <span style={{ fontSize: 9, background: "#0a1a1a", color: T.teal, padding: "1px 5px", borderRadius: 6 }}>🧹{hkp}</span>}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {view === "restaurant" && <RestaurantPage rooms={rooms} onRoomCharge={handleRoomCharge} addToast={addToast} currentUser={user} />}
          {view === "inventory" && <InventoryPage currentUser={user} addToast={addToast} />}

          {/* HOUSEKEEPING */}
          {view === "housekeeping" && (
            <div>
              <SectionHead>Housekeeping</SectionHead>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <Card style={{ padding: 20 }}>
                  <div style={{ color: T.gold, fontSize: 12, letterSpacing: 1, marginBottom: 14 }}>DND & WAKE-UP STATUS</div>
                  {rooms.filter(r => r.status === "occupied").length === 0 && <div style={{ color: T.muted, textAlign: "center", padding: 20 }}>No guests checked in</div>}
                  {rooms.filter(r => r.status === "occupied").map(r => (
                    <div key={r.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${T.bdr}`, alignItems: "center" }}>
                      <div>
                        <span style={{ color: T.txt, fontSize: 13 }}>Room {r.number}</span>
                        <span style={{ color: T.muted, fontSize: 12, marginLeft: 8 }}>{r.guest}</span>
                      </div>
                      <div style={{ display: "flex", gap: 5 }}>
                        {r.dnd ? <Badge color={T.red}>🔕 DND</Badge> : null}
                        {r.wakeUp ? <Badge color={T.green}>⏰{r.wakeUp}</Badge> : null}
                        {!r.dnd && !r.wakeUp && <span style={{ color: T.muted, fontSize: 12 }}>—</span>}
                      </div>
                    </div>
                  ))}
                </Card>
                <Card style={{ padding: 20 }}>
                  <div style={{ color: T.gold, fontSize: 12, letterSpacing: 1, marginBottom: 14 }}>PENDING REQUESTS</div>
                  {(() => {
                    const pending = rooms.flatMap(r => (r.hk || []).filter(h => h.status === "pending").map(h => ({ ...h, roomNumber: r.number, roomId: r.id })));
                    if (!pending.length) return <div style={{ color: T.muted, textAlign: "center", padding: 20 }}>✅ All clear</div>;
                    return pending.map(h => (
                      <div key={h.id} style={{ background: T.s2, borderRadius: 7, padding: 12, marginBottom: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ color: T.gold, fontWeight: "bold" }}>Room {h.roomNumber}</span>
                          <Btn sm color={T.green} onClick={() => { saveRooms(rooms.map(r => r.id === h.roomId ? { ...r, hk: r.hk.map(x => x.id === h.id ? { ...x, status: "done" } : x) } : r)); addToast("HK task marked done"); }}>Done</Btn>
                        </div>
                        <div style={{ color: T.txt, fontSize: 12 }}>{h.tasks.join(", ")}</div>
                        {h.note && <div style={{ color: T.muted, fontSize: 11, marginTop: 2 }}>{h.note}</div>}
                        <div style={{ color: T.muted, fontSize: 10, marginTop: 3 }}>{h.at}</div>
                      </div>
                    ));
                  })()}
                </Card>
              </div>
            </div>
          )}

          {/* BOOKINGS */}
          {view === "bookings" && (
            <div>
              <SectionHead>Bookings</SectionHead>
              {bookings.length === 0 ? <div style={{ color: T.muted, textAlign: "center", padding: 60 }}>No bookings yet</div> : (
                <Card style={{ overflow: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead><tr style={{ background: T.s2 }}>{["Room", "Guest", "Type", "Check-In", "Check-Out", "Rate", "Status", "By", "Date"].map(h => <th key={h} style={{ color: T.gold, fontSize: 10, letterSpacing: 1, padding: "11px 13px", textAlign: "left", borderBottom: `1px solid ${T.bdr}`, fontWeight: "normal" }}>{h}</th>)}</tr></thead>
                    <tbody>{[...bookings].reverse().map(b => (
                      <tr key={b.id} onMouseEnter={e => e.currentTarget.style.background = T.s2} onMouseLeave={e => e.currentTarget.style.background = ""} style={{ borderBottom: `1px solid ${T.bdr}` }}>
                        <td style={{ padding: "10px 13px", color: T.gold, fontWeight: "bold" }}>{b.room}</td>
                        <td style={{ padding: "10px 13px", color: T.txt, fontSize: 13 }}>{b.guest}</td>
                        <td style={{ padding: "10px 13px" }}><span style={{ color: ROOM_TYPES[b.type]?.color, fontSize: 12 }}>{ROOM_TYPES[b.type]?.label}</span></td>
                        <td style={{ padding: "10px 13px", color: T.muted, fontSize: 12 }}>{b.checkIn}</td>
                        <td style={{ padding: "10px 13px", color: T.muted, fontSize: 12 }}>{b.checkOut}</td>
                        <td style={{ padding: "10px 13px", color: T.txt }}>{settings.currency}{b.rate}/n</td>
                        <td style={{ padding: "10px 13px" }}><Badge color={b.status === "active" ? T.green : T.mutedL}>{b.status}</Badge></td>
                        <td style={{ padding: "10px 13px", color: T.muted, fontSize: 12 }}>{b.by}</td>
                        <td style={{ padding: "10px 13px", color: T.muted, fontSize: 11 }}>{b.at}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </Card>
              )}
            </div>
          )}

          {/* GUESTS */}
          {view === "guests" && (
            <div>
              <SectionHead>Current Guests</SectionHead>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(270px,1fr))", gap: 14 }}>
                {rooms.filter(r => r.status === "occupied" && r.guest).map(r => {
                  const t = ROOM_TYPES[r.type]; const ns2 = r.checkIn && r.checkOut ? nights(r.checkIn, r.checkOut) : 1;
                  const svcT = (r.charges || []).reduce((a, c) => a + c.total, 0);
                  const sub2 = t.price * ns2 + svcT; const tax2 = Math.round(sub2 * settings.taxRate / 100);
                  return (
                    <Card key={r.id} style={{ padding: 18, borderLeft: `4px solid ${T.gold}` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                        <div style={{ width: 38, height: 38, borderRadius: "50%", background: `linear-gradient(135deg,${T.gold},${T.goldD})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: "bold", color: "#050300", flexShrink: 0 }}>{r.guest.charAt(0)}</div>
                        <div><div style={{ color: T.txt, fontWeight: "bold", fontSize: 14 }}>{r.guest}</div><div style={{ color: T.muted, fontSize: 11 }}>Room {r.number} · {t.label}</div></div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12, marginBottom: 12 }}>
                        {[["Check-In", r.checkIn], ["Check-Out", r.checkOut], ["Nights", ns2], ["Adults", r.adults], ["Room Charge", `${settings.currency}${t.price * ns2}`], ["Services", `${settings.currency}${svcT}`]].map(([k, v]) => (
                          <div key={k}><div style={{ color: T.muted, fontSize: 10 }}>{k}</div><div style={{ color: T.txt }}>{v}</div></div>
                        ))}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", borderTop: `1px solid ${T.bdr}`, paddingTop: 10, marginBottom: 12 }}>
                        <span style={{ color: T.gold, fontWeight: "bold" }}>Est. Total</span>
                        <span style={{ color: T.gold, fontSize: 16, fontWeight: "bold" }}>{settings.currency}{sub2 + tax2}</span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        <Btn sm color={T.gold} onClick={() => setRoomModal(r)} full>Manage</Btn>
                        <Btn sm color={T.red} onClick={() => setRoomModal({ ...r, _gotoTab: "checkout" })} full>Check Out</Btn>
                      </div>
                    </Card>
                  );
                })}
                {rooms.filter(r => r.status === "occupied" && r.guest).length === 0 && <div style={{ color: T.muted, gridColumn: "1/-1", textAlign: "center", padding: 60 }}>No guests checked in</div>}
              </div>
            </div>
          )}

          {/* REPORTS */}
          {view === "reports" && (
            <div>
              <SectionHead>Reports & Analytics</SectionHead>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
                <Card style={{ padding: 20 }}>
                  <div style={{ color: T.gold, fontSize: 12, letterSpacing: 1, marginBottom: 14 }}>REVENUE BREAKDOWN</div>
                  {[{ l: "Room Accommodation", v: st.roomRev, c: T.gold },
                    ...Object.entries(SVC_CATALOG).map(([k, v]) => ({ l: `${v.icon} ${v.label}`, v: rooms.reduce((a, r) => a + (r.charges || []).filter(c => c.category === k).reduce((x, c) => x + c.total, 0), 0), c: v.color }))
                  ].map((s, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${T.bdr}`, fontSize: 13 }}>
                      <span style={{ color: s.c }}>{s.l}</span><span style={{ color: T.gold, fontWeight: "bold" }}>{settings.currency}{s.v.toLocaleString()}</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, paddingTop: 10, borderTop: `1px solid ${T.gold}44` }}>
                    <span style={{ color: T.txt, fontWeight: "bold" }}>GRAND TOTAL</span>
                    <span style={{ color: T.gold, fontSize: 18, fontWeight: "bold" }}>{settings.currency}{st.totalRev.toLocaleString()}</span>
                  </div>
                </Card>
                <Card style={{ padding: 20 }}>
                  <div style={{ color: T.gold, fontSize: 12, letterSpacing: 1, marginBottom: 14 }}>OCCUPANCY OVERVIEW</div>
                  {Object.entries(ROOM_STATUS).map(([k, v]) => { const cnt = rooms.filter(r => r.status === k).length; const pct = (cnt / rooms.length) * 100; return (
                    <div key={k} style={{ marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 13 }}><span style={{ color: v.color }}>{v.label}</span><span style={{ color: T.txt }}>{cnt} ({Math.round(pct)}%)</span></div>
                      <div style={{ background: T.bg, borderRadius: 4, height: 7 }}><div style={{ background: v.color, borderRadius: 4, height: 7, width: `${pct}%`, transition: "width .5s" }} /></div>
                    </div>
                  ); })}
                  <div style={{ textAlign: "center", marginTop: 18 }}>
                    <div style={{ fontSize: 38, fontWeight: "bold", color: st.occPct > 70 ? T.green : T.orange }}>{st.occPct}%</div>
                    <div style={{ color: T.muted, fontSize: 12 }}>Current Occupancy Rate</div>
                  </div>
                </Card>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 13 }}>
                {[{ l: "Total Bookings", v: bookings.length, c: T.gold }, { l: "Active Stays", v: bookings.filter(b => b.status === "active").length, c: T.green }, { l: "Completed", v: bookings.filter(b => b.status === "completed").length, c: T.mutedL }, { l: "Service Charges", v: rooms.reduce((a, r) => a + (r.charges || []).length, 0), c: T.purple }].map((s, i) => (
                  <Card key={i} style={{ padding: 16, textAlign: "center" }}>
                    <div style={{ fontSize: 24, fontWeight: "bold", color: s.c }}>{s.v}</div>
                    <div style={{ color: T.muted, fontSize: 12, marginTop: 4 }}>{s.l}</div>
                  </Card>
                ))}
              </div>
            </div>
          )}

{view === "settings" && <SettingsPage settings={settings} onSave={saveSettings} currentUser={user} addToast={addToast} />}
{view === "giftshop" && <div><SectionHead>🎁 Gift Shop</SectionHead><Card style={{padding:30,textAlign:"center"}}><span style={{fontSize:48}}>🎁</span><div style={{color:T.txt,marginTop:10}}>Retail POS - Coming Soon</div></Card></div>}
{view === "events" && <div><SectionHead>🎪 Events</SectionHead><Card style={{padding:30,textAlign:"center"}}><span style={{fontSize:48}}>🎪</span><div style={{color:T.txt,marginTop:10}}>Conference Rooms - Coming Soon</div></Card></div>}
{view === "shuttle" && <div><SectionHead>🚌 Shuttle</SectionHead><Card style={{padding:30,textAlign:"center"}}><span style={{fontSize:48}}>🚌</span><div style={{color:T.txt,marginTop:10}}>Airport Transportation - Coming Soon</div></Card></div>}
{view === "staff" && <div><SectionHead>📅 Staff</SectionHead><Card style={{padding:30,textAlign:"center"}}><span style={{fontSize:48}}>📅</span><div style={{color:T.txt,marginTop:10}}>Shift Scheduling - Coming Soon</div></Card></div>}
{view === "audit" && <div><SectionHead>📊 Audit</SectionHead><Card style={{padding:30,textAlign:"center"}}><span style={{fontSize:48}}>📊</span><div style={{color:T.txt,marginTop:10}}>Activity Tracking - Coming Soon</div></Card></div>}
{view === "feedback" && <div><SectionHead>⭐ Feedback</SectionHead><Card style={{padding:30,textAlign:"center"}}><span style={{fontSize:48}}>⭐</span><div style={{color:T.txt,marginTop:10}}>Guest Surveys - Coming Soon</div></Card></div>}
{view === "loyalty" && <div><SectionHead>🎁 Loyalty</SectionHead><Card style={{padding:30,textAlign:"center"}}><span style={{fontSize:48}}>🎁</span><div style={{color:T.txt,marginTop:10}}>Rewards Program - Coming Soon</div></Card></div>}
{view === "maintenance" && <div><SectionHead>🔧 Maintenance</SectionHead><Card style={{padding:30,textAlign:"center"}}><span style={{fontSize:48}}>🔧</span><div style={{color:T.txt,marginTop:10}}>Facility Tracking - Coming Soon</div></Card></div>}
{view === "tasks" && <div><SectionHead>📋 Tasks</SectionHead><Card style={{padding:30,textAlign:"center"}}><span style={{fontSize:48}}>📋</span><div style={{color:T.txt,marginTop:10}}>Task Management - Coming Soon</div></Card></div>}
        </div>
      </div>

      {/* Room Modal */}
      {roomModal && (
        <RoomModal
          room={roomModal}
          onClose={() => setRoomModal(null)}
          onUpdate={patch => handleRoomUpdate(roomModal.id, patch)}
          settings={settings}
          addToast={addToast}
        />
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <style>{`
        @keyframes toastIn{from{transform:translateX(100px);opacity:0}to{transform:translateX(0);opacity:1}}
        @keyframes pulse{0%,100%{opacity:.9}50%{opacity:1;text-shadow:0 0 80px ${T.gold}70}}
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:${T.bg}}
        ::-webkit-scrollbar-thumb{background:${T.bdr};border-radius:3px}
        select option{background:${T.s2}}
        input[type=date]::-webkit-calendar-picker-indicator,
        input[type=time]::-webkit-calendar-picker-indicator{filter:invert(.4)}
        @media print {
          body { background: white !important; color: black !important; }
          .no-print, button, .sidebar, .topbar, nav, footer { display: none !important; }
          .print-only { display: block !important; }
          .print-invoice { 
            padding: 20px !important; 
            background: white !important; 
            color: black !important;
            font-size: 12pt !important;
          }
          .print-invoice * { color: black !important; border-color: #ccc !important; }
          .print-invoice .total-due { 
            font-size: 18pt !important; 
            font-weight: bold !important;
            border-top: 2px solid black !important;
            padding-top: 10px !important;
          }
          .print-header {
            text-align: center !important;
            margin-bottom: 20px !important;
            border-bottom: 2px solid #D4AF37 !important;
            padding-bottom: 10px !important;
          }
        }
      `}</style>
    </div>
  );
}
