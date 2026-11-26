import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Award,
  Brain,
  Camera,
  CheckCircle2,
  Cpu,
  Eraser,
  Eye,
  ImagePlus,
  Layers,
  Pencil,
  Play,
  RotateCcw,
  Sliders,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AudioNarratorButton } from './AudioNarratorButton.tsx';
import { soundEffects } from '../utils/soundEffects.ts';
import {
  evaluateDatasetHealth,
  predictWithKidsMlModel,
  trainKidsMlModel,
  type MlClassDef,
  type MlClassifierMode,
  type MlEpochMetric,
  type MlMissionId,
  type MlPredictionResult,
  type MlSampleItem,
  type MlTestGalleryItem,
  type MlTrainedModel,
} from '../utils/kidsMlEngine.ts';
import {
  buildMissionAssets,
  extractSampleFromCanvas,
  extractSampleFromImageFile,
  ML_MISSIONS,
} from '../data/kidsMlDatasets.ts';

export interface KidsAILabProps {
  onAwardPoints?: (
    pts: number,
    options?: { uniqueKey?: string; reason?: string }
  ) => boolean | void;
  claimedActivities?: string[];
}

const BRUSH_COLORS = [
  { hex: '#dc2626', label: 'แดง' },
  { hex: '#ea580c', label: 'ส้ม' },
  { hex: '#facc15', label: 'เหลือง' },
  { hex: '#16a34a', label: 'เขียว' },
  { hex: '#0284c7', label: 'ฟ้า' },
  { hex: '#7c3aed', label: 'ม่วง' },
  { hex: '#78350f', label: 'น้ำตาล' },
  { hex: '#1e293b', label: 'เทาเข้ม' },
];

type StageTab = 'collect' | 'test';
type TestInputMode = 'gallery' | 'draw' | 'upload' | 'webcam';

interface ActiveInputDrawer {
  mode: 'draw' | 'webcam';
  target: 'train' | 'test';
  classId?: string;
}

export const KidsAILab: React.FC<KidsAILabProps> = ({
  onAwardPoints,
  claimedActivities = [],
}) => {
  const [missionId, setMissionId] = useState<MlMissionId>('waste_sorting');
  const [stageTab, setStageTab] = useState<StageTab>('collect');
  const [testInputMode, setTestInputMode] = useState<TestInputMode>('gallery');

  // Mission dataset state
  const initialAssets = useMemo(() => buildMissionAssets('waste_sorting'), []);
  const [classes, setClasses] = useState<MlClassDef[]>(initialAssets.classes);
  const [samples, setSamples] = useState<MlSampleItem[]>(initialAssets.trainingSamples);
  const [testGallery, setTestGallery] = useState<MlTestGalleryItem[]>(initialAssets.testGallery);

  // Hyperparameters
  const [epochs, setEpochs] = useState<number>(30);
  const [classifierMode, setClassifierMode] = useState<MlClassifierMode>('linear');

  // Training & Model state
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [trainingStepIndex, setTrainingStepIndex] = useState<number>(0);
  const [pendingModel, setPendingModel] = useState<MlTrainedModel | null>(null);
  const [trainedModel, setTrainedModel] = useState<MlTrainedModel | null>(null);
  const [isModelStale, setIsModelStale] = useState<boolean>(false);

  // Testing & Prediction state
  const [selectedTestItemId, setSelectedTestItemId] = useState<string>(
    initialAssets.testGallery[0]?.id || ''
  );
  const [customTestPreview, setCustomTestPreview] = useState<{
    name: string;
    dataUrl: string;
    features: number[];
    sourceLabel: string;
  } | null>(null);
  const [prediction, setPrediction] = useState<MlPredictionResult | null>(null);
  const [showVisionGrid, setShowVisionGrid] = useState<boolean>(false);
  const [verifiedTestIds, setVerifiedTestIds] = useState<Record<string, boolean>>({});

  // XP feedback & claimed tracking
  const [localClaimedKeys, setLocalClaimedKeys] = useState<string[]>(claimedActivities);
  const [xpToast, setXpToast] = useState<{ title: string; points: number } | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Draw & Webcam interactive drawer
  const [inputDrawer, setInputDrawer] = useState<ActiveInputDrawer | null>(null);
  const [brushColor, setBrushColor] = useState<string>(BRUSH_COLORS[3].hex);
  const [brushSize, setBrushSize] = useState<number>(12);
  const [isEraser, setIsEraser] = useState<boolean>(false);
  const [customSampleLabel, setCustomSampleLabel] = useState<string>('');
  const [isDrawingStroke, setIsDrawingStroke] = useState<boolean>(false);

  const drawCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const testDrawCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastPointerPosRef = useRef<{ x: number; y: number } | null>(null);
  const uploadInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const testUploadInputRef = useRef<HTMLInputElement | null>(null);

  // Webcam refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [webcamStatus, setWebcamStatus] = useState<'idle' | 'starting' | 'ready' | 'error'>('idle');
  const [webcamError, setWebcamError] = useState<string>('');

  const missionConfig = ML_MISSIONS[missionId];
  const datasetHealth = useMemo(
    () => evaluateDatasetHealth(samples, classes),
    [samples, classes]
  );

  const combinedClaimedSet = useMemo(
    () => new Set([...claimedActivities, ...localClaimedKeys]),
    [claimedActivities, localClaimedKeys]
  );

  const stopWebcamStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setWebcamStatus('idle');
  }, []);

  useEffect(() => {
    return () => {
      stopWebcamStream();
    };
  }, [stopWebcamStream]);

  // Helper to award XP safely via parent handler
  const triggerXpReward = useCallback(
    (pts: number, uniqueKey: string, reason: string) => {
      if (combinedClaimedSet.has(uniqueKey)) return;
      const result = onAwardPoints?.(pts, { uniqueKey, reason });
      if (result !== false) {
        setLocalClaimedKeys((prev) => (prev.includes(uniqueKey) ? prev : [...prev, uniqueKey]));
        setXpToast({ title: reason, points: pts });
        setTimeout(() => setXpToast(null), 4500);
      }
    },
    [combinedClaimedSet, onAwardPoints]
  );

  // Switch mission cleanly
  const handleSelectMission = (nextId: MlMissionId) => {
    soundEffects.play('click');
    stopWebcamStream();
    setInputDrawer(null);
    setErrorBanner(null);

    const nextAssets = buildMissionAssets(nextId);
    setMissionId(nextId);
    setClasses(nextAssets.classes);
    setSamples(nextAssets.trainingSamples);
    setTestGallery(nextAssets.testGallery);
    setSelectedTestItemId(nextAssets.testGallery[0]?.id || '');
    setCustomTestPreview(null);
    setTrainedModel(null);
    setPendingModel(null);
    setIsTraining(false);
    setTrainingStepIndex(0);
    setIsModelStale(false);
    setPrediction(null);
    setVerifiedTestIds({});
    setStageTab('collect');
  };

  // Reset current mission dataset to presets
  const handleResetMission = () => {
    soundEffects.play('click');
    const resetAssets = buildMissionAssets(missionId);
    setClasses(resetAssets.classes);
    setSamples(resetAssets.trainingSamples);
    setTestGallery(resetAssets.testGallery);
    setSelectedTestItemId(resetAssets.testGallery[0]?.id || '');
    setTrainedModel(null);
    setPendingModel(null);
    setIsModelStale(false);
    setPrediction(null);
    setVerifiedTestIds({});
    setErrorBanner(null);
  };

  // Initialize drawing canvas with clean white lab sheet
  const clearCanvasElement = useCallback((canvasEl: HTMLCanvasElement | null) => {
    if (!canvasEl) return;
    const ctx = canvasEl.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvasEl.width, canvasEl.height);
  }, []);

  useEffect(() => {
    if (inputDrawer?.mode === 'draw') {
      requestAnimationFrame(() => clearCanvasElement(drawCanvasRef.current));
    }
  }, [inputDrawer, clearCanvasElement]);

  useEffect(() => {
    if (stageTab === 'test' && testInputMode === 'draw') {
      requestAnimationFrame(() => clearCanvasElement(testDrawCanvasRef.current));
    }
  }, [stageTab, testInputMode, clearCanvasElement]);

  // Pointer drawing handlers shared by train/test canvases
  const getCanvasCoordinates = (
    canvasEl: HTMLCanvasElement,
    e: React.PointerEvent<HTMLCanvasElement>
  ) => {
    const rect = canvasEl.getBoundingClientRect();
    const scaleX = canvasEl.width / Math.max(1, rect.width);
    const scaleY = canvasEl.height / Math.max(1, rect.height);
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (
    canvasEl: HTMLCanvasElement | null,
    e: React.PointerEvent<HTMLCanvasElement>
  ) => {
    if (!canvasEl) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const pos = getCanvasCoordinates(canvasEl, e);
    lastPointerPosRef.current = pos;
    setIsDrawingStroke(true);

    const ctx = canvasEl.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = isEraser ? '#f8fafc' : brushColor;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, (isEraser ? brushSize * 1.4 : brushSize) / 2, 0, Math.PI * 2);
    ctx.fill();
  };

  const handlePointerMove = (
    canvasEl: HTMLCanvasElement | null,
    e: React.PointerEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawingStroke || !canvasEl) return;
    const ctx = canvasEl.getContext('2d');
    if (!ctx) return;

    const pos = getCanvasCoordinates(canvasEl, e);
    const prev = lastPointerPosRef.current || pos;
    ctx.strokeStyle = isEraser ? '#f8fafc' : brushColor;
    ctx.lineWidth = isEraser ? brushSize * 1.4 : brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    lastPointerPosRef.current = pos;
  };

  const handlePointerUp = () => {
    setIsDrawingStroke(false);
    lastPointerPosRef.current = null;
  };

  // Start Webcam safely
  const startWebcam = useCallback(async () => {
    setWebcamError('');
    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setWebcamStatus('error');
      setWebcamError('บราวเซอร์นี้ไม่รองรับการเปิดกล้องเว็บแคม กรุณาใช้วิธีวาดภาพหรืออัปโหลดรูปแทน');
      return;
    }

    setWebcamStatus('starting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 480 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setWebcamStatus('ready');
    } catch {
      setWebcamStatus('error');
      setWebcamError('ไม่สามารถเข้าถึงกล้องได้ (ยังไม่ได้อนุญาตหรือไม่มีกล้อง) สามารถวาดภาพหรืออัปโหลดรูปภาพแทนได้ทันที');
    }
  }, []);

  useEffect(() => {
    const needsWebcam =
      inputDrawer?.mode === 'webcam' || (stageTab === 'test' && testInputMode === 'webcam');
    if (needsWebcam) {
      startWebcam();
    } else {
      stopWebcamStream();
    }
  }, [inputDrawer, stageTab, testInputMode, startWebcam, stopWebcamStream]);

  // Add drawn sample to a training class
  const handleSaveDrawnTrainingSample = () => {
    if (!inputDrawer?.classId || !drawCanvasRef.current) return;
    const extracted = extractSampleFromCanvas(drawCanvasRef.current);
    const cls = classes.find((c) => c.id === inputDrawer.classId);
    const label = customSampleLabel.trim() || `ภาพวาด (${cls?.shortName || 'ตัวอย่าง'})`;

    const newItem: MlSampleItem = {
      id: `draw_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      classId: inputDrawer.classId,
      name: label,
      dataUrl: extracted.dataUrl,
      features: extracted.features,
      source: 'draw',
    };

    soundEffects.play('click');
    setSamples((prev) => [...prev, newItem]);
    if (trainedModel) setIsModelStale(true);
    setCustomSampleLabel('');
    setInputDrawer(null);
  };

  // Capture webcam frame to a training class
  const handleCaptureWebcamTrainingSample = () => {
    if (!inputDrawer?.classId || !videoRef.current || webcamStatus !== 'ready') return;
    const video = videoRef.current;
    const captureCanvas = document.createElement('canvas');
    captureCanvas.width = 240;
    captureCanvas.height = 240;
    const ctx = captureCanvas.getContext('2d');
    if (!ctx) return;

    const minSide = Math.min(video.videoWidth || 240, video.videoHeight || 240);
    const sx = ((video.videoWidth || 240) - minSide) / 2;
    const sy = ((video.videoHeight || 240) - minSide) / 2;
    ctx.drawImage(video, sx, sy, minSide, minSide, 0, 0, 240, 240);

    const extracted = extractSampleFromCanvas(captureCanvas);
    const cls = classes.find((c) => c.id === inputDrawer.classId);
    const newItem: MlSampleItem = {
      id: `cam_${Date.now()}`,
      classId: inputDrawer.classId,
      name: customSampleLabel.trim() || `ภาพกล้อง (${cls?.shortName || 'ตัวอย่าง'})`,
      dataUrl: extracted.dataUrl,
      features: extracted.features,
      source: 'webcam',
    };

    soundEffects.play('click');
    setSamples((prev) => [...prev, newItem]);
    if (trainedModel) setIsModelStale(true);
    setCustomSampleLabel('');
    setInputDrawer(null);
  };

  // Upload photo into a training class
  const handleUploadTrainingFile = async (classId: string, file: File | undefined) => {
    if (!file) return;
    setErrorBanner(null);
    try {
      const extracted = await extractSampleFromImageFile(file);
      const shortFileName = file.name.replace(/\.[^/.]+$/, '').slice(0, 24) || 'ภาพอัปโหลด';
      const newItem: MlSampleItem = {
        id: `up_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        classId,
        name: shortFileName,
        dataUrl: extracted.dataUrl,
        features: extracted.features,
        source: 'upload',
      };
      soundEffects.play('click');
      setSamples((prev) => [...prev, newItem]);
      if (trainedModel) setIsModelStale(true);
    } catch {
      setErrorBanner('ไม่สามารถอ่านไฟล์รูปภาพนี้ได้ กรุณาลองเลือกไฟล์ PNG หรือ JPG');
    }
  };

  const handleRemoveSample = (sampleId: string) => {
    soundEffects.play('click');
    setSamples((prev) => prev.filter((s) => s.id !== sampleId));
    if (trainedModel) setIsModelStale(true);
  };

  const handleRenameClass = (classId: string, nextName: string) => {
    setClasses((prev) =>
      prev.map((c) =>
        c.id === classId
          ? { ...c, name: nextName, shortName: nextName.trim().slice(0, 14) || c.shortName }
          : c
      )
    );
    if (trainedModel) setIsModelStale(true);
  };

  // Real Epoch-by-Epoch Model Training Loop
  const handleTrainModel = () => {
    if (!datasetHealth.isReady || isTraining) return;
    soundEffects.play('click');
    setErrorBanner(null);

    const computedModel = trainKidsMlModel({
      missionId,
      classes,
      samples,
      epochs,
      mode: classifierMode,
    });

    setPendingModel(computedModel);
    setTrainedModel(null);
    setPrediction(null);
    setIsTraining(true);
    setTrainingStepIndex(1);
    setIsModelStale(false);
  };

  useEffect(() => {
    if (!isTraining || !pendingModel) return;
    const totalEpochs = pendingModel.epochMetrics.length;
    if (trainingStepIndex >= totalEpochs) {
      const finishTimer = setTimeout(() => {
        setIsTraining(false);
        setTrainedModel(pendingModel);
        setPendingModel(null);

        confetti({
          particleCount: 65,
          spread: 60,
          origin: { y: 0.65 },
        });

        // Award mission XP
        triggerXpReward(
          missionConfig.xpReward,
          missionConfig.xpUniqueKey,
          missionConfig.xpReason
        );

        // Award bonus XP if the student added custom data (drawn / uploaded / webcam)
        const hasStudentCustomSample = samples.some((s) => s.source !== 'preset');
        if (hasStudentCustomSample) {
          setTimeout(() => {
            triggerXpReward(
              25,
              'kids_ai_lab_custom_data_trainer',
              'ฝึกสอนโมเดล AI ด้วยภาพที่วาดหรืออัปโหลดเองสำเร็จ'
            );
          }, 1600);
        }
      }, 180);
      return () => clearTimeout(finishTimer);
    }

    const stepSize = Math.max(1, Math.ceil(totalEpochs / 16));
    const stepTimer = setTimeout(() => {
      setTrainingStepIndex((prev) => Math.min(totalEpochs, prev + stepSize));
    }, 55);
    return () => clearTimeout(stepTimer);
  }, [isTraining, pendingModel, trainingStepIndex, missionConfig, samples, triggerXpReward]);

  // Run prediction on any feature vector
  const runPrediction = (
    features: number[],
    galleryItem?: MlTestGalleryItem,
    customMeta?: { name: string; dataUrl: string; sourceLabel: string }
  ) => {
    if (!trainedModel) return;
    const result = predictWithKidsMlModel(trainedModel, features);
    setPrediction(result);

    if (customMeta) {
      setCustomTestPreview({
        ...customMeta,
        features,
      });
    }

    if (galleryItem) {
      const isRight = result.predictedClassId === galleryItem.expectedClassId;
      soundEffects.play(isRight ? 'correct' : 'click');
      setVerifiedTestIds((prev) => {
        const next = { ...prev, [galleryItem.id]: isRight };
        const correctCount = Object.values(next).filter(Boolean).length;
        if (correctCount >= 3) {
          triggerXpReward(
            25,
            'kids_ai_lab_test_master',
            'ทดสอบโมเดล AI จำแนกภาพใหม่ถูกต้องอย่างน้อย 3 ภาพ'
          );
        }
        return next;
      });
    } else {
      soundEffects.play('correct');
    }
  };

  const handlePredictDrawnTest = () => {
    if (!testDrawCanvasRef.current || !trainedModel) return;
    const extracted = extractSampleFromCanvas(testDrawCanvasRef.current);
    runPrediction(extracted.features, undefined, {
      name: 'ภาพที่วาดทดสอบเอง',
      dataUrl: extracted.dataUrl,
      sourceLabel: 'ภาพวาดจากกระดาน Canvas',
    });
  };

  const handlePredictUploadedTest = async (file: File | undefined) => {
    if (!file || !trainedModel) return;
    setErrorBanner(null);
    try {
      const extracted = await extractSampleFromImageFile(file);
      runPrediction(extracted.features, undefined, {
        name: file.name.slice(0, 32),
        dataUrl: extracted.dataUrl,
        sourceLabel: 'ไฟล์ภาพจากอุปกรณ์',
      });
    } catch {
      setErrorBanner('ไม่สามารถเปิดไฟล์ภาพทดสอบได้ กรุณาลองไฟล์ภาพ PNG หรือ JPG');
    }
  };

  const handlePredictWebcamTest = () => {
    if (!videoRef.current || webcamStatus !== 'ready' || !trainedModel) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = 240;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const minSide = Math.min(video.videoWidth || 240, video.videoHeight || 240);
    const sx = ((video.videoWidth || 240) - minSide) / 2;
    const sy = ((video.videoHeight || 240) - minSide) / 2;
    ctx.drawImage(video, sx, sy, minSide, minSide, 0, 0, 240, 240);

    const extracted = extractSampleFromCanvas(canvas);
    runPrediction(extracted.features, undefined, {
      name: 'ภาพถ่ายจากกล้องเว็บแคม',
      dataUrl: extracted.dataUrl,
      sourceLabel: 'กล้องเว็บแคมสด',
    });
  };

  // Active training metrics to display in SVG chart
  const displayedMetrics: MlEpochMetric[] = useMemo(() => {
    if (isTraining && pendingModel) {
      return pendingModel.epochMetrics.slice(0, Math.max(1, trainingStepIndex));
    }
    if (trainedModel) {
      return trainedModel.epochMetrics;
    }
    return [];
  }, [isTraining, pendingModel, trainingStepIndex, trainedModel]);

  const activeTestGalleryItem = useMemo(
    () => testGallery.find((item) => item.id === selectedTestItemId) || testGallery[0],
    [testGallery, selectedTestItemId]
  );

  const activeInspectedSample = useMemo(() => {
    if (testInputMode === 'gallery' && activeTestGalleryItem) {
      return {
        name: activeTestGalleryItem.name,
        dataUrl: activeTestGalleryItem.dataUrl,
        features: activeTestGalleryItem.features,
        hint: activeTestGalleryItem.hint,
        expectedClassId: activeTestGalleryItem.expectedClassId,
      };
    }
    if (customTestPreview) {
      return {
        name: customTestPreview.name,
        dataUrl: customTestPreview.dataUrl,
        features: customTestPreview.features,
        hint: customTestPreview.sourceLabel,
        expectedClassId: undefined,
      };
    }
    return null;
  }, [testInputMode, activeTestGalleryItem, customTestPreview]);

  const xpMissionsList = useMemo(
    () => [
      {
        key: 'kids_ai_lab_train_waste',
        title: 'ฝึกโมเดลคัดแยกขยะรีไซเคิลสำเร็จ',
        xp: 20,
      },
      {
        key: 'kids_ai_lab_train_produce',
        title: 'ฝึกโมเดลจำแนกผักและผลไม้สำเร็จ',
        xp: 20,
      },
      {
        key: 'kids_ai_lab_custom_data_trainer',
        title: 'สอน AI ด้วยภาพวาด อัปโหลด หรือเว็บแคม',
        xp: 25,
      },
      {
        key: 'kids_ai_lab_test_master',
        title: 'ทดสอบจำแนกภาพใหม่ถูกต้อง ≥ 3 ภาพ',
        xp: 25,
      },
    ],
    []
  );

  const earnedXpInLab = xpMissionsList.reduce(
    (sum, m) => (combinedClaimedSet.has(m.key) ? sum + m.xp : sum),
    0
  );
  const totalLabXp = xpMissionsList.reduce((sum, m) => sum + m.xp, 0);

  return (
    <div className="space-y-6">
      {/* XP Award Toast Banner */}
      {xpToast && (
        <div
          role="status"
          className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 flex items-center justify-between gap-3 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <div className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                ได้รับ +{xpToast.points} XP สำเร็จ
              </div>
              <div className="text-xs text-emerald-700 dark:text-emerald-300">
                {xpToast.title}
              </div>
            </div>
          </div>
          <span className="font-mono text-sm font-bold text-emerald-700 dark:text-emerald-300 tabular-nums shrink-0">
            +{xpToast.points} XP
          </span>
        </div>
      )}

      {/* Lab Header & Mission Selector */}
      <section className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                Kids AI &amp; Machine Learning Studio
              </span>
              <span aria-hidden="true">·</span>
              <span>จำแนกภาพจริงในบราวเซอร์</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                XP ห้องแล็บ {earnedXpInLab}/{totalLabXp}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 text-balance">
              {missionConfig.title}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {missionConfig.subtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <AudioNarratorButton
              textToRead="ยินดีต้อนรับสู่ Kids AI Lab ห้องฝึกสอนโมเดล Machine Learning ในบราวเซอร์ เลือกภารกิจ เตรียมภาพตัวอย่างจากการวาด อัปโหลด หรือเว็บแคม แล้วกดฝึกสอนโมเดลเพื่อรับแต้ม XP"
              label="ฟังคำแนะนำแล็บ AI"
            />
            <button
              type="button"
              onClick={handleResetMission}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>รีเซ็ตชุดข้อมูล</span>
            </button>
          </div>
        </div>

        {/* Mission Selector Segmented Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
          {(Object.keys(ML_MISSIONS) as MlMissionId[]).map((id, idx) => {
            const m = ML_MISSIONS[id];
            const isActive = missionId === id;
            const isCompleted = combinedClaimedSet.has(m.xpUniqueKey);
            return (
              <button
                key={id}
                type="button"
                onClick={() => handleSelectMission(id)}
                className={`flex-1 min-w-[190px] px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap ${
                  isActive
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className="font-mono text-xs tabular-nums">0{idx + 1}.</span>
                <span>{m.shortTitle}</span>
                {isCompleted && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </section>

      {errorBanner && (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs sm:text-sm text-rose-800 dark:text-rose-200 flex items-center justify-between gap-2"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorBanner(null)}
            className="p-1 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900 cursor-pointer"
            aria-label="ปิดข้อความแจ้งเตือน"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Two-Zone Interactive Sandbox */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT ZONE (Interactive Stage: Collect Samples & Test Predictions) */}
        <div className="xl:col-span-7 space-y-5">
          {/* Stage Mode Switcher */}
          <div className="flex items-center justify-between gap-3 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => {
                soundEffects.play('click');
                setStageTab('collect');
              }}
              className={`flex-1 py-2.5 px-4 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap ${
                stageTab === 'collect'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4 shrink-0" />
              <span>1. ชุดภาพฝึกสอน ({samples.length} ภาพ)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                soundEffects.play('click');
                setInputDrawer(null);
                setStageTab('test');
              }}
              className={`flex-1 py-2.5 px-4 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap ${
                stageTab === 'test'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Eye className="w-4 h-4 shrink-0" />
              <span>2. ทดสอบทำนายภาพใหม่</span>
            </button>
          </div>

          {/* STAGE VIEW 1: TRAINING DATA COLLECTOR */}
          {stageTab === 'collect' && (
            <div className="space-y-4">
              {/* Inline Draw or Webcam Drawer */}
              {inputDrawer && (
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-indigo-300 dark:border-indigo-700 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                        {inputDrawer.mode === 'draw'
                          ? 'วาดภาพตัวอย่างเพื่อสอน AI'
                          : 'ถ่ายภาพจากกล้องเว็บแคมเพื่อสอน AI'}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        กำลังเพิ่มเข้าหมวด:{' '}
                        <strong className="text-indigo-600 dark:text-indigo-400">
                          {classes.find((c) => c.id === inputDrawer.classId)?.name}
                        </strong>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        stopWebcamStream();
                        setInputDrawer(null);
                      }}
                      className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 cursor-pointer"
                      aria-label="ปิดหน้าต่างเพิ่มภาพ"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {inputDrawer.mode === 'draw' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
                      <div className="sm:col-span-6 flex flex-col items-center gap-2">
                        <canvas
                          ref={drawCanvasRef}
                          width={240}
                          height={240}
                          onPointerDown={(e) => handlePointerDown(drawCanvasRef.current, e)}
                          onPointerMove={(e) => handlePointerMove(drawCanvasRef.current, e)}
                          onPointerUp={handlePointerUp}
                          onPointerCancel={handlePointerUp}
                          className="w-60 h-60 rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-slate-50 touch-none cursor-crosshair shadow-xs"
                        />
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          ลากเมาส์หรือนิ้วเพื่อวาดภาพตัวอย่างให้ชัดเจนตรงกลาง
                        </span>
                      </div>

                      <div className="sm:col-span-6 space-y-3">
                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                            ชื่อภาพตัวอย่าง (ไม่บังคับ)
                          </label>
                          <input
                            type="text"
                            value={customSampleLabel}
                            onChange={(e) => setCustomSampleLabel(e.target.value)}
                            placeholder="เช่น ขวดน้ำสีฟ้า, มะม่วงสุก..."
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <span className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                            เลือกสีพู่กัน
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {BRUSH_COLORS.map((c) => (
                              <button
                                key={c.hex}
                                type="button"
                                onClick={() => {
                                  setBrushColor(c.hex);
                                  setIsEraser(false);
                                }}
                                title={c.label}
                                aria-label={`สี${c.label}`}
                                className={`w-7 h-7 rounded-lg border-2 cursor-pointer transition-transform ${
                                  !isEraser && brushColor === c.hex
                                    ? 'border-slate-900 dark:border-white scale-110'
                                    : 'border-white dark:border-slate-700'
                                }`}
                                style={{ backgroundColor: c.hex }}
                              />
                            ))}
                            <button
                              type="button"
                              onClick={() => setIsEraser((prev) => !prev)}
                              className={`px-2.5 h-7 rounded-lg border text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                                isEraser
                                  ? 'bg-slate-900 text-white border-slate-900'
                                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600'
                              }`}
                            >
                              <Eraser className="w-3.5 h-3.5" />
                              <span>ยางลบ</span>
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                            <span>ขนาดเส้นพู่กัน</span>
                            <span className="font-mono tabular-nums">{brushSize} px</span>
                          </div>
                          <input
                            type="range"
                            min={4}
                            max={26}
                            value={brushSize}
                            onChange={(e) => setBrushSize(Number(e.target.value))}
                            className="w-full accent-indigo-600 cursor-pointer"
                          />
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => clearCanvasElement(drawCanvasRef.current)}
                            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 cursor-pointer"
                          >
                            ล้างกระดาน
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveDrawnTrainingSample}
                            className="flex-1 py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer"
                          >
                            บันทึกภาพเข้าชุดฝึกสอน
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {webcamStatus === 'error' ? (
                        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 space-y-2">
                          <p className="font-semibold">{webcamError}</p>
                          <button
                            type="button"
                            onClick={() =>
                              setInputDrawer({
                                mode: 'draw',
                                target: 'train',
                                classId: inputDrawer.classId,
                              })
                            }
                            className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold cursor-pointer"
                          >
                            เปลี่ยนไปวาดภาพแทน
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                          <video
                            ref={videoRef}
                            playsInline
                            muted
                            className="w-56 h-56 rounded-xl bg-slate-900 object-cover border border-slate-300 dark:border-slate-700"
                          />
                          <div className="flex-1 space-y-3 w-full">
                            <input
                              type="text"
                              value={customSampleLabel}
                              onChange={(e) => setCustomSampleLabel(e.target.value)}
                              placeholder="ตั้งชื่อภาพที่ถ่าย (เช่น ขวดน้ำของฉัน)"
                              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs"
                            />
                            <button
                              type="button"
                              disabled={webcamStatus !== 'ready'}
                              onClick={handleCaptureWebcamTrainingSample}
                              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <Camera className="w-4 h-4" />
                              <span>
                                {webcamStatus === 'ready'
                                  ? 'ถ่ายภาพและบันทึกเข้าชุดฝึกสอน'
                                  : 'กำลังเปิดกล้องเว็บแคม...'}
                              </span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Class Data Buckets */}
              <div className="grid grid-cols-1 gap-4">
                {classes.map((cls) => {
                  const classSamples = samples.filter((s) => s.classId === cls.id);
                  return (
                    <div
                      key={cls.id}
                      className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3.5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-sm shrink-0"
                              style={{ backgroundColor: cls.accentHex }}
                              aria-hidden="true"
                            />
                            {missionId === 'custom_lab' ? (
                              <input
                                type="text"
                                value={cls.name}
                                onChange={(e) => handleRenameClass(cls.id, e.target.value)}
                                aria-label={`แก้ไขชื่อ${cls.shortName}`}
                                className="text-sm sm:text-base font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 w-full max-w-xs"
                              />
                            ) : (
                              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                                {cls.name}
                              </h3>
                            )}
                            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums shrink-0">
                              · {classSamples.length} ภาพ
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {cls.description}
                          </p>
                        </div>

                        {/* Add Sample Controls */}
                        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              soundEffects.play('click');
                              setInputDrawer({ mode: 'draw', target: 'train', classId: cls.id });
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer whitespace-nowrap"
                          >
                            <Pencil className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                            <span>วาดภาพ</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => uploadInputRefs.current[cls.id]?.click()}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer whitespace-nowrap"
                          >
                            <Upload className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>อัปโหลด</span>
                          </button>
                          <input
                            ref={(el) => {
                              uploadInputRefs.current[cls.id] = el;
                            }}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              handleUploadTrainingFile(cls.id, file);
                              e.target.value = '';
                            }}
                          />

                          <button
                            type="button"
                            onClick={() => {
                              soundEffects.play('click');
                              setInputDrawer({ mode: 'webcam', target: 'train', classId: cls.id });
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer whitespace-nowrap"
                          >
                            <Camera className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            <span>เว็บแคม</span>
                          </button>
                        </div>
                      </div>

                      {/* Raster Image Sample Thumbnails */}
                      {classSamples.length === 0 ? (
                        <div className="py-6 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
                          ยังไม่มีภาพตัวอย่างในหมวดนี้ กด "วาดภาพ" หรือ "อัปโหลด" เพื่อสอน AI
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          {classSamples.map((sample) => (
                            <div
                              key={sample.id}
                              className="group relative p-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex flex-col items-center gap-1.5"
                            >
                              <button
                                type="button"
                                onClick={() => handleRemoveSample(sample.id)}
                                title={`ลบ ${sample.name}`}
                                aria-label={`ลบภาพ ${sample.name}`}
                                className="absolute top-1.5 right-1.5 p-1 rounded-md bg-white/90 dark:bg-slate-900/90 text-slate-400 hover:text-rose-600 border border-slate-200 dark:border-slate-700 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                              <img
                                src={sample.dataUrl}
                                alt={sample.name}
                                className="w-16 h-16 rounded-lg object-contain bg-white border border-slate-200 dark:border-slate-700"
                              />
                              <div className="w-full text-center">
                                <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate">
                                  {sample.name}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  {sample.source === 'preset'
                                    ? 'ชุดตัวอย่าง'
                                    : sample.source === 'draw'
                                    ? 'วาดเอง'
                                    : sample.source === 'upload'
                                    ? 'อัปโหลด'
                                    : 'เว็บแคม'}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STAGE VIEW 2: TESTING & PREDICTION STUDIO */}
          {stageTab === 'test' && (
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5">
              {!trainedModel ? (
                <div className="py-12 px-4 text-center space-y-3 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                  <Brain className="w-10 h-10 mx-auto text-slate-400" />
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      {isTraining ? 'กำลังฝึกสอนโมเดล AI...' : 'ยังไม่ได้ฝึกสอนโมเดล AI'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                      กรุณากดปุ่ม "เริ่มฝึกสอนโมเดล AI" ในแผงควบคุมด้านขวา เพื่อให้โมเดลเรียนรู้ลักษณะสีและรูปทรงจากภาพตัวอย่างก่อนทดสอบทำนายผล
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Test Input Source Tabs */}
                  <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    {(
                      [
                        { key: 'gallery', label: 'ภาพทดสอบจากคลัง', icon: Layers },
                        { key: 'draw', label: 'วาดภาพทดสอบ', icon: Pencil },
                        { key: 'upload', label: 'อัปโหลดรูปภาพ', icon: ImagePlus },
                        { key: 'webcam', label: 'กล้องเว็บแคม', icon: Camera },
                      ] as const
                    ).map((item) => {
                      const IconComp = item.icon;
                      const active = testInputMode === item.key;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => {
                            soundEffects.play('click');
                            setTestInputMode(item.key);
                            setPrediction(null);
                          }}
                          className={`flex-1 min-w-[120px] py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                            active
                              ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          <IconComp className="w-3.5 h-3.5 shrink-0" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Test Mode 1: Unseen Gallery */}
                  {testInputMode === 'gallery' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>เลือกภาพใหม่ที่โมเดลไม่เคยเห็นมาก่อน แล้วกด "ให้ AI ทำนายภาพ"</span>
                        <span className="font-mono tabular-nums">
                          ทายถูกแล้ว {Object.values(verifiedTestIds).filter(Boolean).length}/
                          {testGallery.length} ภาพ
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {testGallery.map((item) => {
                          const isSelected = activeTestGalleryItem?.id === item.id;
                          const testedStatus = verifiedTestIds[item.id];
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                soundEffects.play('click');
                                setSelectedTestItemId(item.id);
                                runPrediction(item.features, item);
                              }}
                              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                                isSelected
                                  ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40'
                                  : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:border-indigo-300'
                              }`}
                            >
                              <img
                                src={item.dataUrl}
                                alt={item.name}
                                className="w-12 h-12 rounded-lg object-contain bg-white border border-slate-200 shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                                  {item.name}
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                  {testedStatus === true
                                    ? '✓ AI ทายถูกต้อง'
                                    : testedStatus === false
                                    ? '✕ AI ยังทายผิด'
                                    : 'คลิกเพื่อสแกนทำนาย'}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Test Mode 2: Freehand Draw Test */}
                  {testInputMode === 'draw' && (
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                      <div className="sm:col-span-6 flex justify-center">
                        <canvas
                          ref={testDrawCanvasRef}
                          width={240}
                          height={240}
                          onPointerDown={(e) => handlePointerDown(testDrawCanvasRef.current, e)}
                          onPointerMove={(e) => handlePointerMove(testDrawCanvasRef.current, e)}
                          onPointerUp={handlePointerUp}
                          onPointerCancel={handlePointerUp}
                          className="w-60 h-60 rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-slate-50 touch-none cursor-crosshair"
                        />
                      </div>
                      <div className="sm:col-span-6 space-y-3">
                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                          เลือกสีและวาดภาพทดสอบ
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {BRUSH_COLORS.map((c) => (
                            <button
                              key={c.hex}
                              type="button"
                              onClick={() => {
                                setBrushColor(c.hex);
                                setIsEraser(false);
                              }}
                              aria-label={`สี${c.label}`}
                              className={`w-7 h-7 rounded-lg border-2 cursor-pointer ${
                                !isEraser && brushColor === c.hex
                                  ? 'border-slate-900 dark:border-white scale-110'
                                  : 'border-white dark:border-slate-700'
                              }`}
                              style={{ backgroundColor: c.hex }}
                            />
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              clearCanvasElement(testDrawCanvasRef.current);
                              setPrediction(null);
                            }}
                            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
                          >
                            ล้างภาพ
                          </button>
                          <button
                            type="button"
                            onClick={handlePredictDrawnTest}
                            className="flex-1 py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer"
                          >
                            ให้ AI ทำนายภาพที่วาด
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Test Mode 3: Upload File Test */}
                  {testInputMode === 'upload' && (
                    <div className="p-6 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-center space-y-3">
                      <Upload className="w-8 h-8 mx-auto text-indigo-600 dark:text-indigo-400" />
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          อัปโหลดรูปภาพจากเครื่องเพื่อให้ AI ทำนาย
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          รองรับไฟล์ภาพ .png, .jpg, .webp ประมวลผลในบราวเซอร์โดยไม่ส่งออกนอกเครื่อง
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => testUploadInputRef.current?.click()}
                        className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer"
                      >
                        เลือกไฟล์รูปภาพทดสอบ
                      </button>
                      <input
                        ref={testUploadInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          handlePredictUploadedTest(e.target.files?.[0]);
                          e.target.value = '';
                        }}
                      />
                    </div>
                  )}

                  {/* Test Mode 4: Webcam Test */}
                  {testInputMode === 'webcam' && (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                      {webcamStatus === 'error' ? (
                        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200">
                          {webcamError}
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                          <video
                            ref={videoRef}
                            playsInline
                            muted
                            className="w-52 h-52 rounded-xl bg-slate-900 object-cover border border-slate-300 dark:border-slate-700"
                          />
                          <div className="space-y-2.5 flex-1">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                              นำวัตถุมาวางหน้ากล้องเว็บแคม
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              เช่น ขวดพลาสติก ผลไม้ หรือภาพวาดบนกระดาษ แล้วกดปุ่มสแกนด้านล่าง
                            </p>
                            <button
                              type="button"
                              disabled={webcamStatus !== 'ready'}
                              onClick={handlePredictWebcamTest}
                              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer"
                            >
                              <Camera className="w-4 h-4" />
                              <span>
                                {webcamStatus === 'ready'
                                  ? 'สแกนภาพจากกล้องและทำนาย'
                                  : 'กำลังเชื่อมต่อกล้อง...'}
                              </span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Prediction Output & Explainable AI (XAI) Breakdown */}
                  {prediction && activeInspectedSample && (
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          ผลการทำนายและเหตุผลของ AI (Explainable AI)
                        </h4>
                        <button
                          type="button"
                          onClick={() => setShowVisionGrid((v) => !v)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          <span>
                            {showVisionGrid ? 'ซ่อนมุมมองพิกเซล 4×4' : 'ดูสิ่งที่ AI มองเห็น (4×4)'}
                          </span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                        {/* Inspected Image + Optional 4x4 Pixel Feature Grid */}
                        <div className="md:col-span-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col items-center gap-2.5 text-center">
                          {showVisionGrid ? (
                            <div
                              className="w-24 h-24 rounded-lg overflow-hidden grid grid-cols-4 grid-rows-4 border border-slate-300 dark:border-slate-600"
                              aria-label="ตารางค่าสี 4 คูณ 4 ที่ AI สกัดจากภาพ"
                            >
                              {Array.from({ length: 16 }).map((_, cellIdx) => {
                                const r = Math.min(
                                  255,
                                  Math.round((activeInspectedSample.features[cellIdx * 3] || 0) * 650)
                                );
                                const g = Math.min(
                                  255,
                                  Math.round(
                                    (activeInspectedSample.features[cellIdx * 3 + 1] || 0) * 650
                                  )
                                );
                                const b = Math.min(
                                  255,
                                  Math.round(
                                    (activeInspectedSample.features[cellIdx * 3 + 2] || 0) * 650
                                  )
                                );
                                return (
                                  <div
                                    key={cellIdx}
                                    style={{ backgroundColor: `rgb(${r}, ${g}, ${b})` }}
                                  />
                                );
                              })}
                            </div>
                          ) : (
                            <img
                              src={activeInspectedSample.dataUrl}
                              alt={activeInspectedSample.name}
                              className="w-24 h-24 rounded-lg object-contain bg-white border border-slate-200 dark:border-slate-700"
                            />
                          )}
                          <div className="space-y-0.5">
                            <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                              {activeInspectedSample.name}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              {activeInspectedSample.hint}
                            </div>
                          </div>
                        </div>

                        {/* Class Probability Bars */}
                        <div className="md:col-span-8 space-y-3">
                          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                คำทำนายอันดับ 1 ของโมเดล:
                              </span>
                              {activeInspectedSample.expectedClassId && (
                                <span
                                  className={`text-xs font-semibold ${
                                    prediction.predictedClassId ===
                                    activeInspectedSample.expectedClassId
                                      ? 'text-emerald-600 dark:text-emerald-400'
                                      : 'text-rose-600 dark:text-rose-400'
                                  }`}
                                >
                                  {prediction.predictedClassId ===
                                  activeInspectedSample.expectedClassId
                                    ? '✓ ตรงกับเฉลย'
                                    : `✕ เฉลยคือ ${
                                        classes.find(
                                          (c) => c.id === activeInspectedSample.expectedClassId
                                        )?.shortName || ''
                                      }`}
                                </span>
                              )}
                            </div>

                            <div className="flex items-baseline justify-between gap-2">
                              <span className="text-lg font-bold text-slate-900 dark:text-white">
                                {prediction.predictedClassName}
                              </span>
                              <span className="font-mono text-base font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                                {prediction.confidence}%
                              </span>
                            </div>

                            <div className="space-y-2 pt-1">
                              {prediction.probabilities.map((prob) => (
                                <div key={prob.classId} className="space-y-1">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                                      {prob.className}
                                    </span>
                                    <span className="font-mono tabular-nums text-slate-600 dark:text-slate-300">
                                      {prob.probability}%
                                    </span>
                                  </div>
                                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                                    <div
                                      className="h-full rounded-full transition-all duration-300"
                                      style={{
                                        width: `${prob.probability}%`,
                                        backgroundColor: prob.accentHex,
                                      }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Explainable AI Visual Cues & Nearest Training Neighbors */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                              <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                                จุดเด่นที่ AI ตรวจพบ
                              </div>
                              <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                                {prediction.visualCues.map((cue) => (
                                  <li key={cue}>• {cue}</li>
                                ))}
                              </ul>
                            </div>

                            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                              <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                                ภาพฝึกสอนที่คล้ายคลึงที่สุด
                              </div>
                              <div className="flex items-center gap-2">
                                {prediction.nearestMatches.map((m) => (
                                  <div key={m.sampleId} className="flex flex-col items-center w-16">
                                    <img
                                      src={m.dataUrl}
                                      alt={m.name}
                                      className="w-10 h-10 rounded-md object-contain bg-white border border-slate-200"
                                    />
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono tabular-nums mt-0.5">
                                      {m.similarity}%
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* RIGHT ZONE (Control & Concept Deck: Hyperparameters, Training Curve, XP Quests) */}
        <div className="xl:col-span-5 space-y-5">
          {/* Dataset Health & Balance Check */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>ตั้งค่าและฝึกสอนโมเดล AI</span>
              </h3>
              <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                รวม {datasetHealth.totalSamples} ภาพ
              </span>
            </div>

            {/* Balance Warnings (if any) */}
            {datasetHealth.warnings.length > 0 ? (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-1">
                {datasetHealth.warnings.map((w) => (
                  <div
                    key={w}
                    className="flex items-start gap-2 text-xs text-amber-800 dark:text-amber-200"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-200">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>ชุดข้อมูลสมดุลดีเยี่ยม พร้อมฝึกสอนโมเดล AI แล้ว</span>
              </div>
            )}

            {/* Hyperparameter: Epochs Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label
                  htmlFor="kids-ml-epochs-slider"
                  className="font-semibold text-slate-700 dark:text-slate-200"
                >
                  จำนวนรอบฝึกสอน (Epochs)
                </label>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                  {epochs} รอบ
                </span>
              </div>
              <input
                id="kids-ml-epochs-slider"
                type="range"
                min={10}
                max={60}
                step={5}
                value={epochs}
                disabled={isTraining}
                onChange={(e) => {
                  setEpochs(Number(e.target.value));
                  if (trainedModel) setIsModelStale(true);
                }}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-mono tabular-nums">
                <span>10 รอบ (เร็ว)</span>
                <span>35 รอบ</span>
                <span>60 รอบ (ละเอียด)</span>
              </div>
            </div>

            {/* Hyperparameter: Classifier Algorithm */}
            <div className="space-y-1.5">
              <span className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                รูปแบบการเรียนรู้ของสมองกล
              </span>
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  disabled={isTraining}
                  onClick={() => {
                    setClassifierMode('linear');
                    if (trainedModel) setIsModelStale(true);
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    classifierMode === 'linear'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Neural Weights
                </button>
                <button
                  type="button"
                  disabled={isTraining}
                  onClick={() => {
                    setClassifierMode('knn');
                    if (trainedModel) setIsModelStale(true);
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    classifierMode === 'knn'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Nearest Neighbor
                </button>
              </div>
            </div>

            {/* Primary CTA: Train Model */}
            <button
              type="button"
              disabled={!datasetHealth.isReady || isTraining}
              onClick={handleTrainModel}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm shadow-sm transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>
                {isTraining
                  ? `กำลังฝึกสอนโมเดล... (${trainingStepIndex}/${epochs} รอบ)`
                  : trainedModel && !isModelStale
                  ? 'ฝึกสอนโมเดลใหม่อีกครั้ง'
                  : isModelStale
                  ? 'อัปเดตและฝึกสอนโมเดลใหม่ (ข้อมูลเปลี่ยน)'
                  : 'เริ่มฝึกสอนโมเดล AI (Train Model)'}
              </span>
            </button>

            {trainedModel && !isTraining && (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5" />
                    <span>
                      {isModelStale
                        ? 'มีข้อมูลใหม่ กรุณาฝึกซ้ำเพื่ออัปเดตโมเดล'
                        : 'โมเดลพร้อมใช้งานทดสอบแล้ว'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                    ความแม่นยำชุดฝึกสอน {trainedModel.trainingAccuracy}% · Loss{' '}
                    {trainedModel.finalLoss}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.play('click');
                    setStageTab('test');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
                >
                  ไปทดสอบ →
                </button>
              </div>
            )}
          </div>

          {/* Live Training Accuracy & Loss Coordinate Curve */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                กราฟพัฒนาการเรียนรู้ของโมเดล (Learning Curve)
              </h3>
              {displayedMetrics.length > 0 && (
                <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {displayedMetrics[displayedMetrics.length - 1].accuracy}%
                </span>
              )}
            </div>

            {displayedMetrics.length === 0 ? (
              <div className="h-36 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs text-slate-400 px-4 text-center">
                กราฟแสดงความแม่นยำ (%) และค่าความคลาดเคลื่อน (Loss) จะปรากฏเมื่อกดฝึกสอนโมเดล
              </div>
            ) : (
              <div className="space-y-2">
                <svg
                  viewBox="0 0 360 150"
                  className="w-full h-36 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700"
                  role="img"
                  aria-label="กราฟความแม่นยำและค่าความคลาดเคลื่อนตามรอบการฝึกสอน"
                >
                  {/* Grid lines */}
                  {[0, 25, 50, 75, 100].map((pct) => {
                    const y = 124 - (pct / 100) * 100;
                    return (
                      <g key={pct}>
                        <line
                          x1={38}
                          y1={y}
                          x2={344}
                          y2={y}
                          stroke="currentColor"
                          className="text-slate-200 dark:text-slate-700"
                          strokeWidth={1}
                        />
                        <text
                          x={32}
                          y={y + 3}
                          textAnchor="end"
                          className="fill-slate-400 text-[9px] font-mono"
                        >
                          {pct}%
                        </text>
                      </g>
                    );
                  })}

                  {/* Accuracy polyline */}
                  {displayedMetrics.length > 1 && (
                    <polyline
                      fill="none"
                      stroke="#059669"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={displayedMetrics
                        .map((m, idx) => {
                          const x =
                            38 +
                            (idx / Math.max(1, (pendingModel?.epochs || trainedModel?.epochs || 1) - 1)) *
                              306;
                          const y = 124 - (m.accuracy / 100) * 100;
                          return `${x.toFixed(1)},${y.toFixed(1)}`;
                        })
                        .join(' ')}
                    />
                  )}

                  {/* Loss polyline (scaled 0..1.5 -> 0..100%) */}
                  {displayedMetrics.length > 1 && (
                    <polyline
                      fill="none"
                      stroke="#d97706"
                      strokeWidth={2}
                      strokeDasharray="4 3"
                      points={displayedMetrics
                        .map((m, idx) => {
                          const x =
                            38 +
                            (idx / Math.max(1, (pendingModel?.epochs || trainedModel?.epochs || 1) - 1)) *
                              306;
                          const clampedLoss = Math.min(1.5, m.loss) / 1.5;
                          const y = 124 - clampedLoss * 100;
                          return `${x.toFixed(1)},${y.toFixed(1)}`;
                        })
                        .join(' ')}
                    />
                  )}

                  <text x={38} y={142} className="fill-slate-400 text-[9px] font-mono">
                    Epoch 1
                  </text>
                  <text
                    x={344}
                    y={142}
                    textAnchor="end"
                    className="fill-slate-400 text-[9px] font-mono"
                  >
                    Epoch {pendingModel?.epochs || trainedModel?.epochs || epochs}
                  </text>
                </svg>

                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    — เส้นสีเขียว: ความแม่นยำ (Accuracy %)
                  </span>
                  <span className="text-amber-600 dark:text-amber-400 font-semibold">
                    -- เส้นสีส้ม: ค่าคลาดเคลื่อน (Loss)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* XP Missions Tracker */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                <span>ภารกิจรับแต้ม XP ประจำห้อง AI Lab</span>
              </h3>
              <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                {earnedXpInLab}/{totalLabXp} XP
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {xpMissionsList.map((m) => {
                const done = combinedClaimedSet.has(m.key);
                return (
                  <div
                    key={m.key}
                    className="py-2.5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <CheckCircle2
                        className={`w-4 h-4 shrink-0 ${
                          done
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-300 dark:text-slate-600'
                        }`}
                      />
                      <span
                        className={`truncate ${
                          done
                            ? 'text-slate-900 dark:text-slate-100 font-semibold'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {m.title}
                      </span>
                    </div>
                    <span
                      className={`font-mono font-bold tabular-nums shrink-0 ${
                        done
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {done ? 'ได้รับแล้ว' : `+${m.xp} XP`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
