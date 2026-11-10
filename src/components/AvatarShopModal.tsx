import React, { useState, useEffect } from 'react';
import {
  X,
  Coins,
  Sparkles,
  ShoppingBag,
  Check,
  Award,
  Crown,
  Zap,
  Smile,
  Shield,
  Bot,
  Heart,
  Palette,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundEffects } from '../utils/soundEffects.ts';
import { UserProfile } from '../types/index.ts';

export interface ShopItem {
  id: string;
  category: 'hat' | 'pet' | 'aura' | 'title';
  categoryLabel: string;
  name: string;
  nameEn: string;
  price: number;
  icon: string;
  preview: string;
  rarity: 'common' | 'rare' | 'legendary';
  description: string;
}

const SHOP_ITEMS: ShopItem[] = [
  // หมวก & แว่นตา
  {
    id: 'item_hat_coder',
    category: 'hat',
    categoryLabel: 'หมวก & แว่น',
    name: 'หมวกแก๊ป Coder Pro',
    nameEn: 'Coder Pro Cap',
    price: 30,
    icon: '🧢',
    preview: '🧢',
    rarity: 'common',
    description: 'หมวกแก๊ปสไตล์โปรแกรมเมอร์รุ่นเยาว์',
  },
  {
    id: 'item_vr_goggles',
    category: 'hat',
    categoryLabel: 'หมวก & แว่น',
    name: 'แว่นตา Cyber VR 3D',
    nameEn: 'Cyber VR Visor',
    price: 60,
    icon: '🥽',
    preview: '🥽',
    rarity: 'rare',
    description: 'แว่นตาส่องโลกเสมือนจริงเมตาเวิร์ส',
  },
  {
    id: 'item_crown_gold',
    category: 'hat',
    categoryLabel: 'หมวก & แว่น',
    name: 'มงกุฎทองคำราชันย์โค้ด',
    nameEn: 'Golden Code Crown',
    price: 120,
    icon: '👑',
    preview: '👑',
    rarity: 'legendary',
    description: 'มงกุฎเกียรติยศสำหรับผู้พิชิตทุกโมดูล',
  },

  // สัตว์เลี้ยง AI
  {
    id: 'item_pet_robot',
    category: 'pet',
    categoryLabel: 'สัตว์เลี้ยง AI',
    name: 'น้องหุ่นยนต์ Robodog AI',
    nameEn: 'Robo-Dog Companion',
    price: 50,
    icon: '🤖',
    preview: '🤖',
    rarity: 'rare',
    description: 'สุนัขกลไกช่วยตรวจจับบั๊กและข้อผิดพลาด',
  },
  {
    id: 'item_pet_drone',
    category: 'pet',
    categoryLabel: 'สัตว์เลี้ยง AI',
    name: 'โดรนจิ๋วลาดตระเวน IoT',
    nameEn: 'Mini IoT Drone',
    price: 75,
    icon: '🛸',
    preview: '🛸',
    rarity: 'rare',
    description: 'โดรนบินเก็บข้อมูลเซ็นเซอร์อัจฉริยะ',
  },
  {
    id: 'item_pet_cat',
    category: 'pet',
    categoryLabel: 'สัตว์เลี้ยง AI',
    name: 'แมวส้ม Scratch นำโชค',
    nameEn: 'Lucky Scratch Mascot',
    price: 90,
    icon: '🐱',
    preview: '🐱',
    rarity: 'legendary',
    description: 'แมวส้มสัญลักษณ์แห่งความคิดสร้างสรรค์บล็อกคำสั่ง',
  },

  // กรอบออร่าเรืองแสง
  {
    id: 'item_aura_neon',
    category: 'aura',
    categoryLabel: 'กรอบออร่า',
    name: 'กรอบออร่า Cyber Neon',
    nameEn: 'Neon Matrix Aura',
    price: 45,
    icon: '⚡',
    preview: 'border-cyan-400 ring-4 ring-cyan-400/40 shadow-cyan-500/50',
    rarity: 'rare',
    description: 'แสงออร่าสีฟ้านีออนล้ำอนาคต',
  },
  {
    id: 'item_aura_gold',
    category: 'aura',
    categoryLabel: 'กรอบออร่า',
    name: 'กรอบทองคำ Master Aura',
    nameEn: 'Golden Star Aura',
    price: 100,
    icon: '✨',
    preview: 'border-amber-400 ring-4 ring-amber-400/50 shadow-amber-500/60',
    rarity: 'legendary',
    description: 'ประกายดาวสีทองอร่ามของผู้เชี่ยวชาญ',
  },
  {
    id: 'item_aura_purple',
    category: 'aura',
    categoryLabel: 'กรอบออร่า',
    name: 'กรอบคอสมิกม่วงอวกาศ',
    nameEn: 'Cosmic Violet Aura',
    price: 70,
    icon: '🔮',
    preview: 'border-purple-500 ring-4 ring-purple-500/40 shadow-purple-500/50',
    rarity: 'rare',
    description: 'ละอองดาวอวกาศสีม่วงลึกลับ',
  },

  // ป้ายฉายา
  {
    id: 'item_title_algo',
    category: 'title',
    categoryLabel: 'ป้ายฉายา',
    name: 'ป้าย: เจ้าแห่งอัลกอริทึม',
    nameEn: 'Algorithm Master',
    price: 40,
    icon: '🧠',
    preview: 'เจ้าแห่งอัลกอริทึม 🧠',
    rarity: 'common',
    description: 'ฉายาพิเศษติดท้ายชื่อโปรไฟล์',
  },
  {
    id: 'item_title_hacker',
    category: 'title',
    categoryLabel: 'ป้ายฉายา',
    name: 'ป้าย: นักล่าบั๊กขั้นเทพ',
    nameEn: 'Master Bug Hunter',
    price: 80,
    icon: '🐞',
    preview: 'นักล่าบั๊กขั้นเทพ 🐞',
    rarity: 'rare',
    description: 'ฉายาผู้เชี่ยวชาญการดีบั๊กและตรวจสอบโค้ด',
  },
];

interface AvatarShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  points: number;
  profile: UserProfile;
  onDeductPoints?: (amount: number, reason: string) => void;
  onUpdateProfile?: (updated: UserProfile) => void;
}

export const AvatarShopModal: React.FC<AvatarShopModalProps> = ({
  isOpen,
  onClose,
  points,
  profile,
  onDeductPoints,
  onUpdateProfile,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'hat' | 'pet' | 'aura' | 'title'>('all');
  const [ownedItems, setOwnedItems] = useState<string[]>(() => {
    const saved = localStorage.getItem('coderkids_owned_shop_items');
    return saved ? JSON.parse(saved) : ['item_hat_coder'];
  });

  const [equippedHat, setEquippedHat] = useState<string | null>(() => {
    return localStorage.getItem('coderkids_equipped_hat') || 'item_hat_coder';
  });
  const [equippedPet, setEquippedPet] = useState<string | null>(() => {
    return localStorage.getItem('coderkids_equipped_pet') || null;
  });
  const [equippedAura, setEquippedAura] = useState<string | null>(() => {
    return localStorage.getItem('coderkids_equipped_aura') || null;
  });
  const [equippedTitle, setEquippedTitle] = useState<string | null>(() => {
    return localStorage.getItem('coderkids_equipped_title') || null;
  });
  const [shopNotice, setShopNotice] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('coderkids_owned_shop_items', JSON.stringify(ownedItems));
  }, [ownedItems]);

  useEffect(() => {
    if (equippedHat) localStorage.setItem('coderkids_equipped_hat', equippedHat);
    else localStorage.removeItem('coderkids_equipped_hat');
  }, [equippedHat]);

  useEffect(() => {
    if (equippedPet) localStorage.setItem('coderkids_equipped_pet', equippedPet);
    else localStorage.removeItem('coderkids_equipped_pet');
  }, [equippedPet]);

  useEffect(() => {
    if (equippedAura) localStorage.setItem('coderkids_equipped_aura', equippedAura);
    else localStorage.removeItem('coderkids_equipped_aura');
  }, [equippedAura]);

  useEffect(() => {
    if (equippedTitle) localStorage.setItem('coderkids_equipped_title', equippedTitle);
    else localStorage.removeItem('coderkids_equipped_title');
  }, [equippedTitle]);

  const filteredItems = SHOP_ITEMS.filter((item) => {
    if (selectedCategory === 'all') return true;
    return item.category === selectedCategory;
  });

  const handleBuy = (item: ShopItem) => {
    if (points < item.price) {
      soundEffects.play('error');
      setShopNotice(`แต้มไม่เพียงพอ! ต้องการอีก ${item.price - points} แต้ม ลองทำแบบฝึกหัดเพิ่มนะ!`);
      return;
    }
    setShopNotice(null);

    if (onDeductPoints) {
      onDeductPoints(item.price, `ซื้อไอเทมร้านค้า: ${item.name}`);
    }

    setOwnedItems([...ownedItems, item.id]);
    soundEffects.play('victory');
    confetti({ particleCount: 50, spread: 55 });

    // Auto-equip on purchase
    equipItem(item);
  };

  const equipItem = (item: ShopItem) => {
    soundEffects.play('click');
    if (item.category === 'hat') {
      setEquippedHat(equippedHat === item.id ? null : item.id);
    } else if (item.category === 'pet') {
      setEquippedPet(equippedPet === item.id ? null : item.id);
    } else if (item.category === 'aura') {
      setEquippedAura(equippedAura === item.id ? null : item.id);
    } else if (item.category === 'title') {
      setEquippedTitle(equippedTitle === item.id ? null : item.id);
    }
  };

  const getAuraClass = () => {
    if (!equippedAura) return 'border-indigo-400';
    const found = SHOP_ITEMS.find((i) => i.id === equippedAura);
    return found ? found.preview : 'border-indigo-400';
  };

  const getHatEmoji = () => {
    if (!equippedHat) return null;
    const found = SHOP_ITEMS.find((i) => i.id === equippedHat);
    return found ? found.preview : null;
  };

  const getPetEmoji = () => {
    if (!equippedPet) return null;
    const found = SHOP_ITEMS.find((i) => i.id === equippedPet);
    return found ? found.preview : null;
  };

  const getTitleText = () => {
    if (!equippedTitle) return null;
    const found = SHOP_ITEMS.find((i) => i.id === equippedTitle);
    return found ? found.preview : null;
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-purple-500/10 via-amber-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-amber-500 text-white flex items-center justify-center shadow-md">
              <ShoppingBag className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  ร้านค้าอวตาร &amp; แฟชั่นโค้ดเดอร์ (Avatar Shop)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                  แลกของรางวัล
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                นำแต้มสะสมจากการเรียนมาแลกหมวก แว่นตา สัตว์เลี้ยงคู่ใจ และกรอบออร่าเรืองแสง
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Coins Balance */}
            <div className="px-3.5 py-1.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/80 flex items-center gap-1.5 shadow-xs">
              <Coins className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
                {points} แต้มคงเหลือ
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {shopNotice && (
          <div className="px-4 py-2.5 bg-amber-500/15 border-b border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs flex items-center justify-between">
            <span>{shopNotice}</span>
            <button onClick={() => setShopNotice(null)} className="text-amber-600 dark:text-amber-300 hover:opacity-80">✕</button>
          </div>
        )}

        {/* Shop Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Live Avatar Preview Room */}
            <div className="lg:col-span-4 p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col items-center text-center space-y-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                ห้องลองชุด (Avatar Fitting Room)
              </span>

              {/* Avatar Box */}
              <div className="relative my-2">
                {/* Aura border */}
                <div
                  className={`w-32 h-32 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-5xl shadow-xl transition-all relative border-4 ${getAuraClass()}`}
                >
                  {/* Avatar Base emoji */}
                  <span>{profile.avatarEmoji || profile.avatarId || '🐱'}</span>

                  {/* Hat Accessory Overlay */}
                  {getHatEmoji() && (
                    <div className="absolute -top-4 -right-1 text-3xl animate-bounce">
                      {getHatEmoji()}
                    </div>
                  )}

                  {/* Pet Accessory Overlay */}
                  {getPetEmoji() && (
                    <div className="absolute -bottom-2 -left-3 text-3xl drop-shadow-md">
                      {getPetEmoji()}
                    </div>
                  )}
                </div>
              </div>

              {/* Student Name & Equipped Title */}
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {profile.name}
                </h4>
                {getTitleText() ? (
                  <span className="mt-1 inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                    {getTitleText()}
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">ยังไม่ได้ใส่ฉายา</span>
                )}
              </div>

              <div className="w-full pt-3 border-t border-slate-200 dark:border-slate-700 text-left text-xs text-slate-500 space-y-1">
                <div>🧢 หมวก: {equippedHat ? 'สวมใส่แล้ว' : 'ไม่มี'}</div>
                <div>🤖 สัตว์เลี้ยง: {equippedPet ? 'สวมใส่แล้ว' : 'ไม่มี'}</div>
                <div>✨ ออร่า: {equippedAura ? 'เปิดใช้งาน' : 'ไม่มี'}</div>
              </div>
            </div>

            {/* Right: Items Catalog */}
            <div className="lg:col-span-8 space-y-4">
              {/* Category Filter Tabs */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs custom-scrollbar">
                {[
                  { id: 'all', label: 'ทั้งหมด' },
                  { id: 'hat', label: '🧢 หมวก & แว่นตา' },
                  { id: 'pet', label: '🤖 สัตว์เลี้ยง AI' },
                  { id: 'aura', label: '✨ กรอบออร่า' },
                  { id: 'title', label: '🏷️ ป้ายฉายา' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id as any)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
                      selectedCategory === cat.id
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Items Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredItems.map((item) => {
                  const isOwned = ownedItems.includes(item.id);
                  const isEquipped =
                    equippedHat === item.id ||
                    equippedPet === item.id ||
                    equippedAura === item.id ||
                    equippedTitle === item.id;

                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between space-y-2 bg-white dark:bg-slate-800 ${
                        isEquipped
                          ? 'border-purple-600 ring-2 ring-purple-500/40 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="text-3xl p-2 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700">
                            {item.icon}
                          </span>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-900 dark:text-white">
                                {item.name}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {item.nameEn} • {item.categoryLabel}
                            </span>
                          </div>
                        </div>

                        {item.rarity === 'legendary' && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            ตำนาน
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {item.description}
                      </p>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                          <Coins className="w-3.5 h-3.5" />
                          <span>{item.price} แต้ม</span>
                        </div>

                        {isOwned ? (
                          <button
                            type="button"
                            onClick={() => equipItem(item)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                              isEquipped
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                                : 'bg-slate-100 dark:bg-slate-700 hover:bg-purple-50 text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            {isEquipped ? (
                              <>
                                <Check className="w-3 h-3 text-purple-600" />
                                <span>สวมใส่อยู่</span>
                              </>
                            ) : (
                              <span>สวมใส่</span>
                            )}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleBuy(item)}
                            disabled={points < item.price}
                            className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all disabled:opacity-40 shadow-xs cursor-pointer active:scale-95 flex items-center gap-1"
                          >
                            <ShoppingBag className="w-3 h-3" />
                            <span>แลกซื้อ</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-500">
          <span>โรงเรียนอนุบาลนราธิวาส • ทำภารกิจและบทเรียนเพื่อสะสมแต้มแลกรางวัล</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-300 transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
