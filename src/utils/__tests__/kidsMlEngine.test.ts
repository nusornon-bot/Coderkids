import { describe, expect, it } from 'vitest';
import {
  describeVisualCues,
  evaluateDatasetHealth,
  extractFeaturesFromRgba,
  ML_FEATURE_SIZE,
  predictWithKidsMlModel,
  trainKidsMlModel,
  type MlClassDef,
  type MlSampleItem,
} from '../kidsMlEngine';
import { buildMissionAssets, ML_MISSIONS } from '../../data/kidsMlDatasets';

function makeSolidPatchRgba(
  r: number,
  g: number,
  b: number,
  width = 24,
  height = 24
): Uint8ClampedArray {
  const buf = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = (y * width + x) * 4;
      const inCenter = x >= 4 && x < width - 4 && y >= 4 && y < height - 4;
      buf[idx] = inCenter ? r : 248;
      buf[idx + 1] = inCenter ? g : 250;
      buf[idx + 2] = inCenter ? b : 252;
      buf[idx + 3] = 255;
    }
  }
  return buf;
}

describe('kidsMlEngine', () => {
  it('extracts a normalized 72-dimensional feature vector from RGBA buffers', () => {
    const redVec = extractFeaturesFromRgba(makeSolidPatchRgba(225, 35, 35), 24, 24);
    const greenVec = extractFeaturesFromRgba(makeSolidPatchRgba(35, 195, 55), 24, 24);

    expect(redVec).toHaveLength(ML_FEATURE_SIZE);
    expect(greenVec).toHaveLength(ML_FEATURE_SIZE);

    const redNorm = Math.sqrt(redVec.reduce((acc, v) => acc + v * v, 0));
    expect(redNorm).toBeCloseTo(1, 2);

    const greenCues = describeVisualCues(greenVec);
    expect(greenCues.some((c) => c.includes('เขียว'))).toBe(true);
  });

  it('trains linear and knn classifiers that accurately distinguish colored object classes', () => {
    const classes: MlClassDef[] = [
      {
        id: 'fruit_red',
        name: 'ผลไม้สีแดง',
        shortName: 'แดง',
        accentHex: '#e11d48',
        badgeText: 'แดง',
        description: 'แอปเปิ้ล สตรอว์เบอร์รี',
      },
      {
        id: 'leafy_green',
        name: 'ผักใบเขียว',
        shortName: 'เขียว',
        accentHex: '#059669',
        badgeText: 'เขียว',
        description: 'กะหล่ำปลี บรอกโคลี',
      },
      {
        id: 'citrus_yellow',
        name: 'ผลไม้สีเหลืองส้ม',
        shortName: 'ส้ม',
        accentHex: '#d97706',
        badgeText: 'ส้ม',
        description: 'กล้วย ส้ม',
      },
    ];

    const samples: MlSampleItem[] = [
      {
        id: 's1',
        classId: 'fruit_red',
        name: 'แอปเปิ้ล',
        dataUrl: '',
        features: extractFeaturesFromRgba(makeSolidPatchRgba(220, 30, 35), 24, 24),
        source: 'preset',
      },
      {
        id: 's2',
        classId: 'fruit_red',
        name: 'สตรอว์เบอร์รี',
        dataUrl: '',
        features: extractFeaturesFromRgba(makeSolidPatchRgba(235, 45, 55), 24, 24),
        source: 'preset',
      },
      {
        id: 's3',
        classId: 'leafy_green',
        name: 'ผักคะน้า',
        dataUrl: '',
        features: extractFeaturesFromRgba(makeSolidPatchRgba(30, 175, 50), 24, 24),
        source: 'preset',
      },
      {
        id: 's4',
        classId: 'leafy_green',
        name: 'บรอกโคลี',
        dataUrl: '',
        features: extractFeaturesFromRgba(makeSolidPatchRgba(45, 190, 65), 24, 24),
        source: 'preset',
      },
      {
        id: 's5',
        classId: 'citrus_yellow',
        name: 'กล้วยหอม',
        dataUrl: '',
        features: extractFeaturesFromRgba(makeSolidPatchRgba(245, 200, 25), 24, 24),
        source: 'preset',
      },
      {
        id: 's6',
        classId: 'citrus_yellow',
        name: 'ส้ม',
        dataUrl: '',
        features: extractFeaturesFromRgba(makeSolidPatchRgba(240, 150, 20), 24, 24),
        source: 'preset',
      },
    ];

    const health = evaluateDatasetHealth(samples, classes);
    expect(health.isReady).toBe(true);
    expect(health.isBalanced).toBe(true);
    expect(health.warnings).toHaveLength(0);

    const linearModel = trainKidsMlModel({
      missionId: 'fruits_veggies',
      classes,
      samples,
      epochs: 25,
      mode: 'linear',
    });

    expect(linearModel.epochMetrics).toHaveLength(25);
    expect(linearModel.trainingAccuracy).toBeGreaterThanOrEqual(90);

    const queryGreen = extractFeaturesFromRgba(makeSolidPatchRgba(38, 185, 58), 24, 24);
    const predLinear = predictWithKidsMlModel(linearModel, queryGreen);
    expect(predLinear.predictedClassId).toBe('leafy_green');
    expect(predLinear.confidence).toBeGreaterThan(50);

    const probSum = predLinear.probabilities.reduce((acc, p) => acc + p.probability, 0);
    expect(probSum).toBe(100);

    const knnModel = trainKidsMlModel({
      missionId: 'fruits_veggies',
      classes,
      samples,
      epochs: 20,
      mode: 'knn',
    });
    const queryRed = extractFeaturesFromRgba(makeSolidPatchRgba(228, 40, 42), 24, 24);
    const predKnn = predictWithKidsMlModel(knnModel, queryRed);
    expect(predKnn.predictedClassId).toBe('fruit_red');
  });

  it('flags empty or severely imbalanced datasets in health diagnostics', () => {
    const classes = ML_MISSIONS.waste_sorting.classes;
    const skewedSamples: MlSampleItem[] = [
      { id: '1', classId: 'recycle', name: 'A', dataUrl: '', features: new Array(72).fill(0.1), source: 'preset' },
      { id: '2', classId: 'recycle', name: 'B', dataUrl: '', features: new Array(72).fill(0.1), source: 'preset' },
      { id: '3', classId: 'recycle', name: 'C', dataUrl: '', features: new Array(72).fill(0.1), source: 'preset' },
      { id: '4', classId: 'recycle', name: 'D', dataUrl: '', features: new Array(72).fill(0.1), source: 'preset' },
      { id: '5', classId: 'organic', name: 'E', dataUrl: '', features: new Array(72).fill(0.1), source: 'preset' },
    ];

    const health = evaluateDatasetHealth(skewedSamples, classes);
    expect(health.isReady).toBe(false);
    expect(health.isBalanced).toBe(false);
    expect(health.warnings.length).toBeGreaterThan(0);
  });

  it('builds complete presets for waste_sorting, fruits_veggies, and custom_lab', () => {
    const waste = buildMissionAssets('waste_sorting');
    const produce = buildMissionAssets('fruits_veggies');
    const custom = buildMissionAssets('custom_lab');

    expect(waste.classes).toHaveLength(3);
    expect(waste.trainingSamples).toHaveLength(12);
    expect(waste.testGallery).toHaveLength(6);

    expect(produce.classes).toHaveLength(3);
    expect(produce.trainingSamples).toHaveLength(12);
    expect(produce.testGallery).toHaveLength(6);

    expect(custom.classes).toHaveLength(3);
    expect(custom.trainingSamples).toHaveLength(6);
    expect(custom.testGallery).toHaveLength(3);
  });
});
