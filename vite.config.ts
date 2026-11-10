import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      cors: true,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // In Cloud Run / reverse proxy environments, explicitly configure client settings for WSS over port 443
      hmr: process.env.DISABLE_HMR === 'true'
        ? false
        : {
            protocol: 'wss',
            clientPort: 443,
          },
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      target: 'es2022',
      minify: 'esbuild',
      cssMinify: true,
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('three')) {
                return 'vendor-three';
              }
              if (id.includes('jspdf') || id.includes('html2canvas') || id.includes('canvg')) {
                return 'vendor-pdf';
              }
              if (id.includes('firebase')) {
                return 'vendor-firebase';
              }
              if (id.includes('recharts') || id.includes('d3')) {
                return 'vendor-charts';
              }
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              return 'vendor-framework';
            }

            // Split large domain modules into independent lazy chunks
            if (id.includes('/src/components/DigitalLibrary3DView')) {
              return 'feature-3d-labs';
            }
            if (id.includes('/src/components/BlockMazeRunner') || id.includes('/src/components/ClassroomLuckyWheel') || id.includes('/src/components/BinaryPixelArtLab') || id.includes('/src/components/ClassroomBattleModal') || id.includes('/src/components/PairProgrammingArena')) {
              return 'feature-gamified-labs';
            }
            if (id.includes('/src/components/HomeworkDropzone') || id.includes('/src/components/Module4Showcase/') || id.includes('/src/components/CoderHeroCardsModal')) {
              return 'feature-showcase-homework';
            }
            if (id.includes('/src/components/VirtualClassroom') || id.includes('/src/components/TeacherMasteryPortal') || id.includes('/src/components/TeacherAssessmentReportModal') || id.includes('/src/components/TeacherLessonPlansModal') || id.includes('/src/components/RubricAssessmentModal')) {
              return 'feature-teacher-portal';
            }
            if (id.includes('/src/components/JuniorCodePlayground') || id.includes('/src/components/Module3CodingLab/') || id.includes('/src/components/MicrobitMusicLab') || id.includes('/src/components/VisualCodeTracerModal')) {
              return 'feature-coding-studios';
            }
            if (id.includes('/src/components/ExamArenaModal') || id.includes('/src/components/SmartExamGeneratorModal') || id.includes('/src/components/BebrasArena') || id.includes('/src/components/UnpluggedWorksheetsModal')) {
              return 'feature-exams-assessments';
            }
            if (id.includes('/src/components/ProfileManagementView') || id.includes('/src/components/AvatarShopModal') || id.includes('/src/components/PointsRewardCenter') || id.includes('/src/components/BuddySystem')) {
              return 'feature-profiles-shop';
            }
            if (id.includes('/src/components/KidsAILab') || id.includes('/src/components/AiPromptLab') || id.includes('/src/components/AITutorChatbot')) {
              return 'feature-ai-labs';
            }
            if (id.includes('/src/components/StemProjectHub') || id.includes('/src/components/StemPacksModal')) {
              return 'feature-stem-projects';
            }
          },
        },
      },
    },
  };
});
