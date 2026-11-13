import React, { useState, useEffect, useRef } from 'react';
import {
  LineChart,
  Play,
  Pause,
  Download,
  Trash2,
  Sliders,
  Thermometer,
  Sun,
  Droplets,
  Volume2,
  Activity,
  FileSpreadsheet,
  Check,
  RotateCcw,
  Sparkles,
  Info,
  Wind,
  CloudRain,
  Ruler,
} from 'lucide-react';
import { AudioReaderButton } from './AudioReaderButton.tsx';

interface MicrobitDataLoggerProps {
  onBack: () => void;
  addPoints: (amount: number, reason: string, category: 'thinking') => void;
}

type SensorChannel = 'temp' | 'light' | 'moisture' | 'sound' | 'humidity' | 'pm25' | 'distance' | 'co2';

interface DataPoint {
  time: string;
  timestamp: number;
  temp: number;
  light: number;
  moisture: number;
  sound: number;
  humidity: number;
  pm25: number;
  distance: number;
  co2: number;
}

export const MicrobitDataLogger: React.FC<MicrobitDataLoggerProps> = ({ onBack, addPoints }) => {
  const [activeChannel, setActiveChannel] = useState<SensorChannel>('temp');
  const [isRecording, setIsRecording] = useState<boolean>(true);
  const [sampleRate, setSampleRate] = useState<number>(1); // seconds
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);

  // Simulated live sensor values
  const [simulatedValues, setSimulatedValues] = useState<Record<SensorChannel, number>>({
    temp: 28.5,
    light: 140,
    moisture: 65,
    sound: 45,
    humidity: 62,
    pm25: 18,
    distance: 85,
    co2: 460,
  });

  const [activeExperiment, setActiveExperiment] = useState<string>('smart_farm');
  const [exportedStatus, setExportedStatus] = useState<boolean>(false);

  // Sensor definitions (8 channels)
  const sensorConfig: Record<SensorChannel, {
    name: string;
    unit: string;
    min: number;
    max: number;
    icon: typeof Thermometer;
    color: string;
    step: number;
  }> = {
    temp: {
      name: 'อุณหภูมิ (Temperature)',
      unit: '°C',
      min: 15,
      max: 45,
      icon: Thermometer,
      color: '#ef4444',
      step: 0.5,
    },
    light: {
      name: 'ความเข้มแสง (Light Level)',
      unit: 'lux (0-255)',
      min: 0,
      max: 255,
      icon: Sun,
      color: '#f59e0b',
      step: 5,
    },
    moisture: {
      name: 'ความชื้นในดิน (Soil Moisture)',
      unit: '%',
      min: 0,
      max: 100,
      icon: Droplets,
      color: '#06b6d4',
      step: 1,
    },
    sound: {
      name: 'ระดับความดังเสียง (Sound Level)',
      unit: 'dB',
      min: 20,
      max: 110,
      icon: Volume2,
      color: '#8b5cf6',
      step: 2,
    },
    humidity: {
      name: 'ความชื้นอากาศ (Air Humidity)',
      unit: '%RH',
      min: 20,
      max: 95,
      icon: CloudRain,
      color: '#0ea5e9',
      step: 1,
    },
    pm25: {
      name: 'ฝุ่นละออง (PM2.5 Air Quality)',
      unit: 'µg/m³',
      min: 0,
      max: 150,
      icon: Wind,
      color: '#10b981',
      step: 2,
    },
    distance: {
      name: 'ระยะทางอัลตราโซนิก (Distance)',
      unit: 'cm',
      min: 5,
      max: 250,
      icon: Ruler,
      color: '#f97316',
      step: 5,
    },
    co2: {
      name: 'ก๊าซ CO₂ ในห้องเรียน (CO2)',
      unit: 'ppm',
      min: 350,
      max: 1400,
      icon: Activity,
      color: '#ec4899',
      step: 20,
    },
  };

  // Initial Seed
  useEffect(() => {
    const initialData: DataPoint[] = [];
    const now = Date.now();
    for (let i = 10; i >= 0; i--) {
      const d = new Date(now - i * 2000);
      initialData.push({
        time: d.toLocaleTimeString('th-TH', { hour12: false, minute: '2-digit', second: '2-digit' }),
        timestamp: d.getTime(),
        temp: +(27 + Math.sin(i) * 2 + Math.random() * 0.5).toFixed(1),
        light: Math.round(120 + Math.cos(i) * 30 + Math.random() * 10),
        moisture: Math.round(65 - i * 0.4 + Math.random() * 3),
        sound: Math.round(40 + Math.random() * 15),
        humidity: Math.round(60 + Math.sin(i * 0.7) * 5 + Math.random() * 3),
        pm25: Math.round(16 + Math.cos(i * 0.5) * 4 + Math.random() * 3),
        distance: Math.round(80 + Math.sin(i * 0.8) * 20 + Math.random() * 5),
        co2: Math.round(450 + Math.cos(i * 0.6) * 40 + Math.random() * 20),
      });
    }
    setDataPoints(initialData);
  }, []);

  // Live recording interval
  useEffect(() => {
    if (!isRecording) return;

    const interval = setInterval(() => {
      const now = new Date();
      // Slight natural jitter
      setSimulatedValues((prev) => ({
        temp: +Math.min(45, Math.max(15, prev.temp + (Math.random() - 0.49) * 0.4)).toFixed(1),
        light: Math.min(255, Math.max(0, Math.round(prev.light + (Math.random() - 0.5) * 8))),
        moisture: Math.min(100, Math.max(0, Math.round(prev.moisture + (Math.random() - 0.5) * 2))),
        sound: Math.min(110, Math.max(20, Math.round(prev.sound + (Math.random() - 0.5) * 6))),
        humidity: Math.min(95, Math.max(20, Math.round(prev.humidity + (Math.random() - 0.5) * 2))),
        pm25: Math.min(150, Math.max(0, Math.round(prev.pm25 + (Math.random() - 0.5) * 3))),
        distance: Math.min(250, Math.max(5, Math.round(prev.distance + (Math.random() - 0.5) * 6))),
        co2: Math.min(1400, Math.max(350, Math.round(prev.co2 + (Math.random() - 0.5) * 18))),
      }));

      setDataPoints((prev) => {
        const newPoint: DataPoint = {
          time: now.toLocaleTimeString('th-TH', { hour12: false, minute: '2-digit', second: '2-digit' }),
          timestamp: now.getTime(),
          temp: simulatedValues.temp,
          light: simulatedValues.light,
          moisture: simulatedValues.moisture,
          sound: simulatedValues.sound,
          humidity: simulatedValues.humidity,
          pm25: simulatedValues.pm25,
          distance: simulatedValues.distance,
          co2: simulatedValues.co2,
        };
        const updated = [...prev, newPoint];
        if (updated.length > 25) {
          updated.shift();
        }
        return updated;
      });
    }, sampleRate * 1000);

    return () => clearInterval(interval);
  }, [isRecording, sampleRate, simulatedValues]);

  // Calculations for active channel
  const currentValues = dataPoints.map((d) => d[activeChannel]);
  const minVal = currentValues.length ? Math.min(...currentValues) : 0;
  const maxVal = currentValues.length ? Math.max(...currentValues) : 0;
  const avgVal = currentValues.length
    ? +(currentValues.reduce((a, b) => a + b, 0) / currentValues.length).toFixed(1)
    : 0;

  // Export CSV
  const handleExportCSV = () => {
    const headers = 'Time,Timestamp,Temperature(C),Light(0-255),SoilMoisture(%),Sound(dB),AirHumidity(%RH),PM2.5(ug/m3),Distance(cm),CO2(ppm)\n';
    const rows = dataPoints
      .map((d) => `${d.time},${d.timestamp},${d.temp},${d.light},${d.moisture},${d.sound},${d.humidity},${d.pm25},${d.distance},${d.co2}`)
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `microbit_science_data_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportedStatus(true);
    setTimeout(() => setExportedStatus(false), 3000);
    addPoints(20, 'ส่งออกชุดข้อมูลวิทยาศาสตร์ Micro:bit Data Logger', 'thinking');
  };

  const handleClearData = () => {
    setDataPoints([]);
  };

  const activeConf = sensorConfig[activeChannel];

  // SVG Chart Dimensions
  const chartWidth = 600;
  const chartHeight = 220;
  const padding = 35;

  const yRange = activeConf.max - activeConf.min;
  const getSvgY = (val: number) => {
    const clamped = Math.min(activeConf.max, Math.max(activeConf.min, val));
    const ratio = (clamped - activeConf.min) / (yRange || 1);
    return chartHeight - padding - ratio * (chartHeight - padding * 2);
  };

  const getSvgX = (index: number) => {
    if (dataPoints.length <= 1) return padding;
    return padding + (index / (dataPoints.length - 1)) * (chartWidth - padding * 2);
  };

  // Build SVG Path
  const pointsString = dataPoints
    .map((d, idx) => `${getSvgX(idx)},${getSvgY(d[activeChannel])}`)
    .join(' ');

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-700 via-cyan-800 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-xs text-teal-200 hover:text-white bg-white/15 px-3 py-1 rounded-full backdrop-blur-sm transition-colors"
            >
              ← กลับสู่แดชบอร์ดหลัก
            </button>
            <div className="flex items-center gap-3">
              <span className="text-3xl sm:text-4xl">📈</span>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Micro:bit IoT Data Logger &amp; Science Chart
                </h1>
                <p className="text-teal-100 text-xs sm:text-sm">
                  ระบบบันทึกและพล็อตกราฟข้อมูลเซนเซอร์ เชื่อมโยงโค้ดดิ้งกับวิทยาศาสตร์ข้อมูล (Data Science for Kids)
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <AudioReaderButton
              textToRead="Micro:bit Data Logger ระบบบันทึกและพล็อตกราฟข้อมูลเซนเซอร์แบบเรียลไทม์ สามารถสลับดูอุณหภูมิ แสง ความชื้น และระดับเสียง พร้อมส่งออกไฟล์เพื่อทำรายงานวิทยาศาสตร์"
              size="md"
            />
          </div>
        </div>

        {/* Channel Selector Pills (8 Channels) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-6 pt-6 border-t border-white/15">
          {(['temp', 'light', 'moisture', 'sound', 'humidity', 'pm25', 'distance', 'co2'] as SensorChannel[]).map((ch) => {
            const conf = sensorConfig[ch];
            const Icon = conf.icon;
            const isSelected = activeChannel === ch;
            return (
              <button
                key={ch}
                onClick={() => setActiveChannel(ch)}
                className={`p-3 rounded-2xl text-left transition-all flex items-center gap-3 ${
                  isSelected
                    ? 'bg-white text-slate-900 shadow-md font-bold ring-2 ring-white/50'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: isSelected ? conf.color : 'rgba(255,255,255,0.2)' }}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="truncate">
                  <div className="text-[10px] opacity-80 truncate">{conf.name.split(' ')[0]}</div>
                  <div className="text-xs font-mono font-bold">
                    {simulatedValues[ch]} {conf.unit.split(' ')[0]}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 8 Cols: Real-time SVG Chart */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
            {/* Chart Header Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <activeConf.icon className="w-6 h-6" style={{ color: activeConf.color }} />
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{activeConf.name}</h3>
                  <div className="text-xs text-slate-500">
                    ความถี่: ทุกๆ {sampleRate} วินาที | จุดข้อมูลสะสม: {dataPoints.length} ค่า
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsRecording(!isRecording)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isRecording
                      ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  {isRecording ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  {isRecording ? 'หยุดชั่วคราว' : 'เริ่มบันทึกต่อ'}
                </button>

                <button
                  onClick={handleClearData}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                  title="ล้างข้อมูลกราฟ"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <button
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                >
                  {exportedStatus ? <Check className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
                  {exportedStatus ? 'ดาวน์โหลดแล้ว' : 'ส่งออก CSV'}
                </button>
              </div>
            </div>

            {/* Responsive SVG Chart */}
            <div className="w-full bg-slate-950 rounded-2xl p-4 shadow-inner relative overflow-hidden">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto overflow-visible">
                {/* Horizontal Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                  const y = chartHeight - padding - ratio * (chartHeight - padding * 2);
                  const val = Math.round(activeConf.min + ratio * yRange);
                  return (
                    <g key={i}>
                      <line
                        x1={padding}
                        y1={y}
                        x2={chartWidth - padding}
                        y2={y}
                        stroke="#334155"
                        strokeDasharray="4 4"
                      />
                      <text x={padding - 6} y={y + 3} textAnchor="end" fill="#64748b" fontSize="9" fontFamily="monospace">
                        {val}
                      </text>
                    </g>
                  );
                })}

                {/* Connecting Polyline */}
                {dataPoints.length > 1 && (
                  <polyline
                    fill="none"
                    stroke={activeConf.color}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={pointsString}
                  />
                )}

                {/* Data point dots */}
                {dataPoints.map((d, idx) => (
                  <circle
                    key={idx}
                    cx={getSvgX(idx)}
                    cy={getSvgY(d[activeChannel])}
                    r={idx === dataPoints.length - 1 ? '4' : '2'}
                    fill={idx === dataPoints.length - 1 ? '#ffffff' : activeConf.color}
                    stroke={activeConf.color}
                    strokeWidth="1.5"
                  />
                ))}
              </svg>

              {/* Live Blinking Indicator */}
              {isRecording && (
                <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-full border border-slate-800 text-[10px] text-emerald-400 font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  LIVE STREAM
                </div>
              )}
            </div>

            {/* Quick Stat Summary Cards */}
            <div className="grid grid-cols-3 gap-3 mt-6">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">ค่าต่ำสุด (MIN)</div>
                <div className="text-lg font-black text-slate-800 font-mono">
                  {minVal} <span className="text-xs font-normal text-slate-500">{activeConf.unit}</span>
                </div>
              </div>
              <div className="p-3.5 bg-indigo-50/60 rounded-2xl border border-indigo-100 text-center">
                <div className="text-[10px] text-indigo-600 uppercase tracking-wider">ค่าเฉลี่ย (AVG)</div>
                <div className="text-lg font-black text-indigo-900 font-mono">
                  {avgVal} <span className="text-xs font-normal text-indigo-600">{activeConf.unit}</span>
                </div>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">ค่าสูงสุด (MAX)</div>
                <div className="text-lg font-black text-slate-800 font-mono">
                  {maxVal} <span className="text-xs font-normal text-slate-500">{activeConf.unit}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Live Sensor Simulator & Science Templates */}
        <div className="lg:col-span-4 space-y-6">
          {/* Sensor Controls / Sliders */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-600" />
              จำลองปรับค่าเซนเซอร์สด
            </h3>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 font-medium">🌡️ อุณหภูมิ:</span>
                  <span className="font-mono font-bold text-red-600">{simulatedValues.temp} °C</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="45"
                  step="0.5"
                  value={simulatedValues.temp}
                  onChange={(e) => setSimulatedValues({ ...simulatedValues, temp: +e.target.value })}
                  className="w-full accent-red-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 font-medium">☀️ แสงสว่าง:</span>
                  <span className="font-mono font-bold text-amber-600">{simulatedValues.light} lux</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={simulatedValues.light}
                  onChange={(e) => setSimulatedValues({ ...simulatedValues, light: +e.target.value })}
                  className="w-full accent-amber-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 font-medium">💧 ความชื้นดิน:</span>
                  <span className="font-mono font-bold text-cyan-600">{simulatedValues.moisture} %</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={simulatedValues.moisture}
                  onChange={(e) => setSimulatedValues({ ...simulatedValues, moisture: +e.target.value })}
                  className="w-full accent-cyan-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 font-medium">🍃 ฝุ่น PM2.5:</span>
                  <span className="font-mono font-bold text-emerald-600">{simulatedValues.pm25} µg/m³</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="150"
                  value={simulatedValues.pm25}
                  onChange={(e) => setSimulatedValues({ ...simulatedValues, pm25: +e.target.value })}
                  className="w-full accent-emerald-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 font-medium">📏 ระยะอัลตราโซนิก:</span>
                  <span className="font-mono font-bold text-orange-600">{simulatedValues.distance} cm</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="250"
                  value={simulatedValues.distance}
                  onChange={(e) => setSimulatedValues({ ...simulatedValues, distance: +e.target.value })}
                  className="w-full accent-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Science Experiment Cards (6 Presets) */}
          <div className="bg-gradient-to-br from-indigo-50 to-teal-50 rounded-3xl p-6 border border-indigo-100">
            <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-indigo-600" />
              ตัวอย่างการทดลองวิทยาศาสตร์ในโรงเรียน (6 ชุดทดลอง)
            </h4>

            <div className="space-y-2">
              {[
                {
                  id: 'smart_farm',
                  channel: 'moisture' as SensorChannel,
                  title: '🌱 การทดลองรดน้ำแปลงผักชี',
                  desc: 'วัดความชื้นในดินและอุณหภูมิรอบกระถางต้นไม้ตลอด 24 ชั่วโมง',
                },
                {
                  id: 'insulation',
                  channel: 'temp' as SensorChannel,
                  title: '🧊 เปรียบเทียบกระติกเก็บความเย็น',
                  desc: 'วัดอัตราการเปลี่ยนแปลงอุณหภูมิเมื่อใส่ฉนวนแต่ละชนิด',
                },
                {
                  id: 'solar',
                  channel: 'light' as SensorChannel,
                  title: '☀️ พลังงานแสงกับการสังเคราะห์แสง',
                  desc: 'บันทึกความเข้มแสงแดดช่วงเช้า กลางวัน และเย็น',
                },
                {
                  id: 'noise_library',
                  channel: 'sound' as SensorChannel,
                  title: '🤫 วัดระดับเสียงห้องสมุดโรงเรียน',
                  desc: 'ติดตามระดับเดซิเบลช่วงพักเที่ยงเพื่อออกแบบไฟเตือนเสียงดัง',
                },
                {
                  id: 'pm25_schoolyard',
                  channel: 'pm25' as SensorChannel,
                  title: '😷 สำรวจค่าฝุ่น PM2.5 หน้าเสาธง vs ใต้ร่มไม้',
                  desc: 'เปรียบเทียบคุณภาพอากาศบริเวณถนนหน้าโรงเรียนและสวนเกษตร',
                },
                {
                  id: 'greenhouse_co2',
                  channel: 'co2' as SensorChannel,
                  title: '🏫 คุณภาพอากาศ CO₂ ในห้องเรียนปรับอากาศ',
                  desc: 'ตรวจวัดการระบายอากาศและระดับ CO₂ ช่วงคาบเรียนบ่าย',
                },
              ].map((exp) => (
                <button
                  key={exp.id}
                  onClick={() => {
                    setActiveExperiment(exp.id);
                    setActiveChannel(exp.channel);
                  }}
                  className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer ${
                    activeExperiment === exp.id
                      ? 'bg-white border-indigo-400 ring-2 ring-indigo-200 shadow-xs'
                      : 'bg-white/90 border-slate-200/60 hover:border-indigo-300'
                  }`}
                >
                  <div className="text-xs font-bold text-slate-800">{exp.title}</div>
                  <div className="text-[11px] text-slate-600 mt-0.5">{exp.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
