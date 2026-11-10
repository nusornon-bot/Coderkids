import React, { useState } from 'react';
import {
  X,
  Share2,
  Heart,
  GitFork,
  MessageSquare,
  Sparkles,
  Search,
  Filter,
  PlusCircle,
  ExternalLink,
  Code2,
  Cpu,
  Layers,
  Star,
  Send,
  CheckCircle2,
  Flame,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundEffects } from '../utils/soundEffects.ts';

interface CommunityProject {
  id: string;
  title: string;
  author: string;
  schoolGrade: string;
  category: 'scratch' | 'microbit' | 'stem' | 'ai';
  categoryLabel: string;
  description: string;
  tags: string[];
  likes: number;
  remixesCount: number;
  previewEmoji: string;
  previewBg: string;
  codeSnippet: string;
  starsAndWish: {
    star1: string;
    star2: string;
    wish: string;
    reviewer: string;
  }[];
}

const INITIAL_COMMUNITY_PROJECTS: CommunityProject[] = [
  {
    id: 'c_proj_1',
    title: 'เกมแมวเหมียวตะลุยอวกาศ 2D (Space Paws)',
    author: 'ด.ช. ภูมิภัทร สุขสมบูรณ์',
    schoolGrade: 'ป.5/2 โรงเรียนอนุบาลสาธิต',
    category: 'scratch',
    categoryLabel: 'Scratch Studio',
    description: 'เกมยานอวกาศแมวหลบอุกกาบาตและยิงเลเซอร์ปลาทู มีระบบบันทึกคะแนนสูงสุด (High Score) ด้วยตัวแปร Cloud',
    tags: ['Scratch', 'เกม', 'ตัวแปร', 'การวนซ้ำ'],
    likes: 38,
    remixesCount: 14,
    previewEmoji: '🐱🚀',
    previewBg: 'from-purple-900 to-indigo-950',
    codeSnippet: `when green flag clicked
set [score v] to [0]
forever
  if <key [space v] pressed?> then
    create clone of [laser v]
    play sound [laser1 v]
  end
end`,
    starsAndWish: [
      {
        star1: 'ระบบเคลื่อนไหวลื่นไหลมาก เลเซอร์ยิงได้แม่นยำ',
        star2: 'ชอบเอฟเฟกต์ระเบิดตอนอุกกาบาตแตก',
        wish: 'อยากให้เพิ่มไอเทมเก็บเพิ่มพลังชีวิต (Shield)',
        reviewer: 'ด.ญ. กานดา ป.5/1',
      },
    ],
  },
  {
    id: 'c_proj_2',
    title: 'เครื่องรดน้ำต้นไม้อัตโนมัติ Micro:bit Smart Farm',
    author: 'ด.ญ. ณัชชา แสงเพชร',
    schoolGrade: 'ป.6/1 โรงเรียนเทศบาล 1',
    category: 'microbit',
    categoryLabel: 'Micro:bit V2',
    description: 'ตรวจจับความชื้นในดินผ่าน Pin P0 ถ้าดินแห้งจะสั่งเปิด Servo ปั๊มน้ำ 3 วินาที พร้อมส่งเสียงเตือนบอร์ด V2',
    tags: ['Micro:bit', 'Smart Farm', 'IoT', 'เซ็นเซอร์'],
    likes: 54,
    remixesCount: 22,
    previewEmoji: '🌱💧',
    previewBg: 'from-emerald-950 to-teal-950',
    codeSnippet: `basic.forever(function () {
    let moisture = pins.analogReadPin(AnalogPin.P0)
    if (moisture < 400) {
        pins.digitalWritePin(DigitalPin.P1, 1)
        basic.showIcon(IconNames.Sad)
        music.playTone(440, music.beat(BeatFraction.Whole))
    } else {
        pins.digitalWritePin(DigitalPin.P1, 0)
        basic.showIcon(IconNames.Happy)
    }
})`,
    starsAndWish: [
      {
        star1: 'ประยุกต์ใช้กับชีวิตจริงในแปลงผักโรงเรียนได้ดีมาก',
        star2: 'เขียนโค้ดอ่านค่าแอนะล็อกชัดเจน',
        wish: 'ลองทำกราฟบันทึกความชื้นส่งเข้า Data Logger ดูนะ',
        reviewer: 'คุณครูศรันย์',
      },
    ],
  },
  {
    id: 'c_proj_3',
    title: 'สายรัดข้อมือนับก้าวอัจฉริยะ (Pedometer & Calorie)',
    author: 'ด.ช. ธีรดนย์ กิจพิบูลย์',
    schoolGrade: 'ป.5/3',
    category: 'microbit',
    categoryLabel: 'Micro:bit V2',
    description: 'ใช้เซ็นเซอร์ Accelerometer (On Shake) ตรวจจับการเดิน นับก้าวและคำนวณแคลอรีที่เผาผลาญ กดปุ่ม A เพื่อดูสถิติ',
    tags: ['Micro:bit', 'สุขภาพ', 'Accelerometer', 'ฟังก์ชัน'],
    likes: 42,
    remixesCount: 9,
    previewEmoji: '⌚🏃',
    previewBg: 'from-amber-950 to-orange-950',
    codeSnippet: `input.onGesture(Gesture.Shake, function () {
    steps += 1
    calories = steps * 0.04
    led.toggle(2, 2)
})`,
    starsAndWish: [
      {
        star1: 'การคำนวณแคลอรีสมจริงและเข้าใจง่าย',
        star2: 'หน้าจอ LED กระพริบสวยงามทุกครั้งที่ก้าว',
        wish: 'อยากให้บันทึกสถิติรายวันได้ด้วยครับ',
        reviewer: 'ด.ช. ปวริศ ป.6/2',
      },
    ],
  },
  {
    id: 'c_proj_4',
    title: 'AI แยกขยะเปียก-ขยะรีไซเคิลด้วยภาพ (Eco Sorting AI)',
    author: 'ด.ญ. ลลิตา วรวงศ์',
    schoolGrade: 'ป.6/2',
    category: 'ai',
    categoryLabel: 'Kids AI Lab',
    description: 'จำลอง Machine Learning แยกประเภทขยะ 3 กลุ่ม (พลาสติก, กระดาษ, เศษอาหาร) พร้อมบอกเปอร์เซ็นต์ความมั่นใจ',
    tags: ['AI', 'Machine Learning', 'สิ่งแวดล้อม', 'Vision'],
    likes: 67,
    remixesCount: 31,
    previewEmoji: '🤖♻️',
    previewBg: 'from-sky-950 to-blue-950',
    codeSnippet: `when camera detects [Plastic Bottle] with confidence > 85%
broadcast [recycle_bin_open v]
say [นี่คือขยะรีไซเคิล! นำไปแปรรูปได้] for 2 secs`,
    starsAndWish: [
      {
        star1: 'โมเดล AI แม่นยำมาก และช่วยแก้ปัญหาสิ่งแวดล้อมจริง',
        star2: 'การแสดงผลแถบเปอร์เซ็นต์ดูเป็นมืออาชีพ',
        wish: 'ลองเพิ่มการคัดแยกขยะอิเล็กทรอนิกส์เพิ่มดูนะคะ',
        reviewer: 'ด.ญ. พิมพ์ทอง ป.5/3',
      },
    ],
  },
];

interface CommunityRemixHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStudentName: string;
  onRewardPoints?: (pts: number, reason: string) => void;
  onLoadProjectToLab?: (code: string, category: string) => void;
}

export const CommunityRemixHubModal: React.FC<CommunityRemixHubModalProps> = ({
  isOpen,
  onClose,
  currentStudentName,
  onRewardPoints,
  onLoadProjectToLab,
}) => {
  const [projects, setProjects] = useState<CommunityProject[]>(() => {
    try {
      const saved = localStorage.getItem('coderkids_community_projects');
      return saved ? JSON.parse(saved) : INITIAL_COMMUNITY_PROJECTS;
    } catch {
      return INITIAL_COMMUNITY_PROJECTS;
    }
  });

  const [activeFilter, setActiveFilter] = useState<'all' | 'scratch' | 'microbit' | 'stem' | 'ai'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [likedIds, setLikedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('coderkids_community_likes');
      return saved ? JSON.parse(saved) : ['c_proj_1'];
    } catch {
      return ['c_proj_1'];
    }
  });

  const [selectedProject, setSelectedProject] = useState<CommunityProject | null>(null);

  // 2 Stars & 1 Wish peer review form
  const [star1Input, setStar1Input] = useState<string>('');
  const [star2Input, setStar2Input] = useState<string>('');
  const [wishInput, setWishInput] = useState<string>('');

  // Publish New Project Form Modal
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newCategory, setNewCategory] = useState<'scratch' | 'microbit' | 'stem' | 'ai'>('scratch');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newEmoji, setNewEmoji] = useState<string>('🎨✨');
  const [newSnippet, setNewSnippet] = useState<string>('// โค้ดผลงานของคุณ\nwhen green flag clicked\nsay [สวัสดีเพื่อนๆ Coder Kids!]');

  const handleToggleLike = (projectId: string) => {
    soundEffects.play('click');
    const isLiked = likedIds.includes(projectId);
    let updatedLikes: string[];

    if (isLiked) {
      updatedLikes = likedIds.filter((id) => id !== projectId);
    } else {
      updatedLikes = [...likedIds, projectId];
      confetti({ particleCount: 20, spread: 45, origin: { y: 0.8 } });
      if (onRewardPoints) onRewardPoints(2, 'ให้กำลังใจเพื่อนในคอมมูนิตี้');
    }

    setLikedIds(updatedLikes);
    localStorage.setItem('coderkids_community_likes', JSON.stringify(updatedLikes));

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          return { ...p, likes: isLiked ? p.likes - 1 : p.likes + 1 };
        }
        return p;
      })
    );
  };

  const handleRemix = (proj: CommunityProject) => {
    soundEffects.play('victory');
    confetti({ particleCount: 50, spread: 60 });
    
    // Update remix count
    setProjects((prev) =>
      prev.map((p) => (p.id === proj.id ? { ...p, remixesCount: p.remixesCount + 1 } : p))
    );

    if (onRewardPoints) {
      onRewardPoints(10, `รีมิกซ์โค้ดผลงาน "${proj.title}"`);
    }

    if (onLoadProjectToLab) {
      onLoadProjectToLab(proj.codeSnippet, proj.category);
    }

    alert(`🎉 รีมิกซ์ผลงาน "${proj.title}" สำเร็จ! โค้ดถูกนำเข้าสู่พื้นที่ทดลองเขียนโปรแกรมของคุณเรียบร้อยแล้ว`);
  };

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !star1Input.trim() || !star2Input.trim() || !wishInput.trim()) return;

    soundEffects.play('badge');
    confetti({ particleCount: 40, spread: 50 });

    const newReview = {
      star1: star1Input.trim(),
      star2: star2Input.trim(),
      wish: wishInput.trim(),
      reviewer: currentStudentName || 'เพื่อนร่วมชั้น',
    };

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === selectedProject.id) {
          return {
            ...p,
            starsAndWish: [newReview, ...p.starsAndWish],
          };
        }
        return p;
      })
    );

    setSelectedProject((prev) => (prev ? { ...prev, starsAndWish: [newReview, ...prev.starsAndWish] } : null));
    setStar1Input('');
    setStar2Input('');
    setWishInput('');

    if (onRewardPoints) {
      onRewardPoints(8, 'ให้ข้อเสนอแนะเชิงสร้างสรรค์ 2 Stars & 1 Wish');
    }
  };

  const handlePublishProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) return;

    soundEffects.play('victory');
    confetti({ particleCount: 70, spread: 70 });

    const newProj: CommunityProject = {
      id: `c_proj_${Date.now()}`,
      title: newTitle.trim(),
      author: currentStudentName || 'นักเรียน Coder Kids',
      schoolGrade: 'ป.5/1 Coder Kids',
      category: newCategory,
      categoryLabel: newCategory === 'scratch' ? 'Scratch Studio' : newCategory === 'microbit' ? 'Micro:bit V2' : 'Kids AI Lab',
      description: newDescription.trim(),
      tags: [newCategory === 'scratch' ? 'Scratch' : 'Micro:bit', 'ผลงานใหม่'],
      likes: 1,
      remixesCount: 0,
      previewEmoji: newEmoji,
      previewBg: 'from-indigo-950 to-slate-900',
      codeSnippet: newSnippet,
      starsAndWish: [],
    };

    const updated = [newProj, ...projects];
    setProjects(updated);
    localStorage.setItem('coderkids_community_projects', JSON.stringify(updated));

    setIsPublishing(false);
    setNewTitle('');
    setNewDescription('');

    if (onRewardPoints) {
      onRewardPoints(20, 'เผยแพร่โครงงานสู่คอมมูนิตี้');
    }
  };

  if (!isOpen) return null;

  const filteredProjects = projects.filter((p) => {
    const matchesFilter = activeFilter === 'all' || p.category === activeFilter;
    const matchesSearch =
      searchQuery.trim() === '' ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col text-white">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg">
              <Share2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Community Remix Hub 🌐
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  ห้องแชร์ผลงาน &amp; รีมิกซ์โค้ด
                </span>
              </div>
              <p className="text-xs text-slate-400">
                ร่วมแลกเปลี่ยนไอเดียโค้ดดิ้ง ให้คะแนน 2 Stars &amp; 1 Wish และนำโค้ดเพื่อนไปต่อยอด
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPublishing(true)}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">เผยแพร่ผลงาน</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-4 bg-slate-950/40 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Categories */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'ทั้งหมด' },
              { id: 'scratch', label: '🐱 Scratch Studio' },
              { id: 'microbit', label: '📟 Micro:bit V2' },
              { id: 'stem', label: '🔬 STEM โครงงาน' },
              { id: 'ai', label: '🤖 Kids AI Lab' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  activeFilter === tab.id
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="ค้นหาโครงงาน, แท็ก, ผู้สร้าง..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Main Content Gallery */}
        <div className="p-4 sm:p-6 flex-1 space-y-6">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              ไม่พบโครงงานที่ตรงกับเงื่อนไขการค้นหา
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              {filteredProjects.map((proj) => {
                const isLiked = likedIds.includes(proj.id);
                return (
                  <div
                    key={proj.id}
                    className="rounded-3xl bg-slate-950/70 border border-slate-800 p-5 flex flex-col justify-between hover:border-slate-700 transition-all shadow-md group"
                  >
                    <div className="space-y-3">
                      {/* Thumbnail Header */}
                      <div
                        className={`h-32 rounded-2xl bg-gradient-to-br ${proj.previewBg} p-4 flex items-center justify-between border border-slate-800/60 relative overflow-hidden`}
                      >
                        <div className="text-5xl select-none group-hover:scale-110 transition-transform">
                          {proj.previewEmoji}
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 backdrop-blur-md text-white border border-white/20">
                            {proj.categoryLabel}
                          </span>
                          <span className="text-[11px] font-mono text-cyan-300 flex items-center gap-1">
                            <GitFork className="w-3.5 h-3.5" />
                            <span>{proj.remixesCount} remixes</span>
                          </span>
                        </div>
                      </div>

                      {/* Title & Author */}
                      <div>
                        <h3 className="text-base font-black text-white group-hover:text-cyan-400 transition-colors leading-snug">
                          {proj.title}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                          <span>โดย: {proj.author}</span>
                          <span className="text-slate-600">•</span>
                          <span className="text-slate-500">{proj.schoolGrade}</span>
                        </p>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                        {proj.description}
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {proj.tags.map((t, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-slate-800/80 text-[10px] font-medium text-slate-400 border border-slate-700/60"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleLike(proj.id)}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            isLiked
                              ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                              : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                          }`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-400' : ''}`} />
                          <span>{proj.likes}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedProject(proj)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                          <span>รีวิว ({proj.starsAndWish.length})</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemix(proj)}
                        className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-black transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
                      >
                        <GitFork className="w-3.5 h-3.5" />
                        <span>Remix โค้ด</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 2 STARS & 1 WISH REVIEW MODAL DRAWER */}
        {selectedProject && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-800 p-5 sm:p-6 space-y-5 text-white">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{selectedProject.previewEmoji}</span>
                  <div>
                    <h3 className="text-base font-black text-white">{selectedProject.title}</h3>
                    <p className="text-xs text-slate-400">กระดาน 2 Stars &amp; 1 Wish</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedProject(null)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Code Preview */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300 max-h-36 overflow-y-auto">
                <div className="text-[10px] text-slate-500 font-sans mb-1 font-bold uppercase tracking-wider">
                  ตัวอย่างโค้ดโครงงาน
                </div>
                <pre className="whitespace-pre-wrap">{selectedProject.codeSnippet}</pre>
              </div>

              {/* Reviews List */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  ข้อเสนอแนะจากเพื่อน ({selectedProject.starsAndWish.length} รายการ)
                </div>

                {selectedProject.starsAndWish.map((rev, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
                    <div className="font-bold text-cyan-300">{rev.reviewer}</div>
                    <div className="space-y-1 text-slate-300">
                      <div className="flex items-start gap-1.5">
                        <span className="text-amber-400 shrink-0">⭐ ดาวที่ 1:</span>
                        <span>{rev.star1}</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <span className="text-amber-400 shrink-0">⭐ ดาวที่ 2:</span>
                        <span>{rev.star2}</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <span className="text-cyan-400 shrink-0">🌱 ความปรารถนา (Wish):</span>
                        <span>{rev.wish}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Review Form */}
              <form onSubmit={handleAddReview} className="space-y-3 p-4 rounded-2xl bg-slate-950/90 border border-slate-800">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>เขียนข้อคิดเห็นแบบ 2 Stars &amp; 1 Wish (+8 XP)</span>
                </div>

                <div>
                  <input
                    type="text"
                    required
                    placeholder="⭐ ข้อดีที่ 1 ที่ประทับใจ..."
                    value={star1Input}
                    onChange={(e) => setStar1Input(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    required
                    placeholder="⭐ ข้อดีที่ 2 ที่โดดเด่น..."
                    value={star2Input}
                    onChange={(e) => setStar2Input(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    required
                    placeholder="🌱 1 ข้อเสนอแนะเชิงสร้างสรรค์ที่อยากให้เพิ่ม..."
                    value={wishInput}
                    onChange={(e) => setWishInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>ส่งข้อเสนอแนะถึงผู้สร้าง</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* PUBLISH NEW PROJECT FORM MODAL */}
        {isPublishing && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-5 sm:p-6 space-y-4 text-white">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
                    <PlusCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">เผยแพร่โครงงานสู่คอมมูนิตี้</h3>
                    <p className="text-xs text-slate-400">รับแต้มสะสม +20 XP ทันทีที่เผยแพร่</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPublishing(false)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handlePublishProject} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">ชื่อผลงาน</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น เกมเต่าน้อยว่ายน้ำเก็บขยะ"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">หมวดหมู่</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="scratch">Scratch Studio</option>
                      <option value="microbit">Micro:bit V2</option>
                      <option value="stem">STEM Project</option>
                      <option value="ai">Kids AI Lab</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">ไอคอนอิโมจิ</label>
                    <input
                      type="text"
                      value={newEmoji}
                      onChange={(e) => setNewEmoji(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">คำอธิบายสั้นๆ &amp; วิธีการเล่น</label>
                  <textarea
                    required
                    rows={2}
                    placeholder="บอกเพื่อนๆ ว่าโครงงานนี้ทำงานอย่างไร มีลูกเล่นอะไรบ้าง..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">บล็อกโค้ดหรือโค้ดตัวอย่าง</label>
                  <textarea
                    rows={3}
                    value={newSnippet}
                    onChange={(e) => setNewSnippet(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-cyan-300 font-mono text-[11px] focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPublishing(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black shadow-md cursor-pointer"
                  >
                    🚀 เผยแพร่ทันที (+20 XP)
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
