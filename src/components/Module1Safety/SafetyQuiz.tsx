import React, { useState } from 'react';
import { SAFETY_QUIZ } from '../../data/learningData.ts';
import { CheckCircle2, XCircle, RotateCcw, Award } from 'lucide-react';

interface SafetyQuizProps {
  onComplete: () => void;
  addPoints: (points: number) => void;
}

export const SafetyQuiz: React.FC<SafetyQuizProps> = ({ onComplete, addPoints }) => {
  const [selectedAnswers, setSelectedAnswers] = useState<{ [qId: number]: number }>({});
  const [submitted, setSubmitted] = useState(false);
  const [hasAwardedPoints, setHasAwardedPoints] = useState(false);

  const [complexAns, setComplexAns] = useState<Record<number, boolean>>({});
  const [complexSubmitted, setComplexSubmitted] = useState(false);

  const COMPLEX_STATEMENTS = [
    {
      text: 'การใช้รหัสผ่านเดียวกันทุกเว็บไซต์ช่วยจำง่าย และไม่เพิ่มความเสี่ยงหากเว็บใดเว็บหนึ่งข้อมูลรั่วไหล',
      isTrue: false,
    },
    {
      text: 'ก่อนนำภาพถ่ายหรือคลิปเพื่อนไปโพสต์สาธารณะ ควรขอความยินยอมจากเจ้าตัวก่อนตามหลัก PDPA และมารยาทดิจิทัล',
      isTrue: true,
    },
    {
      text: 'หากพบข่าวที่แชร์ต่อกันแต่ไม่มีแหล่งอ้างอิง ควรตรวจสอบกับเว็บไซต์ทางการหรือหลายแหล่งก่อนเชื่อและแชร์ต่อ',
      isTrue: true,
    },
  ];

  const handleSelect = (qId: number, optIdx: number) => {
    if (submitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [qId]: optIdx,
    }));
  };

  const calculateScore = () => {
    let score = 0;
    SAFETY_QUIZ.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctAnswer) {
        score += 1;
      }
    });
    return score;
  };

  const handleSubmit = () => {
    setSubmitted(true);
    const score = calculateScore();
    if (!hasAwardedPoints) {
      addPoints(score * 10);
      setHasAwardedPoints(true);
    }
    onComplete();
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setSubmitted(false);
    setComplexAns({});
    setComplexSubmitted(false);
  };

  const score = calculateScore();
  const allAnswered = SAFETY_QUIZ.every((q) => selectedAnswers[q.id] !== undefined);
  const allComplexAnswered = COMPLEX_STATEMENTS.every((_, idx) => complexAns[idx] !== undefined);
  const complexAllRight = COMPLEX_STATEMENTS.every((st, idx) => complexAns[idx] === st.isTrue);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
        <div>
          <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">แบบทดสอบท้ายบทเรียน</span>
          <h3 className="text-xl font-bold text-slate-900 mt-0.5">
            แบบประเมินความรู้: ความปลอดภัยดิจิทัล &amp; PDPA (ครบ 2 รูปแบบข้อสอบ O-NET)
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            ทดสอบความรู้ความเข้าใจทั้งแบบปรนัย 5 ข้อ และแบบเลือกตอบเชิงซ้อน (ประเมินข้อความถูก/ผิด)
          </p>
        </div>

        {submitted && (
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-xl text-xs font-semibold text-indigo-700">
              ได้คะแนน: <span className="text-base font-bold tabular-nums">{score}</span> / {SAFETY_QUIZ.length}
            </div>
            <button
              onClick={handleReset}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              title="ทำแบบทดสอบใหม่"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="mt-6 space-y-6">
        {SAFETY_QUIZ.map((q, index) => {
          const userAns = selectedAnswers[q.id];
          const isCorrect = userAns === q.correctAnswer;

          return (
            <div key={q.id} className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="text-sm font-semibold text-slate-900 flex items-start gap-2">
                <span className="text-indigo-600 font-bold tabular-nums">{index + 1}.</span>
                <span>{q.question}</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {q.options.map((opt, optIdx) => {
                  const isOptionSelected = userAns === optIdx;
                  let optStyle = 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/60';

                  if (submitted) {
                    if (optIdx === q.correctAnswer) {
                      optStyle = 'bg-emerald-50 border-emerald-300 text-emerald-900 font-medium';
                    } else if (isOptionSelected && !isCorrect) {
                      optStyle = 'bg-rose-50 border-rose-300 text-rose-900';
                    } else {
                      optStyle = 'bg-white border-slate-200 text-slate-400 opacity-70';
                    }
                  } else if (isOptionSelected) {
                    optStyle = 'bg-indigo-50 border-indigo-400 text-indigo-900 font-medium ring-1 ring-indigo-400';
                  }

                  return (
                    <button
                      key={optIdx}
                      disabled={submitted}
                      onClick={() => handleSelect(q.id, optIdx)}
                      className={`text-left p-3 rounded-lg border text-xs transition-all flex items-start gap-2 ${optStyle}`}
                    >
                      <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center shrink-0 mt-0.5 text-[10px]">
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>

              {submitted && (
                <div
                  className={`p-3 rounded-lg text-xs border ${
                    isCorrect
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {isCorrect ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className="font-semibold">{isCorrect ? 'ตอบถูกต้อง! ' : 'ยังไม่ถูกต้อง '}</span>
                      <span>{q.explanation}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* O-NET Complex Choice Question */}
        <div className="p-5 rounded-xl bg-indigo-50/50 border border-indigo-200 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-bold text-indigo-700">
                ข้อ 6 (รูปแบบ O-NET เลือกตอบเชิงซ้อน)
              </span>
              <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                พิจารณาข้อความเกี่ยวกับความปลอดภัยดิจิทัลและ PDPA ต่อไปนี้ว่า &quot;ถูกต้อง&quot; หรือ &quot;ไม่ถูกต้อง&quot;
              </h4>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 font-bold text-slate-800">
                  <th className="py-2.5 px-3">ข้อความย่อย</th>
                  <th className="py-2.5 px-3 text-center w-24">ถูกต้อง</th>
                  <th className="py-2.5 px-3 text-center w-24">ไม่ถูกต้อง</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {COMPLEX_STATEMENTS.map((st, idx) => {
                  const chosen = complexAns[idx];
                  const ok = complexSubmitted && chosen === st.isTrue;
                  const bad = complexSubmitted && chosen !== st.isTrue;
                  return (
                    <tr key={idx} className={ok ? 'bg-emerald-50/70' : bad ? 'bg-rose-50/70' : ''}>
                      <td className="py-2.5 px-3 text-slate-800">
                        {idx + 1}. {st.text}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          disabled={complexSubmitted}
                          onClick={() => setComplexAns((prev) => ({ ...prev, [idx]: true }))}
                          className={`px-2.5 py-1 rounded border text-[11px] font-bold cursor-pointer ${
                            chosen === true ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-slate-300 text-slate-600'
                          }`}
                        >
                          ถูกต้อง
                        </button>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          disabled={complexSubmitted}
                          onClick={() => setComplexAns((prev) => ({ ...prev, [idx]: false }))}
                          className={`px-2.5 py-1 rounded border text-[11px] font-bold cursor-pointer ${
                            chosen === false ? 'bg-rose-600 text-white border-rose-600' : 'bg-white border-slate-300 text-slate-600'
                          }`}
                        >
                          ไม่ถูกต้อง
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            {complexSubmitted ? (
              <div className="text-xs font-semibold text-indigo-900">
                {complexAllRight
                  ? 'ตอบถูกครบทุกข้อย่อย! (+15 XP)'
                  : 'มีบางข้อย่อยที่คลาดเคลื่อน: ห้ามใช้รหัสผ่านเดียวกันทุกเว็บ (ข้อ 1 ผิด) และต้องขอความยินยอม + ตรวจหลายแหล่ง (ข้อ 2-3 ถูก)'}
              </div>
            ) : (
              <span className="text-[11px] text-slate-500">เลือกคำตอบครบ 3 ข้อย่อยแล้วกดตรวจ</span>
            )}
            {!complexSubmitted && (
              <button
                type="button"
                disabled={!allComplexAnswered}
                onClick={() => {
                  setComplexSubmitted(true);
                  if (complexAllRight) addPoints(15);
                }}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-xs font-bold cursor-pointer"
              >
                ตรวจข้อเลือกตอบเชิงซ้อน
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={!allAnswered}
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all shadow-sm ${
              allAnswered
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>ส่งคำตอบและตรวจคะแนน</span>
          </button>
        ) : (
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span>ตรวจคำตอบเรียบร้อยแล้ว ได้รับคะแนนสะสมแล้ว</span>
          </div>
        )}
      </div>
    </div>
  );
};
