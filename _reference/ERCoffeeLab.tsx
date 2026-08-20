import React, { useState, useEffect, useMemo } from "react";
import {
  Coffee, Search, Bell, User, Heart, Plus, Minus, ShoppingBag, MapPin,
  ChevronRight, X, Check, Star, Clock, ArrowLeft, Home as HomeIcon,
  Receipt, Gift, LogOut, CreditCard, Wallet, QrCode, Truck, Package,
  ChevronDown, Flame, Snowflake, Milk, Sparkles, Eye, EyeOff, Phone, Mail,
  Lock, ArrowRight, Ticket, Trash2, TrendingUp, Award, BadgeCheck, Navigation,
  ShoppingCart, CheckCircle2, Circle, HelpCircle, Pencil, MessageCircle, Instagram, Tag,
} from "lucide-react";

/* ============================================================================
   ER COFFEE LAB — MOBILE APP UI/UX PROTOTYPE
   Single-file interactive React/TypeScript prototype. No backend, no API.
   Brand: Navy #181F4B on White, minimal warm-gold accent, serif x sans type.
============================================================================ */

const NAVY = "#181F4B";
const NAVY_DEEP = "#0E1230";
const NAVY_SOFT = "#3B4B8C";
const GOLD = "#C9A876";
const CREAM = "#F6F3EC";
const MIST = "#F4F5F9";
const LINE = "#E7E8F0";
const INK_2 = "#6B7088";

const fmt = (n: number) => "Rp" + n.toLocaleString("id-ID");

/* ---------------------------------- DATA --------------------------------- */

type Product = {
  id: number;
  name: string;
  category: string;
  type: "beverage" | "food";
  price: number;
  desc: string;
  gradient: [string, string];
  bestseller?: boolean;
  isNew?: boolean;
  rating: number;
  ratingCount: number;
};

const beverageCategories = ["Coffee", "Milk Based", "Fruit Based", "Tea", "Others"];
const foodCategories = ["Lite Bite", "Soup", "Pasta", "Indonesian", "Rice Bowl", "Meat", "Pastry", "Salad", "Add On"];
const homeCategories = ["Coffee", "Milk Based", "Fruit Based", "Tea", "Others", "Food"];

const g = (a: string, b: string): [string, string] => [a, b];

const PRODUCTS: Product[] = [
  { id: 1, name: "Americano", category: "Coffee", type: "beverage", price: 22000, desc: "Bold double-shot espresso, slow-poured over water for a clean, smooth finish.", gradient: g(NAVY, NAVY_SOFT), bestseller: true, rating: 4.8, ratingCount: 312 },
  { id: 2, name: "Espresso", category: "Coffee", type: "beverage", price: 20000, desc: "Concentrated shot from single-origin arabica beans, rich crema on top.", gradient: g(NAVY_DEEP, NAVY), rating: 4.7, ratingCount: 154 },
  { id: 3, name: "Cafe Latte", category: "Coffee", type: "beverage", price: 28000, desc: "Espresso balanced with silky steamed milk and a whisper of microfoam.", gradient: g("#2A356E", "#5A6BAE"), bestseller: true, rating: 4.9, ratingCount: 480 },
  { id: 4, name: "Cappuccino", category: "Coffee", type: "beverage", price: 28000, desc: "Equal parts espresso, steamed milk, and airy foam, finished with cocoa dust.", gradient: g("#232B5C", "#4A5580"), rating: 4.7, ratingCount: 201 },
  { id: 5, name: "Kopi Susu Gula Aren", category: "Coffee", type: "beverage", price: 25000, desc: "House signature: robust coffee, fresh milk, and real palm sugar.", gradient: g(NAVY, "#7A5C3E"), bestseller: true, rating: 4.9, ratingCount: 560 },
  { id: 6, name: "Piccolo Latte", category: "Coffee", type: "beverage", price: 24000, desc: "A smaller, stronger latte — espresso-forward with a touch of steamed milk.", gradient: g("#2E3A73", "#6B7FC9"), rating: 4.6, ratingCount: 98 },
  { id: 7, name: "Es Kopi Susu ER Lab", category: "Milk Based", type: "beverage", price: 26000, desc: "Our house blend over ice with fresh milk, brewed for an all-day sipper.", gradient: g("#3B4B8C", "#6B7FC9"), bestseller: true, rating: 4.8, ratingCount: 398 },
  { id: 8, name: "Matcha Latte", category: "Milk Based", type: "beverage", price: 30000, desc: "Ceremonial-grade matcha whisked with fresh milk for a smooth, earthy cup.", gradient: g("#4B6350", "#8CAE8A"), bestseller: true, rating: 4.8, ratingCount: 276 },
  { id: 9, name: "Chocolate Malt", category: "Milk Based", type: "beverage", price: 27000, desc: "Rich Belgian chocolate blended with malt for a comforting, velvety drink.", gradient: g("#4A3226", "#8A5A3E"), rating: 4.6, ratingCount: 143 },
  { id: 10, name: "Taro Latte", category: "Milk Based", type: "beverage", price: 29000, desc: "Creamy taro root blended with milk, subtly sweet with a violet hue.", gradient: g("#5A3E6E", "#9C7FC9"), rating: 4.5, ratingCount: 87 },
  { id: 11, name: "Yuzu Tea", category: "Fruit Based", type: "beverage", price: 25000, desc: "Bright Japanese citrus steeped with green tea, refreshing and tangy.", gradient: g(GOLD, "#E8D5B0"), rating: 4.7, ratingCount: 122 },
  { id: 12, name: "Strawberry Fizz", category: "Fruit Based", type: "beverage", price: 26000, desc: "Muddled strawberry, lime, and soda over ice — light and sparkling.", gradient: g("#B85C6B", "#E8A0A8"), rating: 4.6, ratingCount: 96 },
  { id: 13, name: "Lychee Splash", category: "Fruit Based", type: "beverage", price: 25000, desc: "Sweet lychee, a squeeze of lime, and cold-brew tea over ice.", gradient: g("#C9A876", "#EADCC0"), rating: 4.6, ratingCount: 74 },
  { id: 14, name: "English Breakfast Tea", category: "Tea", type: "beverage", price: 20000, desc: "Classic full-bodied black tea, steeped fresh, served hot or iced.", gradient: g("#5A4632", "#8A6E4E"), rating: 4.5, ratingCount: 65 },
  { id: 15, name: "Lemon Tea", category: "Tea", type: "beverage", price: 20000, desc: "Black tea brightened with fresh lemon, light and refreshing.", gradient: g("#8A7A3E", "#D6C97A"), rating: 4.4, ratingCount: 58 },
  { id: 16, name: "Thai Tea", category: "Tea", type: "beverage", price: 24000, desc: "Spiced black tea with condensed milk, bold color, bold flavor.", gradient: g("#B8622E", "#E8A868"), rating: 4.7, ratingCount: 110 },
  { id: 17, name: "Sparkling Coffee", category: "Others", type: "beverage", price: 27000, desc: "Cold-brew coffee topped with soda water for an effervescent lift.", gradient: g(NAVY, "#8CAE8A"), isNew: true, rating: 4.5, ratingCount: 41 },
  { id: 18, name: "Affogato", category: "Others", type: "beverage", price: 32000, desc: "A scoop of vanilla gelato drowned in a hot shot of espresso.", gradient: g(NAVY_DEEP, "#C9A876"), isNew: true, rating: 4.9, ratingCount: 88 },
  { id: 19, name: "French Fries", category: "Lite Bite", type: "food", price: 22000, desc: "Crispy golden fries, tossed with house seasoning salt.", gradient: g("#C9A876", "#E8D5B0"), rating: 4.5, ratingCount: 132 },
  { id: 20, name: "Chicken Popcorn", category: "Lite Bite", type: "food", price: 28000, desc: "Bite-sized crispy chicken, served with signature dip.", gradient: g("#B8622E", "#E8A868"), bestseller: true, rating: 4.7, ratingCount: 165 },
  { id: 21, name: "Cream Soup", category: "Soup", type: "food", price: 24000, desc: "Velvety mushroom cream soup, served warm with garlic toast.", gradient: g("#8A8060", "#D6CFB0"), rating: 4.4, ratingCount: 39 },
  { id: 22, name: "Aglio Olio", category: "Pasta", type: "food", price: 35000, desc: "Spaghetti tossed in garlic, olive oil, chili flakes, and herbs.", gradient: g("#8A7A3E", "#D6C97A"), rating: 4.6, ratingCount: 92 },
  { id: 23, name: "Carbonara", category: "Pasta", type: "food", price: 38000, desc: "Creamy egg-yolk sauce, smoked beef, and parmesan over fettuccine.", gradient: g("#5A4632", "#8A6E4E"), bestseller: true, rating: 4.8, ratingCount: 210 },
  { id: 24, name: "Nasi Goreng ER Lab", category: "Indonesian", type: "food", price: 32000, desc: "House fried rice with shredded chicken, egg, and pickles on the side.", gradient: g(NAVY, "#8A5A3E"), bestseller: true, rating: 4.8, ratingCount: 244 },
  { id: 25, name: "Chicken Katsu Rice Bowl", category: "Rice Bowl", type: "food", price: 36000, desc: "Crispy chicken katsu, curry sauce, and steamed rice in one bowl.", gradient: g("#B8622E", "#E8A868"), rating: 4.7, ratingCount: 118 },
  { id: 26, name: "Beef Steak Bites", category: "Meat", type: "food", price: 45000, desc: "Seared beef cubes with black pepper sauce and roasted potato.", gradient: g(NAVY_DEEP, "#6B7088"), rating: 4.6, ratingCount: 73 },
  { id: 27, name: "Butter Croissant", category: "Pastry", type: "food", price: 22000, desc: "Flaky, all-butter croissant baked fresh every morning.", gradient: g("#C9A876", "#EADCC0"), rating: 4.7, ratingCount: 140 },
  { id: 28, name: "Butter Cookies", category: "Pastry", type: "food", price: 18000, desc: "Crumbly house-made butter cookies, a perfect coffee companion.", gradient: g("#B89A6E", "#EADCC0"), rating: 4.5, ratingCount: 64 },
  { id: 29, name: "Caesar Salad", category: "Salad", type: "food", price: 28000, desc: "Crisp romaine, parmesan, croutons, and house caesar dressing.", gradient: g("#4B6350", "#8CAE8A"), rating: 4.4, ratingCount: 51 },
  { id: 30, name: "Extra Shot", category: "Add On", type: "food", price: 8000, desc: "Add an extra shot of espresso to any beverage.", gradient: g(NAVY, NAVY_SOFT), rating: 4.8, ratingCount: 30 },
  { id: 31, name: "Extra Milk", category: "Add On", type: "food", price: 6000, desc: "Add extra fresh milk to any beverage.", gradient: g("#9CA3AF", "#E7E8F0"), rating: 4.6, ratingCount: 22 },
];

const OUTLETS = [
  { id: 1, name: "ER Coffee Lab Summarecon", address: "Jl. Summarecon Raya No. 8, Bekasi", distance: "1.2 km", open: true, hours: "07.00 – 22.00" },
  { id: 2, name: "ER Coffee Lab Soekarno Hatta", address: "Jl. Soekarno Hatta No. 45, Bandung", distance: "3.5 km", open: true, hours: "07.00 – 22.00" },
  { id: 3, name: "ER Coffee Lab Turangga", address: "Jl. Turangga No. 12, Bandung", distance: "5.8 km", open: true, hours: "08.00 – 21.00" },
  { id: 4, name: "ER Coffee Lab Cianjur", address: "Jl. Raya Cianjur No. 3, Cianjur", distance: "12.4 km", open: false, hours: "08.00 – 20.00" },
];

const ONBOARD_SLIDES = [
  { title: "Discover Your Perfect Brew", body: "From bold espresso to delicate tea, find the cup made for your mood.", icon: Coffee },
  { title: "Fresh Coffee, Made For You", body: "Customize size, sweetness, and temperature — exactly how you like it.", icon: Sparkles },
  { title: "Order. Pick Up. Enjoy.", body: "Skip the line. Order ahead and track your brew in real time.", icon: BadgeCheck },
];

/* --------------------------------- LOGO ----------------------------------- */

const LogoMark = ({ size = 56, ring = "#FFFFFF", fill = NAVY }: { size?: number; ring?: string; fill?: string }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <circle cx="32" cy="32" r="31" stroke={ring} strokeWidth="1.5" fill={fill} />
    <path d="M22 30h20a1 1 0 0 1 1 1v3c0 5-4.5 9-10.5 9S22 39 22 34v-3a1 1 0 0 1 1-1z" stroke={ring} strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M43 31.5h1.6c1.6 0 2.9 1.2 2.9 2.7s-1.3 2.7-2.9 2.7H43" stroke={ring} strokeWidth="1.6" strokeLinecap="round" />
    <path d="M20 45h24" stroke={ring} strokeWidth="1.6" strokeLinecap="round" />
    <path d="M27 27c-1-1.4-1-2.6 0-4M31 27c-1-1.4-1-2.6 0-4M35 27c-1-1.4-1-2.6 0-4" stroke={ring} strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

/* ============================================================================
   MAIN APP
============================================================================ */

type Screen =
  | "splash" | "onboarding" | "login" | "register"
  | "home" | "menu" | "orders" | "rewards" | "profile"
  | "product" | "cart" | "checkout" | "success" | "tracking"
  | "store" | "orderDetail" | "search"
  | "personalInfo" | "savedAddresses" | "paymentMethods" | "notifications" | "helpSupport";

type CartItem = {
  cartId: string;
  productId: number;
  qty: number;
  size?: string;
  temperature?: string;
  sugar?: string;
  ice?: string;
  addOns: string[];
  unitPrice: number;
};

type PastOrder = {
  id: string;
  date: string;
  store: string;
  items: string;
  total: number;
  status: "Completed" | "Cancelled";
};

export default function ERCoffeeLabApp() {
  const [screen, setScreen] = useState<Screen>("splash");
  const [history, setHistory] = useState<Screen[]>([]);
  const [onboardIdx, setOnboardIdx] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  const [menuTab, setMenuTab] = useState<"beverage" | "food">("beverage");
  const [selectedCat, setSelectedCat] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const [favorites, setFavorites] = useState<Set<number>>(new Set([3, 5]));
  const [cart, setCart] = useState<CartItem[]>([]);
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);

  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [custSize, setCustSize] = useState("Regular");
  const [custTemp, setCustTemp] = useState("Iced");
  const [custSugar, setCustSugar] = useState("Normal");
  const [custIce, setCustIce] = useState("Normal");
  const [custAddOns, setCustAddOns] = useState<string[]>([]);
  const [custQty, setCustQty] = useState(1);

  const [orderType, setOrderType] = useState<"Pick Up" | "Delivery">("Pick Up");
  const [selectedOutlet, setSelectedOutlet] = useState(OUTLETS[0]);
  const [deliveryAddress, setDeliveryAddress] = useState("Jl. Melati No. 21, Bandung");
  const [paymentMethod, setPaymentMethod] = useState("QRIS");
  const [lastOrderNo, setLastOrderNo] = useState("");
  const [trackStep, setTrackStep] = useState(2);
  const [points, setPoints] = useState(850);

  const [activeOrders, setActiveOrders] = useState<{ id: string; store: string; items: string; total: number; eta: string }[]>([]);

  // Profile subpages
  const [profileName, setProfileName] = useState("Rangga Erlangga");
  const [profileEmail, setProfileEmail] = useState("rangga.erlangga@email.com");
  const [profilePhone, setProfilePhone] = useState("+62 813 1855 3810");
  const [profileGender, setProfileGender] = useState<"Male" | "Female">("Male");
  const [profileSaved, setProfileSaved] = useState(false);

  const [savedAddresses, setSavedAddresses] = useState([
    { id: 1, label: "Home", recipient: "Rangga Erlangga", address: "Jl. Melati No. 21, Bandung", isDefault: true },
    { id: 2, label: "Office", recipient: "Rangga Erlangga", address: "Jl. Braga No. 10, Bandung", isDefault: false },
  ]);
  const [newAddressOpen, setNewAddressOpen] = useState(false);
  const [newAddressLabel, setNewAddressLabel] = useState("");
  const [newAddressText, setNewAddressText] = useState("");

  const [paymentMethodsList, setPaymentMethodsList] = useState([
    { id: 1, type: "E-Wallet", name: "GoPay", detail: "0813-xxxx-3810", isDefault: true, icon: Wallet },
    { id: 2, type: "E-Wallet", name: "OVO", detail: "0813-xxxx-3810", isDefault: false, icon: Wallet },
    { id: 3, type: "Card", name: "BCA Debit", detail: "**** **** **** 4521", isDefault: false, icon: CreditCard },
  ]);
  const [newCardOpen, setNewCardOpen] = useState(false);
  const [newCardNumber, setNewCardNumber] = useState("");
  const [newCardName, setNewCardName] = useState("");

  const [notifSettings, setNotifSettings] = useState({
    orderUpdates: true,
    promotions: true,
    rewards: true,
    appUpdates: false,
  });
  const notifHistory = [
    { id: 1, title: "Your order is ready for pickup", body: "Order #ERCL-098213 is ready at ER Coffee Lab Summarecon.", time: "2 hours ago", read: false },
    { id: 2, title: "25% Off Soft Launching Promo", body: "Enjoy 25% off all menu at ER Coffee Lab Edelweiss Turangga.", time: "1 day ago", read: true },
    { id: 3, title: "You've earned 120 points", body: "Thanks for your recent order! Points have been added to your account.", time: "3 days ago", read: true },
  ];

  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [pastOrders] = useState<PastOrder[]>([
    { id: "ERCL-098213", date: "3 Aug 2026", store: "ER Coffee Lab Summarecon", items: "Cafe Latte, Butter Croissant", total: 50000, status: "Completed" },
    { id: "ERCL-097650", date: "28 Jul 2026", store: "ER Coffee Lab Soekarno Hatta", items: "Kopi Susu Gula Aren x2", total: 50000, status: "Completed" },
    { id: "ERCL-096312", date: "19 Jul 2026", store: "ER Coffee Lab Turangga", items: "Matcha Latte, Nasi Goreng ER Lab", total: 62000, status: "Completed" },
  ]);

  // Splash auto-advance
  useEffect(() => {
    if (screen === "splash") {
      const t = setTimeout(() => setScreen("onboarding"), 2200);
      return () => clearTimeout(t);
    }
  }, [screen]);

  const nav = (s: Screen) => {
    setHistory((h) => [...h, screen]);
    setScreen(s);
  };
  const back = () => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const copy = [...h];
      const prev = copy.pop() as Screen;
      setScreen(prev);
      return copy;
    });
  };

  const openProduct = (p: Product) => {
    setActiveProduct(p);
    setCustSize("Regular");
    setCustTemp("Iced");
    setCustSugar("Normal");
    setCustIce("Normal");
    setCustAddOns([]);
    setCustQty(1);
    nav("product");
  };

  const toggleFavorite = (id: number) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAddOn = (name: string) => {
    setCustAddOns((prev) => (prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name]));
  };

  const unitPriceFor = (p: Product) => {
    let price = p.price;
    if (p.type === "beverage" && custSize === "Large") price += 5000;
    if (custAddOns.includes("Extra Shot")) price += 8000;
    if (custAddOns.includes("Extra Milk")) price += 6000;
    return price;
  };

  const addToCart = () => {
    if (!activeProduct) return;
    const item: CartItem = {
      cartId: `${activeProduct.id}-${Date.now()}`,
      productId: activeProduct.id,
      qty: custQty,
      size: activeProduct.type === "beverage" ? custSize : undefined,
      temperature: activeProduct.type === "beverage" ? custTemp : undefined,
      sugar: activeProduct.type === "beverage" ? custSugar : undefined,
      ice: activeProduct.type === "beverage" && custTemp === "Iced" ? custIce : undefined,
      addOns: custAddOns,
      unitPrice: unitPriceFor(activeProduct),
    };
    setCart((c) => [...c, item]);
    nav("cart");
  };

  const removeFromCart = (cartId: string) => setCart((c) => c.filter((i) => i.cartId !== cartId));
  const changeQty = (cartId: string, delta: number) =>
    setCart((c) => c.map((i) => (i.cartId === cartId ? { ...i, qty: Math.max(1, i.qty + delta) } : i)));

  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);
  const subtotal = cart.reduce((sum, i) => sum + i.unitPrice * i.qty, 0);
  const discount = promoApplied ? Math.round(subtotal * 0.15) : 0;
  const serviceFee = cart.length > 0 ? 2000 : 0;
  const total = subtotal - discount + serviceFee;

  const filteredProducts = useMemo(() => {
    let list = PRODUCTS.filter((p) => p.type === menuTab);
    if (selectedCat !== "All") list = list.filter((p) => p.category === selectedCat);
    if (searchQuery.trim()) list = list.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return list;
  }, [menuTab, selectedCat, searchQuery]);

  const placeOrder = () => {
    const orderNo = `ERCL-${Math.floor(100000 + Math.random() * 899999)}`;
    setLastOrderNo(orderNo);
    setActiveOrders((prev) => [
      { id: orderNo, store: orderType === "Pick Up" ? selectedOutlet.name : "Delivery — " + deliveryAddress, items: `${cart.length} item${cart.length > 1 ? "s" : ""}`, total, eta: "10 minutes" },
      ...prev,
    ]);
    setPoints((p) => p + Math.round(total / 5000));
    setCart([]);
    setPromoApplied(false);
    setPromoCode("");
    setTrackStep(2);
    nav("success");
  };

  const productById = (id: number) => PRODUCTS.find((p) => p.id === id)!;

  /* ------------------------------- SUBSCREENS ------------------------------ */

  const StatusBar = ({ dark = false }: { dark?: boolean }) => (
    <div className={`flex items-center justify-between px-6 pt-3 pb-1 text-[13px] font-semibold ${dark ? "text-white" : "text-[#181F4B]"}`}>
      <span>9:41</span>
      <div className="flex items-center gap-1.5">
        <div className={`w-4 h-3 rounded-[2px] border ${dark ? "border-white/80" : "border-[#181F4B]/80"} relative`}>
          <div className={`absolute inset-[1.5px] rounded-[1px] ${dark ? "bg-white/80" : "bg-[#181F4B]/80"}`} style={{ width: "70%" }} />
        </div>
      </div>
    </div>
  );

  const BottomNav = () => {
    const items: { key: Screen; label: string; icon: any }[] = [
      { key: "home", label: "Home", icon: HomeIcon },
      { key: "menu", label: "Menu", icon: Coffee },
      { key: "orders", label: "Orders", icon: Receipt },
      { key: "rewards", label: "Rewards", icon: Gift },
      { key: "profile", label: "Profile", icon: User },
    ];
    return (
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-[#E7E8F0] px-2 pt-2 pb-6 flex items-center justify-between z-30">
        {items.map(({ key, label, icon: Icon }) => {
          const active = screen === key;
          return (
            <button
              key={key}
              onClick={() => setScreen(key)}
              className="flex-1 flex flex-col items-center gap-1 py-1 active:scale-95 transition-transform"
            >
              <Icon size={21} strokeWidth={active ? 2.4 : 1.8} color={active ? NAVY : "#9CA3AF"} />
              <span className={`text-[10.5px] ${active ? "font-bold" : "font-medium"}`} style={{ color: active ? NAVY : "#9CA3AF" }}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    );
  };

  const BackHeader = ({ title, onBack, right }: { title: string; onBack: () => void; right?: React.ReactNode }) => (
    <div className="flex items-center justify-between px-5 pt-4 pb-3">
      <button onClick={onBack} className="w-9 h-9 rounded-full bg-[#F4F5F9] flex items-center justify-center active:scale-90 transition-transform">
        <ArrowLeft size={18} color={NAVY} />
      </button>
      <h1 className="font-serif text-[17px] font-semibold" style={{ color: NAVY }}>{title}</h1>
      {right ? right : <div className="w-9" />}
    </div>
  );

  const ProductImg = ({ p, className = "" }: { p: Product; className?: string }) => (
    <div
      className={`relative flex items-center justify-center overflow-hidden ${className}`}
      style={{ backgroundImage: `linear-gradient(135deg, ${p.gradient[0]}, ${p.gradient[1]})` }}
    >
      <Coffee size={Math.min(40, 999)} className="opacity-90" color="#fff" />
      {p.bestseller && (
        <span className="absolute top-2 left-2 bg-white/95 text-[9.5px] font-bold px-2 py-[3px] rounded-full tracking-wide" style={{ color: NAVY }}>
          BEST SELLER
        </span>
      )}
      {p.isNew && !p.bestseller && (
        <span className="absolute top-2 left-2 text-[9.5px] font-bold px-2 py-[3px] rounded-full tracking-wide text-white" style={{ backgroundColor: GOLD }}>
          NEW
        </span>
      )}
    </div>
  );

  const ProductCard = ({ p }: { p: Product }) => (
    <button
      onClick={() => openProduct(p)}
      className="text-left bg-white rounded-2xl overflow-hidden border border-[#EEEFF5] shadow-[0_2px_10px_rgba(24,31,75,0.06)] active:scale-[0.98] transition-transform w-full"
    >
      <ProductImg p={p} className="h-28 w-full" />
      <div className="p-3">
        <div className="flex items-start justify-between gap-1">
          <p className="font-semibold text-[13.5px] leading-tight" style={{ color: NAVY }}>{p.name}</p>
          <button
            onClick={(e) => { e.stopPropagation(); toggleFavorite(p.id); }}
            className="shrink-0 -mt-0.5 -mr-0.5"
          >
            <Heart size={16} fill={favorites.has(p.id) ? "#C9576B" : "none"} color={favorites.has(p.id) ? "#C9576B" : "#C7CAD9"} />
          </button>
        </div>
        <p className="text-[11px] text-[#8B90A6] mt-1 leading-snug line-clamp-2">{p.desc}</p>
        <div className="flex items-center justify-between mt-2.5">
          <span className="font-bold text-[13px]" style={{ color: NAVY }}>{fmt(p.price)}</span>
          <button
            onClick={(e) => { e.stopPropagation(); openProduct(p); }}
            className="w-6 h-6 rounded-full flex items-center justify-center"
            style={{ backgroundColor: NAVY }}
          >
            <Plus size={13} color="#fff" />
          </button>
        </div>
      </div>
    </button>
  );

  /* -------- SPLASH -------- */
  const renderSplash = () => (
    <div className="h-full w-full flex flex-col items-center justify-center relative overflow-hidden" style={{ backgroundColor: NAVY }}>
      <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle at 30% 20%, #fff 0%, transparent 45%)" }} />
      <div className="animate-[fadeUp_0.8s_ease]">
        <LogoMark size={92} />
      </div>
      <p className="mt-5 text-white font-serif text-[24px] tracking-wide animate-[fadeUp_0.8s_ease_0.1s_both]">ER COFFEE LAB</p>
      <p className="text-[11px] tracking-[0.35em] text-white/50 mt-1 font-medium animate-[fadeUp_0.8s_ease_0.2s_both]">CRAFTED. BREWED. SHARED.</p>
      <div className="absolute bottom-16 flex flex-col items-center gap-3">
        <div className="w-32 h-[3px] bg-white/15 rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ backgroundColor: GOLD, animation: "loadbar 2s ease forwards" }} />
        </div>
      </div>
    </div>
  );

  /* -------- ONBOARDING -------- */
  const renderOnboarding = () => {
    const slide = ONBOARD_SLIDES[onboardIdx];
    const Icon = slide.icon;
    return (
      <div className="h-full w-full flex flex-col bg-white">
        <div className="flex justify-end px-6 pt-6">
          <button onClick={() => { setOnboardIdx(0); nav("login"); }} className="text-[13px] font-semibold" style={{ color: INK_2 }}>Skip</button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-10 text-center">
          <div className="w-36 h-36 rounded-full flex items-center justify-center mb-9" style={{ background: `linear-gradient(135deg, ${NAVY}, ${NAVY_SOFT})` }}>
            <Icon size={54} color="#fff" strokeWidth={1.4} />
          </div>
          <h2 className="font-serif text-[23px] leading-tight font-semibold" style={{ color: NAVY }}>{slide.title}</h2>
          <p className="text-[13.5px] text-[#8B90A6] mt-3 leading-relaxed">{slide.body}</p>
        </div>
        <div className="px-6 pb-10">
          <div className="flex items-center justify-center gap-1.5 mb-7">
            {ONBOARD_SLIDES.map((_, i) => (
              <div key={i} className="h-[6px] rounded-full transition-all" style={{ width: i === onboardIdx ? 22 : 6, backgroundColor: i === onboardIdx ? NAVY : "#E1E3EE" }} />
            ))}
          </div>
          {onboardIdx < ONBOARD_SLIDES.length - 1 ? (
            <button onClick={() => setOnboardIdx((i) => i + 1)} className="w-full py-4 rounded-2xl text-white font-semibold text-[14.5px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform" style={{ backgroundColor: NAVY }}>
              Next <ArrowRight size={16} />
            </button>
          ) : (
            <button onClick={() => nav("login")} className="w-full py-4 rounded-2xl text-white font-semibold text-[14.5px] active:scale-[0.98] transition-transform" style={{ backgroundColor: NAVY }}>
              Get Started
            </button>
          )}
        </div>
      </div>
    );
  };

  /* -------- LOGIN -------- */
  const renderLogin = () => (
    <div className="h-full w-full bg-white flex flex-col px-7 pt-14 overflow-y-auto">
      <LogoMark size={48} />
      <h1 className="font-serif text-[25px] font-semibold mt-6" style={{ color: NAVY }}>Welcome back</h1>
      <p className="text-[13px] text-[#8B90A6] mt-1.5">Sign in to continue to ER Coffee Lab.</p>
      <div className="mt-8 space-y-4">
        <FieldInput icon={Mail} placeholder="Email or Phone Number" />
        <FieldInput icon={Lock} placeholder="Password" type={showPassword ? "text" : "password"} rightIcon={showPassword ? EyeOff : Eye} onRightIconClick={() => setShowPassword((s) => !s)} />
      </div>
      <button className="self-end text-[12.5px] font-semibold mt-3" style={{ color: NAVY }}>Forgot Password?</button>
      <button onClick={() => nav("home")} className="w-full py-4 rounded-2xl text-white font-semibold text-[14.5px] mt-7 active:scale-[0.98] transition-transform" style={{ backgroundColor: NAVY }}>
        Login
      </button>
      <div className="flex items-center gap-3 my-6">
        <div className="h-px flex-1 bg-[#EEEFF5]" />
        <span className="text-[11px] text-[#B4B8C9]">OR</span>
        <div className="h-px flex-1 bg-[#EEEFF5]" />
      </div>
      <p className="text-center text-[13px] text-[#8B90A6]">
        Don't have an account?{" "}
        <button onClick={() => nav("register")} className="font-bold" style={{ color: NAVY }}>Register</button>
      </p>
    </div>
  );

  /* -------- REGISTER -------- */
  const renderRegister = () => (
    <div className="h-full w-full bg-white flex flex-col px-7 pt-8 overflow-y-auto">
      <button onClick={back} className="w-9 h-9 rounded-full bg-[#F4F5F9] flex items-center justify-center mb-5">
        <ArrowLeft size={18} color={NAVY} />
      </button>
      <h1 className="font-serif text-[25px] font-semibold" style={{ color: NAVY }}>Create account</h1>
      <p className="text-[13px] text-[#8B90A6] mt-1.5">Join ER Coffee Lab and start earning rewards.</p>
      <div className="mt-7 space-y-4 pb-8">
        <FieldInput icon={User} placeholder="Full Name" />
        <FieldInput icon={Mail} placeholder="Email" />
        <FieldInput icon={Phone} placeholder="Phone Number" />
        <FieldInput icon={Lock} placeholder="Password" type="password" />
        <FieldInput icon={Lock} placeholder="Confirm Password" type="password" />
        <button onClick={() => nav("home")} className="w-full py-4 rounded-2xl text-white font-semibold text-[14.5px] mt-3 active:scale-[0.98] transition-transform" style={{ backgroundColor: NAVY }}>
          Create Account
        </button>
      </div>
    </div>
  );

  const FieldInput = ({ icon: Icon, rightIcon: RightIcon, onRightIconClick, ...props }: any) => (
    <div className="flex items-center gap-3 bg-[#F4F5F9] rounded-xl px-4 py-3.5 border border-transparent focus-within:border-[#181F4B]/30 transition-colors">
      <Icon size={17} color="#9CA3AF" />
      <input {...props} className="flex-1 bg-transparent outline-none text-[13.5px] placeholder:text-[#A6AABC]" style={{ color: NAVY }} />
      {RightIcon && (
        <button type="button" onClick={onRightIconClick}>
          <RightIcon size={17} color="#9CA3AF" />
        </button>
      )}
    </div>
  );

  /* -------- HOME -------- */
  const renderHome = () => (
    <div className="h-full w-full bg-white overflow-y-auto pb-24">
      <div className="px-5 pt-5 pb-5 rounded-b-[28px]" style={{ background: `linear-gradient(160deg, ${NAVY}, ${NAVY_DEEP})` }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => nav("profile")} className="w-11 h-11 rounded-full bg-white/15 flex items-center justify-center">
              <User size={19} color="#fff" />
            </button>
            <div>
              <p className="text-white/60 text-[11px]">Good Morning</p>
              <p className="text-white font-serif text-[15.5px] font-semibold">Coffee Lover ☕</p>
            </div>
          </div>
          <button className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center relative">
            <Bell size={17} color="#fff" />
            <span className="absolute top-2 right-2.5 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: GOLD }} />
          </button>
        </div>
        <button onClick={() => nav("store")} className="flex items-center gap-1.5 mt-4">
          <MapPin size={13} color={GOLD} />
          <span className="text-white text-[12.5px] font-medium">{selectedOutlet.name}</span>
          <ChevronDown size={13} color="#fff" className="opacity-70" />
        </button>
        <button onClick={() => nav("search")} className="w-full flex items-center gap-2.5 bg-white rounded-xl px-4 py-3 mt-4">
          <Search size={16} color="#9CA3AF" />
          <span className="text-[13px] text-[#A6AABC]">Search coffee, food, menu...</span>
        </button>
      </div>

      <div className="px-5 mt-5">
        <div className="rounded-2xl p-5 relative overflow-hidden" style={{ background: `linear-gradient(120deg, ${GOLD}, #E8D5B0)` }}>
          <p className="text-[10.5px] font-bold tracking-widest" style={{ color: NAVY }}>SPECIAL PROMO</p>
          <p className="font-serif text-[19px] font-bold mt-1" style={{ color: NAVY }}>Soft Launching Disc 25%</p>
          <p className="text-[11.5px] mt-1" style={{ color: NAVY }}>ER Coffee Lab Edelweiss Turangga · All Menu</p>
          <Sparkles size={70} className="absolute -right-3 -bottom-3 opacity-20" color={NAVY} />
        </div>
      </div>

      <div className="mt-6 px-5">
        <p className="font-serif text-[15px] font-semibold mb-3" style={{ color: NAVY }}>Category</p>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-1">
          {homeCategories.map((c) => (
            <button
              key={c}
              onClick={() => { setMenuTab(c === "Food" ? "food" : "beverage"); setSelectedCat(c === "Food" ? "All" : c); nav("menu"); }}
              className="flex flex-col items-center gap-2 shrink-0"
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: MIST }}>
                <Coffee size={20} color={NAVY} strokeWidth={1.6} />
              </div>
              <span className="text-[10.5px] font-medium" style={{ color: NAVY }}>{c}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-7 px-5">
        <div className="flex items-center justify-between mb-3">
          <p className="font-serif text-[15px] font-semibold" style={{ color: NAVY }}>Best Seller</p>
          <button onClick={() => { setMenuTab("beverage"); setSelectedCat("All"); nav("menu"); }} className="text-[11.5px] font-semibold" style={{ color: NAVY_SOFT }}>See All</button>
        </div>
        <div className="flex gap-3.5 overflow-x-auto no-scrollbar pb-1">
          {PRODUCTS.filter((p) => p.bestseller).map((p) => (
            <div key={p.id} className="w-[150px] shrink-0"><ProductCard p={p} /></div>
          ))}
        </div>
      </div>

      <div className="mt-7 px-5">
        <p className="font-serif text-[15px] font-semibold mb-3" style={{ color: NAVY }}>Recommended For You</p>
        <div className="grid grid-cols-2 gap-3.5">
          {PRODUCTS.filter((p) => p.isNew || [8, 12, 22, 27].includes(p.id)).slice(0, 4).map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      </div>

      <div className="mt-7 px-5">
        <p className="font-serif text-[15px] font-semibold mb-3" style={{ color: NAVY }}>Nearby Store</p>
        <div className="space-y-2.5">
          {OUTLETS.slice(0, 2).map((o) => (
            <button key={o.id} onClick={() => nav("store")} className="w-full flex items-center gap-3 bg-white border border-[#EEEFF5] rounded-xl p-3 shadow-[0_2px_10px_rgba(24,31,75,0.05)]">
              <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: MIST }}>
                <MapPin size={17} color={NAVY} />
              </div>
              <div className="flex-1 text-left">
                <p className="text-[12.5px] font-semibold" style={{ color: NAVY }}>{o.name}</p>
                <p className="text-[11px] text-[#8B90A6]">{o.distance} · {o.open ? "Open now" : "Closed"}</p>
              </div>
              <ChevronRight size={16} color="#C7CAD9" />
            </button>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );

  /* -------- SEARCH -------- */
  const renderSearch = () => (
    <div className="h-full w-full bg-white flex flex-col">
      <div className="flex items-center gap-3 px-5 pt-5 pb-3">
        <button onClick={back}><ArrowLeft size={19} color={NAVY} /></button>
        <div className="flex-1 flex items-center gap-2.5 bg-[#F4F5F9] rounded-xl px-4 py-3">
          <Search size={16} color="#9CA3AF" />
          <input autoFocus value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search coffee, food, menu..." className="flex-1 bg-transparent outline-none text-[13.5px]" style={{ color: NAVY }} />
          {searchQuery && <button onClick={() => setSearchQuery("")}><X size={15} color="#9CA3AF" /></button>}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-5 pb-6">
        {searchQuery.trim() === "" ? (
          <div className="mt-8">
            <p className="text-[12.5px] font-semibold mb-3" style={{ color: INK_2 }}>Popular Searches</p>
            <div className="flex flex-wrap gap-2">
              {["Americano", "Matcha Latte", "Nasi Goreng", "Kopi Susu", "Croissant"].map((t) => (
                <button key={t} onClick={() => setSearchQuery(t)} className="px-3.5 py-2 rounded-full bg-[#F4F5F9] text-[12px] font-medium" style={{ color: NAVY }}>{t}</button>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3.5 mt-4">
            {PRODUCTS.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map((p) => <ProductCard key={p.id} p={p} />)}
            {PRODUCTS.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
              <p className="col-span-2 text-center text-[12.5px] text-[#8B90A6] mt-10">No results for "{searchQuery}"</p>
            )}
          </div>
        )}
      </div>
    </div>
  );

  /* -------- MENU -------- */
  const renderMenu = () => {
    const cats = menuTab === "beverage" ? beverageCategories : foodCategories;
    return (
      <div className="h-full w-full bg-white flex flex-col pb-24">
        <div className="px-5 pt-5 pb-3">
          <p className="font-serif text-[19px] font-semibold" style={{ color: NAVY }}>Menu</p>
          <button onClick={() => nav("search")} className="w-full flex items-center gap-2.5 bg-[#F4F5F9] rounded-xl px-4 py-3 mt-3">
            <Search size={16} color="#9CA3AF" />
            <span className="text-[13px] text-[#A6AABC]">Search menu...</span>
          </button>
          <div className="flex bg-[#F4F5F9] rounded-xl p-1 mt-3.5">
            {(["beverage", "food"] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setMenuTab(t); setSelectedCat("All"); }}
                className="flex-1 py-2.5 rounded-lg text-[13px] font-semibold transition-colors"
                style={{ backgroundColor: menuTab === t ? NAVY : "transparent", color: menuTab === t ? "#fff" : INK_2 }}
              >
                {t === "beverage" ? "Beverage" : "Food"}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar px-5 pb-3">
          {["All", ...cats].map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCat(c)}
              className="shrink-0 px-4 py-2 rounded-full text-[12px] font-semibold border transition-colors"
              style={{
                backgroundColor: selectedCat === c ? NAVY : "#fff",
                color: selectedCat === c ? "#fff" : INK_2,
                borderColor: selectedCat === c ? NAVY : LINE,
              }}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto px-5">
          <div className="grid grid-cols-2 gap-3.5 pb-4">
            {filteredProducts.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
          {filteredProducts.length === 0 && <p className="text-center text-[12.5px] text-[#8B90A6] mt-10">No items in this category.</p>}
        </div>
        <BottomNav />
      </div>
    );
  };

  /* -------- PRODUCT DETAIL -------- */
  const renderProduct = () => {
    if (!activeProduct) return null;
    const p = activeProduct;
    const isBev = p.type === "beverage";
    const price = unitPriceFor(p) * custQty;
    return (
      <div className="h-full w-full bg-white flex flex-col">
        <div className="flex-1 overflow-y-auto pb-32">
          <div className="relative h-56">
            <ProductImg p={p} className="h-full w-full" />
            <button onClick={back} className="absolute top-4 left-4 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center">
              <ArrowLeft size={17} color={NAVY} />
            </button>
            <button onClick={() => toggleFavorite(p.id)} className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center">
              <Heart size={16} fill={favorites.has(p.id) ? "#C9576B" : "none"} color={favorites.has(p.id) ? "#C9576B" : NAVY} />
            </button>
          </div>
          <div className="px-5 pt-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-serif text-[21px] font-semibold" style={{ color: NAVY }}>{p.name}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Star size={13} fill={GOLD} color={GOLD} />
                  <span className="text-[12px] font-semibold" style={{ color: NAVY }}>{p.rating}</span>
                  <span className="text-[11.5px] text-[#8B90A6]">({p.ratingCount} reviews)</span>
                </div>
              </div>
              <p className="font-bold text-[17px]" style={{ color: NAVY }}>{fmt(p.price)}</p>
            </div>
            <p className="text-[13px] text-[#8B90A6] mt-3 leading-relaxed">{p.desc}</p>

            {isBev && (
              <>
                <OptionGroup title="Size" options={["Regular", "Large"]} value={custSize} onChange={setCustSize} priceHint={{ Large: "+Rp5.000" }} />
                <OptionGroup title="Temperature" options={["Hot", "Iced"]} value={custTemp} onChange={setCustTemp} icons={{ Hot: Flame, Iced: Snowflake }} />
                <OptionGroup title="Sugar" options={["Normal", "Less", "No Sugar"]} value={custSugar} onChange={setCustSugar} />
                {custTemp === "Iced" && <OptionGroup title="Ice" options={["Normal", "Less", "No Ice"]} value={custIce} onChange={setCustIce} />}
                <div className="mt-6">
                  <p className="text-[13px] font-semibold mb-2.5" style={{ color: NAVY }}>Add On</p>
                  <div className="space-y-2">
                    {["Extra Shot", "Extra Milk"].map((a) => {
                      const checked = custAddOns.includes(a);
                      return (
                        <button key={a} onClick={() => toggleAddOn(a)} className="w-full flex items-center justify-between px-4 py-3 rounded-xl border" style={{ borderColor: checked ? NAVY : LINE, backgroundColor: checked ? MIST : "#fff" }}>
                          <div className="flex items-center gap-2.5">
                            <Milk size={16} color={NAVY} />
                            <span className="text-[13px] font-medium" style={{ color: NAVY }}>{a}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] text-[#8B90A6]">+{fmt(a === "Extra Shot" ? 8000 : 6000)}</span>
                            <div className="w-5 h-5 rounded-md border-2 flex items-center justify-center" style={{ borderColor: checked ? NAVY : "#C7CAD9", backgroundColor: checked ? NAVY : "transparent" }}>
                              {checked && <Check size={12} color="#fff" />}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            <div className="mt-7 flex items-center justify-between">
              <p className="text-[13px] font-semibold" style={{ color: NAVY }}>Quantity</p>
              <div className="flex items-center gap-4 bg-[#F4F5F9] rounded-full px-1 py-1">
                <button onClick={() => setCustQty((q) => Math.max(1, q - 1))} className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                  <Minus size={14} color={NAVY} />
                </button>
                <span className="text-[14px] font-bold w-4 text-center" style={{ color: NAVY }}>{custQty}</span>
                <button onClick={() => setCustQty((q) => q + 1)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: NAVY }}>
                  <Plus size={14} color="#fff" />
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-[#EEEFF5] p-5">
          <button onClick={addToCart} className="w-full py-4 rounded-2xl text-white font-semibold text-[14.5px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform" style={{ backgroundColor: NAVY }}>
            Add to Cart · {fmt(price)}
          </button>
        </div>
      </div>
    );
  };

  const OptionGroup = ({ title, options, value, onChange, icons, priceHint }: { title: string; options: string[]; value: string; onChange: (v: string) => void; icons?: Record<string, any>; priceHint?: Record<string, string> }) => (
    <div className="mt-6">
      <p className="text-[13px] font-semibold mb-2.5" style={{ color: NAVY }}>{title}</p>
      <div className="flex gap-2.5 flex-wrap">
        {options.map((o) => {
          const active = value === o;
          const Icon = icons?.[o];
          return (
            <button
              key={o}
              onClick={() => onChange(o)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-[12.5px] font-semibold"
              style={{ borderColor: active ? NAVY : LINE, backgroundColor: active ? NAVY : "#fff", color: active ? "#fff" : NAVY }}
            >
              {Icon && <Icon size={13} />}
              {o}{priceHint?.[o] ? <span className="opacity-70 font-normal ml-0.5">{priceHint[o]}</span> : ""}
            </button>
          );
        })}
      </div>
    </div>
  );

  /* -------- CART -------- */
  const renderCart = () => (
    <div className="h-full w-full bg-white flex flex-col">
      <BackHeader title="My Cart" onBack={back} />
      {cart.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-10 text-center">
          <ShoppingCart size={44} color="#C7CAD9" strokeWidth={1.3} />
          <p className="text-[13.5px] text-[#8B90A6] mt-4">Your cart is empty. Add something delicious!</p>
          <button onClick={() => nav("menu")} className="mt-5 px-6 py-3 rounded-xl text-white font-semibold text-[13px]" style={{ backgroundColor: NAVY }}>Browse Menu</button>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-5 pb-4">
            <div className="space-y-3">
              {cart.map((item) => {
                const p = productById(item.productId);
                const details = [item.size, item.temperature, item.sugar && `${item.sugar} Sugar`, item.ice && `${item.ice} Ice`, ...item.addOns].filter(Boolean).join(" · ");
                return (
                  <div key={item.cartId} className="flex gap-3 bg-white border border-[#EEEFF5] rounded-xl p-3 shadow-[0_2px_10px_rgba(24,31,75,0.05)]">
                    <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0" style={{ backgroundImage: `linear-gradient(135deg, ${p.gradient[0]}, ${p.gradient[1]})` }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[13px] font-semibold truncate" style={{ color: NAVY }}>{p.name}</p>
                        <button onClick={() => removeFromCart(item.cartId)}><Trash2 size={14} color="#C7CAD9" /></button>
                      </div>
                      <p className="text-[10.5px] text-[#8B90A6] mt-0.5 leading-snug">{details || "No customization"}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[13px] font-bold" style={{ color: NAVY }}>{fmt(item.unitPrice * item.qty)}</span>
                        <div className="flex items-center gap-2.5 bg-[#F4F5F9] rounded-full px-1 py-0.5">
                          <button onClick={() => changeQty(item.cartId, -1)} className="w-6 h-6 rounded-full bg-white flex items-center justify-center"><Minus size={11} color={NAVY} /></button>
                          <span className="text-[12px] font-bold w-3 text-center" style={{ color: NAVY }}>{item.qty}</span>
                          <button onClick={() => changeQty(item.cartId, 1)} className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: NAVY }}><Plus size={11} color="#fff" /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 flex items-center gap-2.5 bg-[#F4F5F9] rounded-xl px-4 py-3">
              <Ticket size={16} color="#9CA3AF" />
              <input value={promoCode} onChange={(e) => setPromoCode(e.target.value)} placeholder="Enter Promo Code" className="flex-1 bg-transparent outline-none text-[13px]" style={{ color: NAVY }} />
              <button onClick={() => setPromoApplied(true)} className="text-[12px] font-bold" style={{ color: NAVY }}>Apply</button>
            </div>
            {promoApplied && (
              <div className="flex items-center gap-1.5 mt-2 text-[11.5px] font-semibold" style={{ color: "#3E8A5A" }}>
                <CheckCircle2 size={13} /> Promo applied — 15% off
              </div>
            )}

            <div className="mt-6 space-y-2">
              <Row label="Subtotal" value={fmt(subtotal)} />
              <Row label="Discount" value={discount ? `-${fmt(discount)}` : fmt(0)} valueColor={discount ? "#3E8A5A" : undefined} />
              <Row label="Service Fee" value={fmt(serviceFee)} />
              <div className="h-px bg-[#EEEFF5] my-1" />
              <Row label="Total" value={fmt(total)} bold />
            </div>
          </div>
          <div className="p-5 border-t border-[#EEEFF5]">
            <button onClick={() => nav("checkout")} className="w-full py-4 rounded-2xl text-white font-semibold text-[14.5px] active:scale-[0.98] transition-transform" style={{ backgroundColor: NAVY }}>
              Checkout · {fmt(total)}
            </button>
          </div>
        </>
      )}
    </div>
  );

  const Row = ({ label, value, bold, valueColor }: { label: string; value: string; bold?: boolean; valueColor?: string }) => (
    <div className="flex items-center justify-between">
      <span className={`text-[13px] ${bold ? "font-bold" : ""}`} style={{ color: bold ? NAVY : "#8B90A6" }}>{label}</span>
      <span className={`text-[13px] ${bold ? "font-bold text-[15px]" : "font-semibold"}`} style={{ color: valueColor || NAVY }}>{value}</span>
    </div>
  );

  /* -------- CHECKOUT -------- */
  const renderCheckout = () => (
    <div className="h-full w-full bg-white flex flex-col">
      <BackHeader title="Checkout" onBack={back} />
      <div className="flex-1 overflow-y-auto px-5 pb-4">
        <p className="text-[13px] font-semibold mb-2.5" style={{ color: NAVY }}>Order Type</p>
        <div className="flex bg-[#F4F5F9] rounded-xl p-1 mb-5">
          {(["Pick Up", "Delivery"] as const).map((t) => (
            <button key={t} onClick={() => setOrderType(t)} className="flex-1 py-2.5 rounded-lg text-[12.5px] font-semibold flex items-center justify-center gap-1.5" style={{ backgroundColor: orderType === t ? NAVY : "transparent", color: orderType === t ? "#fff" : INK_2 }}>
              {t === "Pick Up" ? <Package size={13} /> : <Truck size={13} />} {t}
            </button>
          ))}
        </div>

        {orderType === "Pick Up" ? (
          <div className="space-y-2 mb-6">
            <p className="text-[13px] font-semibold mb-1" style={{ color: NAVY }}>Select Outlet</p>
            {OUTLETS.map((o) => (
              <button key={o.id} onClick={() => setSelectedOutlet(o)} className="w-full flex items-center gap-3 border rounded-xl p-3" style={{ borderColor: selectedOutlet.id === o.id ? NAVY : LINE, backgroundColor: selectedOutlet.id === o.id ? MIST : "#fff" }}>
                <MapPin size={16} color={NAVY} />
                <div className="flex-1 text-left">
                  <p className="text-[12.5px] font-semibold" style={{ color: NAVY }}>{o.name}</p>
                  <p className="text-[11px] text-[#8B90A6]">{o.distance} · {o.open ? "Open" : "Closed"}</p>
                </div>
                <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0" style={{ borderColor: selectedOutlet.id === o.id ? NAVY : "#C7CAD9" }}>
                  {selectedOutlet.id === o.id && <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: NAVY }} />}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="mb-6">
            <p className="text-[13px] font-semibold mb-2" style={{ color: NAVY }}>Delivery Address</p>
            <div className="flex items-start gap-3 border rounded-xl p-3.5" style={{ borderColor: NAVY, backgroundColor: MIST }}>
              <Navigation size={16} color={NAVY} className="mt-0.5" />
              <div className="flex-1">
                <p className="text-[12.5px] font-semibold" style={{ color: NAVY }}>Home</p>
                <input value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} className="w-full bg-transparent outline-none text-[11.5px] text-[#8B90A6] mt-0.5" />
              </div>
            </div>
          </div>
        )}

        <p className="text-[13px] font-semibold mb-2.5" style={{ color: NAVY }}>Payment Method</p>
        <div className="space-y-2 mb-6">
          {[{ n: "Cash", icon: Wallet }, { n: "QRIS", icon: QrCode }, { n: "E-Wallet", icon: Wallet }, { n: "Card", icon: CreditCard }].map(({ n, icon: Icon }) => (
            <button key={n} onClick={() => setPaymentMethod(n)} className="w-full flex items-center gap-3 border rounded-xl p-3" style={{ borderColor: paymentMethod === n ? NAVY : LINE, backgroundColor: paymentMethod === n ? MIST : "#fff" }}>
              <Icon size={16} color={NAVY} />
              <span className="flex-1 text-left text-[12.5px] font-semibold" style={{ color: NAVY }}>{n}</span>
              <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0" style={{ borderColor: paymentMethod === n ? NAVY : "#C7CAD9" }}>
                {paymentMethod === n && <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: NAVY }} />}
              </div>
            </button>
          ))}
        </div>

        <div className="space-y-2 bg-[#F4F5F9] rounded-xl p-4">
          <Row label="Subtotal" value={fmt(subtotal)} />
          <Row label="Discount" value={discount ? `-${fmt(discount)}` : fmt(0)} valueColor={discount ? "#3E8A5A" : undefined} />
          <Row label="Service Fee" value={fmt(serviceFee)} />
          <div className="h-px bg-[#E7E8F0] my-1" />
          <Row label="Total" value={fmt(total)} bold />
        </div>
      </div>
      <div className="p-5 border-t border-[#EEEFF5]">
        <button onClick={placeOrder} className="w-full py-4 rounded-2xl text-white font-semibold text-[14.5px] active:scale-[0.98] transition-transform" style={{ backgroundColor: NAVY }}>
          Place Order
        </button>
      </div>
    </div>
  );

  /* -------- SUCCESS -------- */
  const renderSuccess = () => (
    <div className="h-full w-full bg-white flex flex-col items-center justify-center px-8 text-center">
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 animate-[popIn_0.5s_ease]" style={{ backgroundColor: "#E7F5EC" }}>
        <CheckCircle2 size={40} color="#3E8A5A" />
      </div>
      <h1 className="font-serif text-[22px] font-semibold" style={{ color: NAVY }}>Order Confirmed ✓</h1>
      <p className="text-[13px] text-[#8B90A6] mt-2">#{lastOrderNo}</p>
      <div className="w-full bg-[#F4F5F9] rounded-2xl p-5 mt-7 space-y-3">
        <Row label="Store" value={orderType === "Pick Up" ? selectedOutlet.name.replace("ER Coffee Lab ", "") : "Delivery"} />
        <Row label="Order Type" value={orderType} />
        <Row label="Estimated Time" value="10 minutes" />
        <div className="h-px bg-[#E7E8F0]" />
        <Row label="Total" value={fmt(total || activeOrders[0]?.total || 0)} bold />
      </div>
      <div className="w-full flex flex-col gap-3 mt-8">
        <button onClick={() => nav("tracking")} className="w-full py-4 rounded-2xl text-white font-semibold text-[14.5px] active:scale-[0.98] transition-transform" style={{ backgroundColor: NAVY }}>
          Track Order
        </button>
        <button onClick={() => setScreen("home")} className="w-full py-3.5 rounded-2xl font-semibold text-[13.5px]" style={{ color: NAVY }}>
          Back to Home
        </button>
      </div>
    </div>
  );

  /* -------- TRACKING -------- */
  const trackSteps = ["Order Received", "Payment Confirmed", "Preparing", "Ready", "Completed"];
  const renderTracking = () => {
    const pct = (trackStep / (trackSteps.length - 1)) * 100;
    return (
      <div className="h-full w-full bg-white flex flex-col">
        <BackHeader title="Order Tracking" onBack={() => setScreen("home")} />
        <div className="flex-1 overflow-y-auto px-6 pb-8">
          <div className="flex flex-col items-center mt-4 mb-8">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg width="144" height="144" viewBox="0 0 144 144" className="-rotate-90">
                <circle cx="72" cy="72" r="62" stroke="#EEEFF5" strokeWidth="10" fill="none" />
                <circle
                  cx="72" cy="72" r="62" stroke={NAVY} strokeWidth="10" fill="none" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 62}
                  strokeDashoffset={2 * Math.PI * 62 * (1 - pct / 100)}
                  style={{ transition: "stroke-dashoffset 0.6s ease" }}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <Coffee size={26} color={NAVY} />
                <p className="text-[11px] font-bold mt-1" style={{ color: NAVY }}>{trackSteps[trackStep]}</p>
              </div>
            </div>
            <p className="text-[12px] text-[#8B90A6] mt-4 flex items-center gap-1.5"><Clock size={13} /> Estimated time: 10 minutes</p>
            <p className="text-[11.5px] text-[#B4B8C9] mt-1">#{lastOrderNo || "ERCL-102938"}</p>
          </div>

          <div className="space-y-0">
            {trackSteps.map((s, i) => {
              const done = i <= trackStep;
              const isLast = i === trackSteps.length - 1;
              return (
                <div key={s} className="flex gap-3.5">
                  <div className="flex flex-col items-center">
                    {done ? <CheckCircle2 size={20} color={NAVY} /> : <Circle size={20} color="#D7D9E4" />}
                    {!isLast && <div className="w-[2px] flex-1 my-0.5" style={{ backgroundColor: i < trackStep ? NAVY : "#EEEFF5", minHeight: 28 }} />}
                  </div>
                  <div className="pb-7">
                    <p className="text-[13px] font-semibold" style={{ color: done ? NAVY : "#B4B8C9" }}>{s}</p>
                    {i === trackStep && <p className="text-[11px] mt-0.5" style={{ color: GOLD }}>In progress...</p>}
                  </div>
                </div>
              );
            })}
          </div>

          {trackStep < trackSteps.length - 1 && (
            <button onClick={() => setTrackStep((s) => Math.min(trackSteps.length - 1, s + 1))} className="w-full py-3.5 rounded-xl font-semibold text-[13px] mt-2" style={{ backgroundColor: MIST, color: NAVY }}>
              Simulate: Advance Status
            </button>
          )}
        </div>
      </div>
    );
  };

  /* -------- ORDERS -------- */
  const renderOrders = () => (
    <div className="h-full w-full bg-white flex flex-col pb-24">
      <div className="px-5 pt-5 pb-3">
        <p className="font-serif text-[19px] font-semibold" style={{ color: NAVY }}>Orders</p>
      </div>
      <div className="flex-1 overflow-y-auto px-5">
        {activeOrders.length > 0 && (
          <div className="mb-6">
            <p className="text-[12.5px] font-semibold mb-2.5" style={{ color: INK_2 }}>Active Orders</p>
            <div className="space-y-2.5">
              {activeOrders.map((o) => (
                <button key={o.id} onClick={() => nav("tracking")} className="w-full text-left border rounded-xl p-3.5" style={{ borderColor: NAVY, backgroundColor: MIST }}>
                  <div className="flex items-center justify-between">
                    <p className="text-[12.5px] font-bold" style={{ color: NAVY }}>#{o.id}</p>
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full text-white" style={{ backgroundColor: GOLD }}>PREPARING</span>
                  </div>
                  <p className="text-[11.5px] text-[#8B90A6] mt-1">{o.store}</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-[11.5px] text-[#8B90A6]">{o.items} · ETA {o.eta}</p>
                    <p className="text-[12.5px] font-bold" style={{ color: NAVY }}>{fmt(o.total)}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
        <div>
          <p className="text-[12.5px] font-semibold mb-2.5" style={{ color: INK_2 }}>Order History</p>
          <div className="space-y-2.5">
            {pastOrders.map((o) => (
              <div key={o.id} className="border border-[#EEEFF5] rounded-xl p-3.5">
                <div className="flex items-center justify-between">
                  <p className="text-[12.5px] font-bold" style={{ color: NAVY }}>#{o.id}</p>
                  <span className="text-[10px] font-semibold text-[#8B90A6]">{o.date}</span>
                </div>
                <p className="text-[11.5px] text-[#8B90A6] mt-1">{o.store}</p>
                <p className="text-[11.5px] text-[#8B90A6]">{o.items}</p>
                <div className="flex items-center justify-between mt-2.5">
                  <p className="text-[13px] font-bold" style={{ color: NAVY }}>{fmt(o.total)}</p>
                  <button onClick={() => { setMenuTab("beverage"); setSelectedCat("All"); nav("menu"); }} className="text-[11.5px] font-bold px-3.5 py-1.5 rounded-full" style={{ backgroundColor: NAVY, color: "#fff" }}>
                    Order Again
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );

  /* -------- REWARDS -------- */
  const renderRewards = () => (
    <div className="h-full w-full bg-white flex flex-col pb-24 overflow-y-auto">
      <div className="px-5 pt-6 pb-8 rounded-b-[28px]" style={{ background: `linear-gradient(160deg, ${NAVY}, ${NAVY_DEEP})` }}>
        <p className="text-white/60 text-[11px] font-semibold tracking-wide">ER COFFEE REWARDS</p>
        <div className="flex items-end gap-2 mt-2">
          <p className="text-white font-serif text-[32px] font-bold leading-none">{points}</p>
          <p className="text-white/70 text-[13px] mb-0.5">Points</p>
        </div>
        <div className="mt-4">
          <div className="w-full h-2 bg-white/15 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${Math.min(100, (points / 1000) * 100)}%`, backgroundColor: GOLD }} />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[11px] text-white/60">{points} / 1000</span>
            <span className="text-[11px] text-white/60">Gold Level</span>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4 bg-white/10 rounded-xl px-3 py-2.5 w-fit">
          <Award size={15} color={GOLD} />
          <span className="text-white text-[12px] font-semibold">Gold Member</span>
        </div>
      </div>

      <div className="px-5 mt-6">
        <p className="font-serif text-[15px] font-semibold mb-3" style={{ color: NAVY }}>Available Rewards</p>
        <div className="space-y-3">
          {[
            { name: "Free Coffee", cost: 500, icon: Coffee },
            { name: "20% Off Any Food", cost: 300, icon: Ticket },
            { name: "Free Size Upgrade", cost: 150, icon: TrendingUp },
          ].map((r) => {
            const Icon = r.icon;
            const can = points >= r.cost;
            return (
              <div key={r.name} className="flex items-center gap-3 border border-[#EEEFF5] rounded-xl p-3.5">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: MIST }}>
                  <Icon size={19} color={NAVY} />
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-semibold" style={{ color: NAVY }}>{r.name}</p>
                  <p className="text-[11.5px] text-[#8B90A6]">{r.cost} points</p>
                </div>
                <button
                  disabled={!can}
                  onClick={() => setPoints((p) => p - r.cost)}
                  className="text-[11.5px] font-bold px-4 py-2 rounded-full"
                  style={{ backgroundColor: can ? NAVY : "#EEEFF5", color: can ? "#fff" : "#B4B8C9" }}
                >
                  Redeem
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-5 mt-7">
        <p className="font-serif text-[15px] font-semibold mb-3" style={{ color: NAVY }}>How to Earn</p>
        <div className="bg-[#F4F5F9] rounded-xl p-4 text-[12px] text-[#6B7088] leading-relaxed">
          Earn 1 point for every Rp5.000 spent. Points can be redeemed for free drinks, discounts, and exclusive perks.
        </div>
      </div>
      <BottomNav />
    </div>
  );

  /* -------- PROFILE -------- */
  const renderProfile = () => {
    const menuItems = [
      { label: "Personal Information", icon: User, action: () => nav("personalInfo") },
      { label: "My Orders", icon: Receipt, action: () => nav("orders") },
      { label: "Favorites", icon: Heart },
      { label: "Rewards", icon: Gift, action: () => nav("rewards") },
      { label: "Saved Addresses", icon: MapPin, action: () => nav("savedAddresses") },
      { label: "Payment Methods", icon: CreditCard, action: () => nav("paymentMethods") },
      { label: "Notifications", icon: Bell, action: () => nav("notifications") },
      { label: "Help & Support", icon: HelpCircle, action: () => nav("helpSupport") },
    ];
    return (
      <div className="h-full w-full bg-white flex flex-col pb-24 overflow-y-auto">
        <div className="px-5 pt-6 pb-6" style={{ backgroundColor: MIST }}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: NAVY }}>
              <User size={26} color="#fff" />
            </div>
            <div>
              <p className="font-serif text-[17px] font-semibold" style={{ color: NAVY }}>{profileName}</p>
              <p className="text-[12px] text-[#8B90A6] mt-0.5">{profileEmail}</p>
              <p className="text-[12px] text-[#8B90A6]">{profilePhone}</p>
            </div>
          </div>
        </div>
        <div className="px-5 mt-4">
          {menuItems.map((m) => {
            const Icon = m.icon;
            return (
              <button key={m.label} onClick={m.action} className="w-full flex items-center gap-3.5 py-3.5 border-b border-[#F0F1F6]">
                <Icon size={18} color={NAVY_SOFT} />
                <span className="flex-1 text-left text-[13.5px] font-medium" style={{ color: NAVY }}>{m.label}</span>
                <ChevronRight size={16} color="#C7CAD9" />
              </button>
            );
          })}
          <button onClick={() => { setScreen("login"); setHistory([]); }} className="w-full flex items-center gap-3.5 py-4 mt-2">
            <LogOut size={18} color="#C9576B" />
            <span className="text-[13.5px] font-semibold" style={{ color: "#C9576B" }}>Logout</span>
          </button>
        </div>
        <BottomNav />
      </div>
    );
  };

  /* -------- TOGGLE SWITCH -------- */
  const Toggle = ({ on, onChange }: { on: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className="w-11 h-6 rounded-full relative transition-colors shrink-0"
      style={{ backgroundColor: on ? NAVY : "#E1E3EE" }}
    >
      <span
        className="absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-all"
        style={{ left: on ? 20 : 3 }}
      />
    </button>
  );

  /* -------- PERSONAL INFORMATION -------- */
  const renderPersonalInfo = () => (
    <div className="h-full w-full bg-white flex flex-col">
      <BackHeader title="Personal Information" onBack={back} />
      <div className="flex-1 overflow-y-auto px-5 pb-6">
        <div className="flex flex-col items-center py-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center relative" style={{ backgroundColor: NAVY }}>
            <User size={32} color="#fff" />
            <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white border-2 flex items-center justify-center" style={{ borderColor: MIST }}>
              <Pencil size={12} color={NAVY} />
            </button>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-[12px] font-semibold mb-1.5" style={{ color: INK_2 }}>Full Name</p>
            <FieldInput icon={User} placeholder="Full Name" value={profileName} onChange={(e: any) => { setProfileName(e.target.value); setProfileSaved(false); }} />
          </div>
          <div>
            <p className="text-[12px] font-semibold mb-1.5" style={{ color: INK_2 }}>Email</p>
            <FieldInput icon={Mail} placeholder="Email" value={profileEmail} onChange={(e: any) => { setProfileEmail(e.target.value); setProfileSaved(false); }} />
          </div>
          <div>
            <p className="text-[12px] font-semibold mb-1.5" style={{ color: INK_2 }}>Phone Number</p>
            <FieldInput icon={Phone} placeholder="Phone Number" value={profilePhone} onChange={(e: any) => { setProfilePhone(e.target.value); setProfileSaved(false); }} />
          </div>
          <div>
            <p className="text-[12px] font-semibold mb-1.5" style={{ color: INK_2 }}>Gender</p>
            <div className="flex gap-2.5">
              {(["Male", "Female"] as const).map((gd) => (
                <button
                  key={gd}
                  onClick={() => { setProfileGender(gd); setProfileSaved(false); }}
                  className="flex-1 py-3 rounded-xl border text-[12.5px] font-semibold"
                  style={{ borderColor: profileGender === gd ? NAVY : LINE, backgroundColor: profileGender === gd ? NAVY : "#fff", color: profileGender === gd ? "#fff" : NAVY }}
                >
                  {gd}
                </button>
              ))}
            </div>
          </div>
        </div>
        <button
          onClick={() => setProfileSaved(true)}
          className="w-full py-4 rounded-2xl text-white font-semibold text-[14.5px] mt-8 active:scale-[0.98] transition-transform"
          style={{ backgroundColor: NAVY }}
        >
          Save Changes
        </button>
        {profileSaved && (
          <div className="flex items-center justify-center gap-1.5 mt-3 text-[12px] font-semibold" style={{ color: "#3E8A5A" }}>
            <CheckCircle2 size={14} /> Changes saved
          </div>
        )}
      </div>
    </div>
  );

  /* -------- SAVED ADDRESSES -------- */
  const renderSavedAddresses = () => (
    <div className="h-full w-full bg-white flex flex-col">
      <BackHeader title="Saved Addresses" onBack={back} />
      <div className="flex-1 overflow-y-auto px-5 pb-6">
        <div className="space-y-3">
          {savedAddresses.map((a) => (
            <div key={a.id} className="border rounded-xl p-3.5" style={{ borderColor: a.isDefault ? NAVY : LINE, backgroundColor: a.isDefault ? MIST : "#fff" }}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#fff" }}>
                  <MapPin size={17} color={NAVY} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-semibold" style={{ color: NAVY }}>{a.label}</p>
                    {a.isDefault && (
                      <span className="text-[9.5px] font-bold px-2 py-[2px] rounded-full text-white" style={{ backgroundColor: NAVY }}>DEFAULT</span>
                    )}
                  </div>
                  <p className="text-[11.5px] text-[#8B90A6] mt-0.5">{a.recipient}</p>
                  <p className="text-[11.5px] text-[#8B90A6]">{a.address}</p>
                  <div className="flex items-center gap-4 mt-2.5">
                    {!a.isDefault && (
                      <button
                        onClick={() => setSavedAddresses((prev) => prev.map((x) => ({ ...x, isDefault: x.id === a.id })))}
                        className="text-[11.5px] font-bold"
                        style={{ color: NAVY }}
                      >
                        Set as Default
                      </button>
                    )}
                    <button
                      onClick={() => setSavedAddresses((prev) => prev.filter((x) => x.id !== a.id))}
                      className="text-[11.5px] font-bold flex items-center gap-1"
                      style={{ color: "#C9576B" }}
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {savedAddresses.length === 0 && <p className="text-center text-[12.5px] text-[#8B90A6] mt-8">No saved addresses yet.</p>}
        </div>

        {newAddressOpen ? (
          <div className="mt-4 border border-[#EEEFF5] rounded-xl p-4 space-y-3">
            <FieldInput icon={Tag} placeholder="Label (e.g. Home, Office)" value={newAddressLabel} onChange={(e: any) => setNewAddressLabel(e.target.value)} />
            <FieldInput icon={MapPin} placeholder="Full Address" value={newAddressText} onChange={(e: any) => setNewAddressText(e.target.value)} />
            <div className="flex gap-2.5">
              <button onClick={() => { setNewAddressOpen(false); setNewAddressLabel(""); setNewAddressText(""); }} className="flex-1 py-3 rounded-xl text-[12.5px] font-semibold" style={{ backgroundColor: MIST, color: NAVY }}>Cancel</button>
              <button
                disabled={!newAddressLabel.trim() || !newAddressText.trim()}
                onClick={() => {
                  setSavedAddresses((prev) => [...prev, { id: Date.now(), label: newAddressLabel, recipient: profileName, address: newAddressText, isDefault: prev.length === 0 }]);
                  setNewAddressOpen(false);
                  setNewAddressLabel("");
                  setNewAddressText("");
                }}
                className="flex-1 py-3 rounded-xl text-[12.5px] font-semibold text-white"
                style={{ backgroundColor: NAVY }}
              >
                Save Address
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setNewAddressOpen(true)} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-dashed mt-4 text-[12.5px] font-semibold" style={{ borderColor: NAVY_SOFT, color: NAVY }}>
            <Plus size={15} /> Add New Address
          </button>
        )}
      </div>
    </div>
  );

  /* -------- PAYMENT METHODS -------- */
  const renderPaymentMethods = () => (
    <div className="h-full w-full bg-white flex flex-col">
      <BackHeader title="Payment Methods" onBack={back} />
      <div className="flex-1 overflow-y-auto px-5 pb-6">
        <div className="space-y-3">
          {paymentMethodsList.map((pm) => {
            const Icon = pm.icon;
            return (
              <div key={pm.id} className="border rounded-xl p-3.5 flex items-center gap-3" style={{ borderColor: pm.isDefault ? NAVY : LINE, backgroundColor: pm.isDefault ? MIST : "#fff" }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "#fff" }}>
                  <Icon size={18} color={NAVY} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-semibold" style={{ color: NAVY }}>{pm.name}</p>
                    {pm.isDefault && <span className="text-[9.5px] font-bold px-2 py-[2px] rounded-full text-white" style={{ backgroundColor: NAVY }}>DEFAULT</span>}
                  </div>
                  <p className="text-[11.5px] text-[#8B90A6] mt-0.5">{pm.type} · {pm.detail}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  {!pm.isDefault && (
                    <button
                      onClick={() => setPaymentMethodsList((prev) => prev.map((x) => ({ ...x, isDefault: x.id === pm.id })))}
                      className="text-[10.5px] font-bold"
                      style={{ color: NAVY }}
                    >
                      Set Default
                    </button>
                  )}
                  <button onClick={() => setPaymentMethodsList((prev) => prev.filter((x) => x.id !== pm.id))}>
                    <Trash2 size={13} color="#C9576B" />
                  </button>
                </div>
              </div>
            );
          })}
          {paymentMethodsList.length === 0 && <p className="text-center text-[12.5px] text-[#8B90A6] mt-8">No payment methods saved.</p>}
        </div>

        {newCardOpen ? (
          <div className="mt-4 border border-[#EEEFF5] rounded-xl p-4 space-y-3">
            <FieldInput icon={CreditCard} placeholder="Card Number" value={newCardNumber} onChange={(e: any) => setNewCardNumber(e.target.value)} />
            <FieldInput icon={User} placeholder="Cardholder Name" value={newCardName} onChange={(e: any) => setNewCardName(e.target.value)} />
            <div className="flex gap-2.5">
              <button onClick={() => { setNewCardOpen(false); setNewCardNumber(""); setNewCardName(""); }} className="flex-1 py-3 rounded-xl text-[12.5px] font-semibold" style={{ backgroundColor: MIST, color: NAVY }}>Cancel</button>
              <button
                disabled={!newCardNumber.trim() || !newCardName.trim()}
                onClick={() => {
                  const last4 = newCardNumber.slice(-4).padStart(4, "•");
                  setPaymentMethodsList((prev) => [...prev, { id: Date.now(), type: "Card", name: newCardName, detail: `**** **** **** ${last4}`, isDefault: prev.length === 0, icon: CreditCard }]);
                  setNewCardOpen(false);
                  setNewCardNumber("");
                  setNewCardName("");
                }}
                className="flex-1 py-3 rounded-xl text-[12.5px] font-semibold text-white"
                style={{ backgroundColor: NAVY }}
              >
                Save Card
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setNewCardOpen(true)} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-dashed mt-4 text-[12.5px] font-semibold" style={{ borderColor: NAVY_SOFT, color: NAVY }}>
            <Plus size={15} /> Add Payment Method
          </button>
        )}
      </div>
    </div>
  );

  /* -------- NOTIFICATIONS -------- */
  const renderNotifications = () => (
    <div className="h-full w-full bg-white flex flex-col">
      <BackHeader title="Notifications" onBack={back} />
      <div className="flex-1 overflow-y-auto px-5 pb-6">
        <p className="text-[12.5px] font-semibold mb-2.5" style={{ color: INK_2 }}>Preferences</p>
        <div className="border border-[#EEEFF5] rounded-xl divide-y divide-[#F0F1F6] mb-6">
          {[
            { key: "orderUpdates" as const, label: "Order Updates", desc: "Status changes on your current orders" },
            { key: "promotions" as const, label: "Promotions", desc: "Discounts and special offers" },
            { key: "rewards" as const, label: "Rewards", desc: "Points earned and reward reminders" },
            { key: "appUpdates" as const, label: "App Updates", desc: "New features and announcements" },
          ].map((s) => (
            <div key={s.key} className="flex items-center gap-3 px-4 py-3.5">
              <div className="flex-1">
                <p className="text-[13px] font-semibold" style={{ color: NAVY }}>{s.label}</p>
                <p className="text-[11px] text-[#8B90A6] mt-0.5">{s.desc}</p>
              </div>
              <Toggle on={notifSettings[s.key]} onChange={() => setNotifSettings((prev) => ({ ...prev, [s.key]: !prev[s.key] }))} />
            </div>
          ))}
        </div>

        <p className="text-[12.5px] font-semibold mb-2.5" style={{ color: INK_2 }}>Recent</p>
        <div className="space-y-2.5">
          {notifHistory.map((n) => (
            <div key={n.id} className="flex gap-3 border border-[#EEEFF5] rounded-xl p-3.5" style={{ backgroundColor: n.read ? "#fff" : MIST }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#fff" }}>
                <Bell size={15} color={NAVY} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] font-semibold" style={{ color: NAVY }}>{n.title}</p>
                <p className="text-[11.5px] text-[#8B90A6] mt-0.5 leading-snug">{n.body}</p>
                <p className="text-[10.5px] text-[#B4B8C9] mt-1">{n.time}</p>
              </div>
              {!n.read && <div className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: GOLD }} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  /* -------- HELP & SUPPORT -------- */
  const HELP_FAQ = [
    { q: "How do I track my order?", a: "Go to Orders from the bottom navigation, tap an active order, and you'll see live status updates from preparation to pickup or delivery." },
    { q: "Can I change my order after placing it?", a: "Orders can't be edited once placed. Please contact the outlet directly via WhatsApp as soon as possible for urgent changes." },
    { q: "How do reward points work?", a: "You earn 1 point for every Rp5.000 spent. Points can be redeemed for free drinks, discounts, and other perks on the Rewards page." },
    { q: "What payment methods are accepted?", a: "We accept Cash, QRIS, E-Wallets (GoPay, OVO, DANA), and debit/credit cards at checkout." },
  ];
  const renderHelpSupport = () => (
    <div className="h-full w-full bg-white flex flex-col">
      <BackHeader title="Help & Support" onBack={back} />
      <div className="flex-1 overflow-y-auto px-5 pb-6">
        <p className="text-[12.5px] font-semibold mb-2.5" style={{ color: INK_2 }}>Contact Us</p>
        <div className="grid grid-cols-3 gap-2.5 mb-6">
          <a href="https://api.whatsapp.com/send?phone=6281318553810" target="_blank" rel="noreferrer" className="flex flex-col items-center gap-2 border border-[#EEEFF5] rounded-xl py-4">
            <MessageCircle size={19} color="#3E8A5A" />
            <span className="text-[10.5px] font-semibold" style={{ color: NAVY }}>WhatsApp</span>
          </a>
          <a href="mailto:hello@ercoffeelab.com" className="flex flex-col items-center gap-2 border border-[#EEEFF5] rounded-xl py-4">
            <Mail size={19} color={NAVY} />
            <span className="text-[10.5px] font-semibold" style={{ color: NAVY }}>Email</span>
          </a>
          <a href="https://www.instagram.com/ercoffeelabs/" target="_blank" rel="noreferrer" className="flex flex-col items-center gap-2 border border-[#EEEFF5] rounded-xl py-4">
            <Instagram size={19} color="#C9576B" />
            <span className="text-[10.5px] font-semibold" style={{ color: NAVY }}>Instagram</span>
          </a>
        </div>

        <p className="text-[12.5px] font-semibold mb-2.5" style={{ color: INK_2 }}>Frequently Asked Questions</p>
        <div className="space-y-2 mb-6">
          {HELP_FAQ.map((f, i) => {
            const open = openFaq === i;
            return (
              <div key={i} className="border border-[#EEEFF5] rounded-xl overflow-hidden">
                <button onClick={() => setOpenFaq(open ? null : i)} className="w-full flex items-center justify-between px-4 py-3.5">
                  <span className="text-[12.5px] font-semibold text-left pr-3" style={{ color: NAVY }}>{f.q}</span>
                  <ChevronDown size={15} color={NAVY} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                </button>
                {open && <p className="px-4 pb-3.5 text-[11.5px] text-[#8B90A6] leading-relaxed">{f.a}</p>}
              </div>
            );
          })}
        </div>

        <p className="text-[12.5px] font-semibold mb-2.5" style={{ color: INK_2 }}>Send Feedback</p>
        <textarea
          placeholder="Tell us how we can improve ER Coffee Lab..."
          rows={4}
          className="w-full bg-[#F4F5F9] rounded-xl px-4 py-3.5 text-[13px] outline-none placeholder:text-[#A6AABC] resize-none"
          style={{ color: NAVY }}
        />
        <button className="w-full py-3.5 rounded-xl text-white font-semibold text-[13px] mt-3" style={{ backgroundColor: NAVY }}>
          Submit Feedback
        </button>
      </div>
    </div>
  );

  /* -------- STORE LOCATION -------- */
  const renderStore = () => (
    <div className="h-full w-full bg-white flex flex-col">
      <BackHeader title="Select Outlet" onBack={back} />
      <div className="mx-5 rounded-2xl h-32 relative overflow-hidden mb-4" style={{ background: `linear-gradient(135deg, ${NAVY}, ${NAVY_SOFT})` }}>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 30%, #fff 0, transparent 30%), radial-gradient(circle at 70% 60%, #fff 0, transparent 25%), radial-gradient(circle at 50% 80%, #fff 0, transparent 20%)" }} />
        <MapPin size={26} color={GOLD} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        <span className="absolute bottom-2 right-3 text-[10px] text-white/60">Map preview (mock)</span>
      </div>
      <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-3">
        {OUTLETS.map((o) => (
          <div key={o.id} className="border border-[#EEEFF5] rounded-xl p-3.5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-[13.5px] font-semibold" style={{ color: NAVY }}>{o.name}</p>
                <p className="text-[11.5px] text-[#8B90A6] mt-1">{o.address}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-[11px] font-semibold flex items-center gap-1" style={{ color: o.open ? "#3E8A5A" : "#C9576B" }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: o.open ? "#3E8A5A" : "#C9576B" }} />
                    {o.open ? "Open now" : "Closed"}
                  </span>
                  <span className="text-[11px] text-[#8B90A6]">{o.hours}</span>
                  <span className="text-[11px] text-[#8B90A6]">· {o.distance}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => { setSelectedOutlet(o); back(); }}
              className="w-full mt-3 py-2.5 rounded-lg text-[12.5px] font-bold"
              style={{ backgroundColor: selectedOutlet.id === o.id ? MIST : NAVY, color: selectedOutlet.id === o.id ? NAVY : "#fff" }}
            >
              {selectedOutlet.id === o.id ? "Selected" : "Select This Outlet"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  /* ------------------------------- ROUTER ---------------------------------- */

  const withCartBadge = (content: React.ReactNode) => (
    <div className="relative h-full w-full">
      {content}
      {cartCount > 0 && !["cart", "checkout", "success", "tracking", "splash", "onboarding", "login", "register"].includes(screen) && (
        <button
          onClick={() => nav("cart")}
          className="absolute right-4 z-40 w-12 h-12 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          style={{ backgroundColor: NAVY, bottom: ["home", "menu", "orders", "rewards", "profile"].includes(screen) ? 96 : 24 }}
        >
          <ShoppingBag size={18} color="#fff" />
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: GOLD }}>
            {cartCount}
          </span>
        </button>
      )}
    </div>
  );

  const screens: Record<Screen, () => React.ReactNode> = {
    splash: renderSplash,
    onboarding: renderOnboarding,
    login: renderLogin,
    register: renderRegister,
    home: renderHome,
    menu: renderMenu,
    orders: renderOrders,
    rewards: renderRewards,
    profile: renderProfile,
    product: renderProduct,
    cart: renderCart,
    checkout: renderCheckout,
    success: renderSuccess,
    tracking: renderTracking,
    store: renderStore,
    orderDetail: renderOrders,
    search: renderSearch,
    personalInfo: renderPersonalInfo,
    savedAddresses: renderSavedAddresses,
    paymentMethods: renderPaymentMethods,
    notifications: renderNotifications,
    helpSupport: renderHelpSupport,
  };

  const showBottomNavScreens: Screen[] = ["home"];

  return (
    <div className="w-full min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: "#EEF0F6" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Manrope:wght@400;500;600;700;800&display=swap');
        * { font-family: 'Manrope', sans-serif; box-sizing: border-box; }
        .font-serif { font-family: 'Fraunces', serif; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px);} to { opacity: 1; transform: translateY(0);} }
        @keyframes loadbar { from { width: 0%; } to { width: 100%; } }
        @keyframes popIn { 0% { transform: scale(0.5); opacity: 0; } 80% { transform: scale(1.08); } 100% { transform: scale(1); opacity: 1; } }
        @keyframes screenIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .screen-anim { animation: screenIn 0.28s ease; }
      `}</style>

      <div
        className="relative bg-white overflow-hidden"
        style={{ width: 390, height: 844, borderRadius: 44, boxShadow: "0 30px 80px rgba(24,31,75,0.35)", border: "10px solid #0B0D22" }}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#0B0D22] rounded-b-2xl z-50" />
        <div className="h-full w-full flex flex-col relative">
          <div style={{ backgroundColor: ["splash", "home", "rewards"].includes(screen) ? NAVY : "#fff", flexShrink: 0 }}>
            <StatusBar dark={["splash", "home", "rewards"].includes(screen)} />
          </div>
          <div className="flex-1 relative overflow-hidden">
            <div key={screen} className="screen-anim h-full w-full">
              {withCartBadge(screens[screen]())}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
