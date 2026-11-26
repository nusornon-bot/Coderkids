export type MlMissionId = 'waste_sorting' | 'fruits_veggies' | 'custom_lab';
export type MlClassifierMode = 'linear' | 'knn';

export interface MlClassDef {
  id: string;
  name: string;
  shortName: string;
  accentHex: string;
  badgeText: string;
  description: string;
}

export interface MlSampleItem {
  id: string;
  classId: string;
  name: string;
  dataUrl: string;
  features: number[];
  source: 'preset' | 'draw' | 'upload' | 'webcam';
}

export interface MlTestGalleryItem {
  id: string;
  expectedClassId: string;
  name: string;
  hint: string;
  dataUrl: string;
  features: number[];
}

export interface MlEpochMetric {
  epoch: number;
  loss: number;
  accuracy: number;
}

export interface MlClassDiagnostic {
  classId: string;
  count: number;
}

export interface MlDatasetHealth {
  totalSamples: number;
  classCounts: MlClassDiagnostic[];
  minCount: number;
  maxCount: number;
  isReady: boolean;
  isBalanced: boolean;
  warnings: string[];
}

export interface MlTrainedModel {
  missionId: MlMissionId;
  mode: MlClassifierMode;
  epochs: number;
  classes: MlClassDef[];
  samples: MlSampleItem[];
  weights: number[][]; // [classIndex][featureIndex]
  biases: number[];
  centroids: number[][];
  epochMetrics: MlEpochMetric[];
  trainingAccuracy: number;
  finalLoss: number;
  trainedAt: number;
}

export interface MlClassProbability {
  classId: string;
  className: string;
  accentHex: string;
  probability: number; // 0..100
}

export interface MlNearestMatch {
  sampleId: string;
  name: string;
  classId: string;
  dataUrl: string;
  similarity: number; // 0..100
}

export interface MlPredictionResult {
  predictedClassId: string;
  predictedClassName: string;
  confidence: number; // 0..100
  probabilities: MlClassProbability[];
  nearestMatches: MlNearestMatch[];
  visualCues: string[];
}

export const ML_FEATURE_SIZE = 72; // 48 spatial RGB (4x4x3) + 16 color histogram/stats + 8 edge/shape

function rgbToHsv(rNorm: number, gNorm: number, bNorm: number): { h: number; s: number; v: number } {
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const delta = max - min;

  let h = 0;
  if (delta > 1e-5) {
    if (max === rNorm) {
      h = ((gNorm - bNorm) / delta) % 6;
    } else if (max === gNorm) {
      h = (bNorm - rNorm) / delta + 2;
    } else {
      h = (rNorm - gNorm) / delta + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }

  const s = max <= 1e-5 ? 0 : delta / max;
  return { h, s, v: max };
}

/**
 * Extracts a 72-dimensional normalized visual feature vector from a raw RGBA pixel buffer.
 * Pure TypeScript implementation (works identically in browser canvas and Node/Vitest).
 */
export function extractFeaturesFromRgba(
  rgba: ArrayLike<number>,
  width: number,
  height: number
): number[] {
  const safeW = Math.max(1, Math.floor(width));
  const safeH = Math.max(1, Math.floor(height));
  const expectedLen = safeW * safeH * 4;

  const spatialR = new Float64Array(16);
  const spatialG = new Float64Array(16);
  const spatialB = new Float64Array(16);
  const spatialWeight = new Float64Array(16);

  const hueBins = new Float64Array(12);
  let fgCount = 0;
  let satSum = 0;
  let valSum = 0;
  let warmSum = 0;
  let greenSum = 0;

  // Luminance buffer for spatial gradient & shape compactness
  const lumGrid = new Float64Array(safeW * safeH);
  const fgMask = new Uint8Array(safeW * safeH);

  let centerFg = 0;
  let totalPixels = safeW * safeH;

  for (let y = 0; y < safeH; y += 1) {
    const cellY = Math.min(3, Math.floor((y * 4) / safeH));
    const inCenterY = y >= safeH * 0.25 && y <= safeH * 0.75;

    for (let x = 0; x < safeW; x += 1) {
      const idx = y * safeW + x;
      const base = idx * 4;
      if (base + 3 >= expectedLen || base + 3 >= rgba.length) continue;

      const alpha = (rgba[base + 3] ?? 255) / 255;
      if (alpha < 0.08) continue;

      const r = (rgba[base] ?? 0) / 255;
      const g = (rgba[base + 1] ?? 0) / 255;
      const b = (rgba[base + 2] ?? 0) / 255;
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      lumGrid[idx] = lum;

      // Ignore near-pure-white canvas background so drawings & objects keep crisp signatures
      const isNearWhite = r > 0.94 && g > 0.94 && b > 0.94;
      const weight = isNearWhite ? 0.08 : 1.0;

      const cellX = Math.min(3, Math.floor((x * 4) / safeW));
      const cellIdx = cellY * 4 + cellX;
      spatialR[cellIdx] += r * weight;
      spatialG[cellIdx] += g * weight;
      spatialB[cellIdx] += b * weight;
      spatialWeight[cellIdx] += weight;

      if (!isNearWhite) {
        fgMask[idx] = 1;
        fgCount += 1;
        if (inCenterY && x >= safeW * 0.25 && x <= safeW * 0.75) {
          centerFg += 1;
        }

        const { h, s, v } = rgbToHsv(r, g, b);
        satSum += s;
        valSum += v;
        if (r > b + 0.12) warmSum += 1;
        if (g > r + 0.08 && g > b + 0.05) greenSum += 1;

        if (s > 0.12) {
          const bin = Math.min(11, Math.floor(h / 30));
          hueBins[bin] += 1;
        }
      }
    }
  }

  const features: number[] = [];

  // 1) 4x4 Spatial RGB (48 features)
  for (let c = 0; c < 16; c += 1) {
    const w = spatialWeight[c] > 0 ? spatialWeight[c] : 1;
    features.push((spatialR[c] / w) * 0.85);
    features.push((spatialG[c] / w) * 0.85);
    features.push((spatialB[c] / w) * 0.85);
  }

  // 2) 12 Hue histogram bins + 4 global color stats (16 features)
  const safeFg = Math.max(1, fgCount);
  for (let b = 0; b < 12; b += 1) {
    features.push((hueBins[b] / safeFg) * 1.6);
  }
  features.push((satSum / safeFg) * 1.2);
  features.push((valSum / safeFg) * 1.1);
  features.push((warmSum / safeFg) * 1.4);
  features.push((greenSum / safeFg) * 1.5);

  // 3) Edge & Shape geometry stats (8 features)
  let hEdge = 0;
  let vEdge = 0;
  let upperFg = 0;
  let lowerFg = 0;
  let leftFg = 0;
  let rightFg = 0;

  for (let y = 0; y < safeH; y += 1) {
    for (let x = 0; x < safeW; x += 1) {
      const idx = y * safeW + x;
      if (x + 1 < safeW) {
        hEdge += Math.abs(lumGrid[idx + 1] - lumGrid[idx]);
      }
      if (y + 1 < safeH) {
        vEdge += Math.abs(lumGrid[idx + safeW] - lumGrid[idx]);
      }
      if (fgMask[idx]) {
        if (y < safeH / 2) upperFg += 1;
        else lowerFg += 1;
        if (x < safeW / 2) leftFg += 1;
        else rightFg += 1;
      }
    }
  }

  const fillRatio = fgCount / Math.max(1, totalPixels);
  const centerRatio = centerFg / safeFg;
  const topHeavy = upperFg / safeFg;
  const bottomHeavy = lowerFg / safeFg;
  const leftHeavy = leftFg / safeFg;
  const rightHeavy = rightFg / safeFg;

  features.push(Math.min(1.5, (hEdge / Math.max(1, totalPixels)) * 4.5));
  features.push(Math.min(1.5, (vEdge / Math.max(1, totalPixels)) * 4.5));
  features.push(fillRatio * 1.1);
  features.push(centerRatio * 1.1);
  features.push(topHeavy);
  features.push(bottomHeavy);
  features.push(leftHeavy);
  features.push(rightHeavy);

  // L2 normalize so cosine & dot products behave cleanly
  let normSq = 0;
  for (let i = 0; i < features.length; i += 1) {
    normSq += features[i] * features[i];
  }
  const norm = Math.sqrt(normSq) || 1;
  return features.map((v) => Number((v / norm).toFixed(5)));
}

/**
 * Generates human-friendly visual cues from a 72-d feature vector for Explainable AI cards.
 */
export function describeVisualCues(features: number[]): string[] {
  if (features.length < ML_FEATURE_SIZE) return ['ตรวจพบลักษณะภาพพื้นฐาน'];

  const cues: string[] = [];
  // Hue bins start at index 48..59
  let maxHueVal = 0;
  let maxHueIdx = -1;
  for (let i = 0; i < 12; i += 1) {
    const val = features[48 + i];
    if (val > maxHueVal) {
      maxHueVal = val;
      maxHueIdx = i;
    }
  }

  const saturation = features[60];
  const warmth = features[62];
  const greenness = features[63];
  const hEdge = features[64];
  const vEdge = features[65];
  const fillRatio = features[66];
  const centerRatio = features[67];

  if (saturation < 0.09) {
    cues.push('โทนสีกลาง/ใสหรือสีโลหะ');
  } else if (greenness > 0.14 || (maxHueIdx >= 2 && maxHueIdx <= 5 && maxHueVal > 0.12)) {
    cues.push('โทนสีเขียวธรรมชาติเด่นชัด');
  } else if (maxHueIdx === 0 || maxHueIdx === 11) {
    cues.push('โทนสีแดง/ชมพูเข้ม');
  } else if (maxHueIdx === 1 || warmth > 0.16) {
    cues.push('โทนสีเหลือง/ส้มอบอุ่น');
  } else if (maxHueIdx >= 6 && maxHueIdx <= 8) {
    cues.push('โทนสีฟ้า/น้ำเงิน');
  } else {
    cues.push('โทนสีผสมหลายเฉด');
  }

  if (vEdge > hEdge * 1.15) {
    cues.push('โครงสร้างขอบแนวตั้ง/ทรงกระบอกหรือขวด');
  } else if (hEdge > vEdge * 1.15) {
    cues.push('โครงสร้างขอบแนวนอน/รูปทรงกว้าง');
  } else {
    cues.push('รูปทรงสมมาตรหรือขอบโค้งมน');
  }

  if (centerRatio > 0.2) {
    cues.push('วัตถุรวมตัวหนาแน่นตรงกลางภาพ');
  } else if (fillRatio < 0.12) {
    cues.push('ลายเส้นโปร่งหรือพื้นที่ว่างสูง');
  }

  return cues;
}

export function cosineSimilarity(a: readonly number[], b: readonly number[]): number {
  const len = Math.min(a.length, b.length);
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < len; i += 1) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  if (denom <= 1e-8) return 0;
  return dot / denom;
}

export function evaluateDatasetHealth(
  samples: readonly MlSampleItem[],
  classes: readonly MlClassDef[]
): MlDatasetHealth {
  const countsMap: Record<string, number> = {};
  for (const c of classes) {
    countsMap[c.id] = 0;
  }
  for (const s of samples) {
    if (s.classId in countsMap) {
      countsMap[s.classId] += 1;
    }
  }

  const classCounts: MlClassDiagnostic[] = classes.map((c) => ({
    classId: c.id,
    count: countsMap[c.id] || 0,
  }));

  const countValues = classCounts.map((d) => d.count);
  const minCount = countValues.length > 0 ? Math.min(...countValues) : 0;
  const maxCount = countValues.length > 0 ? Math.max(...countValues) : 0;

  const warnings: string[] = [];
  if (classes.length < 2) {
    warnings.push('ต้องมีอย่างน้อย 2 หมวดหมู่ในการจำแนก');
  }
  const emptyClasses = classCounts.filter((c) => c.count === 0);
  if (emptyClasses.length > 0) {
    warnings.push('มีบางหมวดหมู่ที่ยังไม่มีภาพตัวอย่างเลย AI จะไม่สามารถทายหมวดนั้นได้');
  } else if (minCount < 2) {
    warnings.push('ควรมีภาพตัวอย่างอย่างน้อยหมวดละ 2–3 ภาพขึ้นไปเพื่อให้ AI เรียนรู้ได้แม่นยำ');
  }
  if (minCount > 0 && maxCount / minCount > 2.5) {
    warnings.push('จำนวนภาพแต่ละหมวดต่างกันมากเกินไป อาจทำให้ AI เอนเอียง (Data Bias)');
  }

  return {
    totalSamples: samples.length,
    classCounts,
    minCount,
    maxCount,
    isReady: classes.length >= 2 && emptyClasses.length === 0,
    isBalanced: emptyClasses.length === 0 && (minCount === 0 ? false : maxCount / minCount <= 2.5),
    warnings,
  };
}

function softmax(logits: number[]): number[] {
  const maxLogit = Math.max(...logits);
  const exps = logits.map((v) => Math.exp(Math.min(40, v - maxLogit)));
  const sum = exps.reduce((acc, v) => acc + v, 0) || 1;
  return exps.map((v) => v / sum);
}

/**
 * Trains a real in-browser multi-class Linear Softmax Classifier + Class Centroids
 * over the extracted pixel feature vectors.
 */
export function trainKidsMlModel(params: {
  missionId: MlMissionId;
  classes: MlClassDef[];
  samples: MlSampleItem[];
  epochs: number;
  mode: MlClassifierMode;
}): MlTrainedModel {
  const { missionId, classes, samples, epochs, mode } = params;
  const safeEpochs = Math.max(5, Math.min(80, Math.round(epochs)));
  const numClasses = classes.length;
  const dim = ML_FEATURE_SIZE;

  // Compute class centroids first to warm-start linear weights cleanly
  const centroids: number[][] = Array.from({ length: numClasses }, () => new Array(dim).fill(0));
  const classIndexById = new Map<string, number>();
  const classSampleCounts = new Array(numClasses).fill(0);

  classes.forEach((cls, idx) => classIndexById.set(cls.id, idx));

  for (const s of samples) {
    const cIdx = classIndexById.get(s.classId);
    if (cIdx === undefined) continue;
    classSampleCounts[cIdx] += 1;
    for (let f = 0; f < dim; f += 1) {
      centroids[cIdx][f] += s.features[f] ?? 0;
    }
  }

  for (let c = 0; c < numClasses; c += 1) {
    const count = Math.max(1, classSampleCounts[c]);
    let normSq = 0;
    for (let f = 0; f < dim; f += 1) {
      centroids[c][f] /= count;
      normSq += centroids[c][f] * centroids[c][f];
    }
    const norm = Math.sqrt(normSq) || 1;
    for (let f = 0; f < dim; f += 1) {
      centroids[c][f] /= norm;
    }
  }

  // Initialize weights close to scaled centroids so gradient descent converges deterministically
  const weights: number[][] = centroids.map((cent) => cent.map((v) => v * 1.5));
  const biases: number[] = new Array(numClasses).fill(0);

  const lr = 0.65;
  const reg = 0.002;
  const epochMetrics: MlEpochMetric[] = [];

  const validSamples = samples.filter((s) => classIndexById.has(s.classId));

  for (let ep = 1; ep <= safeEpochs; ep += 1) {
    let totalLoss = 0;
    let correct = 0;

    // Deterministic mini-shuffle per epoch for smoother convergence
    const ordered = [...validSamples];
    for (let i = ordered.length - 1; i > 0; i -= 1) {
      const j = (i * 7 + ep * 13) % (i + 1);
      [ordered[i], ordered[j]] = [ordered[j], ordered[i]];
    }

    for (const sample of ordered) {
      const targetIdx = classIndexById.get(sample.classId)!;
      const logits = new Array(numClasses).fill(0);
      for (let c = 0; c < numClasses; c += 1) {
        let z = biases[c];
        for (let f = 0; f < dim; f += 1) {
          z += weights[c][f] * (sample.features[f] ?? 0);
        }
        logits[c] = z;
      }

      const probs = softmax(logits);
      const predictedIdx = probs.indexOf(Math.max(...probs));
      if (predictedIdx === targetIdx) correct += 1;

      const targetProb = Math.max(1e-7, probs[targetIdx]);
      totalLoss += -Math.log(targetProb);

      // Gradient step
      for (let c = 0; c < numClasses; c += 1) {
        const err = probs[c] - (c === targetIdx ? 1 : 0);
        biases[c] -= lr * err;
        for (let f = 0; f < dim; f += 1) {
          const xVal = sample.features[f] ?? 0;
          weights[c][f] -= lr * (err * xVal + reg * weights[c][f]);
        }
      }
    }

    const n = Math.max(1, validSamples.length);
    epochMetrics.push({
      epoch: ep,
      loss: Number((totalLoss / n).toFixed(3)),
      accuracy: Math.round((correct / n) * 100),
    });
  }

  const lastMetric = epochMetrics[epochMetrics.length - 1] || { loss: 0, accuracy: 0 };

  return {
    missionId,
    mode,
    epochs: safeEpochs,
    classes: [...classes],
    samples: [...samples],
    weights,
    biases,
    centroids,
    epochMetrics,
    trainingAccuracy: lastMetric.accuracy,
    finalLoss: lastMetric.loss,
    trainedAt: Date.now(),
  };
}

/**
 * Predicts the class of a query image feature vector using the trained model.
 */
export function predictWithKidsMlModel(
  model: MlTrainedModel,
  queryFeatures: number[],
  kNeighbors: number = 3
): MlPredictionResult {
  const numClasses = model.classes.length;
  const dim = ML_FEATURE_SIZE;

  // 1) Nearest Neighbors across all training samples (used both for XAI and KNN mode)
  const scoredNeighbors = model.samples
    .map((sample) => ({
      sample,
      sim: cosineSimilarity(queryFeatures, sample.features),
    }))
    .sort((a, b) => b.sim - a.sim);

  const topK = scoredNeighbors.slice(0, Math.min(kNeighbors, scoredNeighbors.length));
  const knnVotes = new Array(numClasses).fill(0);
  const classIndexById = new Map<string, number>();
  model.classes.forEach((c, idx) => classIndexById.set(c.id, idx));

  for (const match of topK) {
    const idx = classIndexById.get(match.sample.classId);
    if (idx !== undefined) {
      // Exponential similarity weighting so very close matches dominate ties
      knnVotes[idx] += Math.exp(Math.max(0, match.sim) * 6);
    }
  }

  // 2) Linear Softmax logits
  const linearLogits = new Array(numClasses).fill(0);
  for (let c = 0; c < numClasses; c += 1) {
    let z = model.biases[c] ?? 0;
    for (let f = 0; f < dim; f += 1) {
      z += (model.weights[c]?.[f] ?? 0) * (queryFeatures[f] ?? 0);
    }
    linearLogits[c] = z;
  }

  const linearProbs = softmax(linearLogits);

  // Compute KNN probability distribution
  const knnSum = knnVotes.reduce((acc, v) => acc + v, 0) || 1;
  const knnProbs = knnVotes.map((v) => v / knnSum);

  // Blend probabilities according to chosen classifier mode
  const combinedRaw = model.classes.map((_, idx) =>
    model.mode === 'knn'
      ? knnProbs[idx] * 0.8 + linearProbs[idx] * 0.2
      : linearProbs[idx] * 0.72 + knnProbs[idx] * 0.28
  );

  const totalCombined = combinedRaw.reduce((acc, v) => acc + v, 0) || 1;
  const probabilities: MlClassProbability[] = model.classes
    .map((cls, idx) => ({
      classId: cls.id,
      className: cls.name,
      accentHex: cls.accentHex,
      probability: Math.round((combinedRaw[idx] / totalCombined) * 100),
    }))
    .sort((a, b) => b.probability - a.probability);

  // Ensure exact 100 sum on primary probabilities if non-empty
  if (probabilities.length > 0) {
    const sum = probabilities.reduce((acc, p) => acc + p.probability, 0);
    if (sum !== 100) {
      probabilities[0].probability = Math.max(0, Math.min(100, probabilities[0].probability + (100 - sum)));
    }
  }

  const top = probabilities[0];
  const nearestMatches: MlNearestMatch[] = topK.map((m) => ({
    sampleId: m.sample.id,
    name: m.sample.name,
    classId: m.sample.classId,
    dataUrl: m.sample.dataUrl,
    similarity: Math.max(0, Math.min(99, Math.round(m.sim * 100))),
  }));

  return {
    predictedClassId: top?.classId || model.classes[0]?.id || '',
    predictedClassName: top?.className || model.classes[0]?.name || '',
    confidence: top?.probability ?? 0,
    probabilities,
    nearestMatches,
    visualCues: describeVisualCues(queryFeatures),
  };
}
