/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { Globe } from 'lucide-react';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import * as QRCode from 'qrcode';

async function captureElementAsCanvas(target: HTMLElement, foreignObjectRendering: boolean): Promise<HTMLCanvasElement> {
  return html2canvas(target, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    foreignObjectRendering,
  });
}

export default function App() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardData, setCardData] = useState({
    name: '박태환',
    title: 'CTO / Chief Technology Officer',
    phone: '010-9945-8395',
    email: 'phil@keiailab.com',
    website: 'www.keiailab.com',
  });
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    let isActive = true;
    // Once a share link exists, the QR encodes it; otherwise fall back to the website.
    const target = cardData.website.replace(/^https?:\/\//, '').trim() || 'keiailab.com';
    const qrValue = shareUrl || `https://${target}`;

    QRCode.toDataURL(qrValue, {
      width: 300,
      margin: 1,
      errorCorrectionLevel: 'M',
      type: 'image/png',
    })
      .then((dataUrl) => {
        if (isActive) {
          setQrDataUrl(dataUrl);
        }
      })
      .catch((error) => {
        if (isActive) {
          console.error('QR 생성 실패', error);
          setQrDataUrl('');
        }
      });

    return () => {
      isActive = false;
    };
  }, [cardData.website, shareUrl]);

  function updateField(key: keyof typeof cardData, value: string) {
    setCardData((prev) => ({ ...prev, [key]: value }));
  }

  // foreignObjectRendering:true silently returns a blank canvas in modern
  // Chrome, so capture with the reliable rasterizer (false) first.
  async function captureCard(el: HTMLElement): Promise<HTMLCanvasElement> {
    try {
      return await captureElementAsCanvas(el, false);
    } catch {
      return await captureElementAsCanvas(el, true);
    }
  }

  async function handleSavePdf() {
    const root = cardRef.current;
    if (!root) {
      alert('명함 캡처 대상이 없습니다.');
      return;
    }

    try {
      if ('fonts' in document) {
        await document.fonts.ready;
      }

      const frontEl = root.querySelector('.print-card-wrap') as HTMLElement | null;
      const backEl = root.querySelector('.print-card-back') as HTMLElement | null;
      if (!frontEl) {
        alert('명함 캡처 대상이 없습니다.');
        return;
      }

      const frontCanvas = await captureCard(frontEl);
      const backCanvas = backEl ? await captureCard(backEl) : null;

      // Layout (mm): each card spans the full card width, sized to its own
      // aspect ratio (no letterbox), front and back stacked with a gap and
      // centered on the page via symmetric margins.
      const cardW = 86;
      const cardH = cardW * (frontCanvas.height / frontCanvas.width);
      const gap = 10;
      const margin = 8;
      const pageW = cardW + margin * 2;
      const pageH = margin * 2 + cardH + (backCanvas ? gap + cardH : 0);

      const pdf = new jsPDF({
        orientation: pageW >= pageH ? 'landscape' : 'portrait',
        unit: 'mm',
        format: [pageW, pageH],
      });

      pdf.addImage(frontCanvas.toDataURL('image/png', 1.0), 'PNG', margin, margin, cardW, cardH);
      if (backCanvas) {
        pdf.addImage(
          backCanvas.toDataURL('image/png', 1.0),
          'PNG',
          margin,
          margin + cardH + gap,
          cardW,
          cardH,
        );
      }

      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = '명함.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF 저장 실패:', error);
      alert('PDF 저장 실패: 브라우저 콘솔 로그를 확인해 주세요.');
    }
  }

  async function handleCreateShareLink() {
    setIsSharing(true);
    try {
      const res = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cardData),
      });

      if (!res.ok) {
        throw new Error(`서버 응답 ${res.status}`);
      }

      const data = (await res.json()) as { url?: string };
      if (!data.url) {
        throw new Error('공유 URL이 응답에 없습니다.');
      }

      setShareUrl(data.url);
    } catch (error) {
      console.error('공유 링크 생성 실패:', error);
      alert('공유 링크 생성 실패: 서버가 실행 중인지 확인해 주세요.');
    } finally {
      setIsSharing(false);
    }
  }

  return (
    <>
      <style>{`
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .print-hide {
            display: none !important;
          }

          .print-root {
            min-height: auto !important;
            padding: 0 !important;
            background: #fff !important;
            align-items: flex-start !important;
          }

          .print-card-shell {
            width: 86mm !important;
            height: auto !important;
            overflow: visible !important;
            padding: 0 !important;
          }

          .print-card-wrap {
            width: 640px !important;
            height: 360px !important;
            max-width: none !important;
            margin: 0 auto !important;
            box-shadow: none !important;
            border: 1px solid rgba(15, 23, 42, 0.25) !important;
            background-clip: padding-box !important;
            transform-origin: top left !important;
            transform: scale(0.507) !important;
          }

          .print-card-wrap + .print-card-wrap {
            margin-top: 0 !important;
          }

          .print-grid {
            display: block !important;
            gap: 0 !important;
            width: 86mm !important;
            height: auto !important;
            margin: 0 auto !important;
          }

          @page {
            size: 86mm 114mm;
            margin: 0;
          }

          html,
          body {
            width: 86mm !important;
            height: 54mm !important;
            margin: 0 !important;
          }

          body {
            background: #fff !important;
          }
        }
      `}</style>
      <div className="min-h-screen bg-[#e2e8f0] flex items-center justify-center p-4 font-sans print-root">
      <div className="grid gap-6 lg:grid-cols-[360px_1fr] w-full max-w-[1200px] print-grid">
        {/* Left: Editable template form */}
        <section className="bg-white rounded-xl shadow-[0_12px_34px_-18px_rgba(15,23,42,0.35)] p-5 print-hide">
          <h2 className="text-[18px] font-bold text-[#0f172a] mb-4">명함 템플릿 01</h2>
          <p className="text-[12px] text-gray-500 mb-4">왼쪽 값을 바꾸면 미리보기에 즉시 반영됩니다.</p>
          <div className="space-y-4">
              <label className="block">
              <span className="text-[12px] font-semibold text-gray-600">이름</span>
              <input
                value={cardData.name}
                onChange={(e) => updateField('name', e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0f172a]/30"
                placeholder="이름"
              />
            </label>
            <label className="block">
              <span className="text-[12px] font-semibold text-gray-600">직무</span>
              <input
                value={cardData.title}
                onChange={(e) => updateField('title', e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0f172a]/30"
                placeholder="직무"
              />
            </label>
            <label className="block">
              <span className="text-[12px] font-semibold text-gray-600">전화번호</span>
              <input
                value={cardData.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0f172a]/30"
                placeholder="전화번호"
              />
            </label>
            <label className="block">
              <span className="text-[12px] font-semibold text-gray-600">이메일</span>
              <input
                value={cardData.email}
                onChange={(e) => updateField('email', e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0f172a]/30"
                placeholder="이메일"
              />
            </label>
            <label className="block">
              <span className="text-[12px] font-semibold text-gray-600">홈페이지</span>
              <input
                value={cardData.website}
                onChange={(e) => updateField('website', e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0f172a]/30"
                placeholder="홈페이지"
              />
            </label>
            <button
              onClick={handleSavePdf}
              className="w-full rounded-lg bg-[#111827] py-2 text-sm font-semibold text-white hover:bg-black"
            >
              명함 PDF 저장
            </button>
            <button
              onClick={handleCreateShareLink}
              disabled={isSharing}
              className="w-full rounded-lg border border-[#111827] py-2 text-sm font-semibold text-[#111827] hover:bg-[#111827] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSharing ? '생성 중…' : '공유 링크 생성'}
            </button>
            {shareUrl && (
              <div className="rounded-lg bg-[#f1f5f9] p-3">
                <span className="block text-[11px] font-semibold text-gray-500 mb-1">공유 링크 (QR에 반영됨)</span>
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block break-all text-[13px] font-medium text-[#0f172a] underline select-all"
                >
                  {shareUrl}
                </a>
              </div>
            )}
          </div>
        </section>

        {/* Right: Business card (front + back stacked) */}
        <section className="w-full relative print-card-shell flex flex-col items-center gap-6" ref={cardRef}>
          <div className="w-full max-w-[640px] h-[360px] bg-white rounded-xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] p-12 relative overflow-hidden print-card-wrap" style={{ backgroundImage: 'linear-gradient(140deg, #ffffff 0%, #f9fbfd 45%, #f7f9fb 100%)' }}>
            {/* Logo */}
            <div className="absolute top-12 right-12 flex items-center gap-2.5">
              <div className="relative w-15 h-15 flex items-center justify-center">
                <img
                  src="/keiailab-symbol.png"
                  alt="KEIAILAB logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-[22px] font-black text-[#0f172a] tracking-wide">KEIAILAB</span>
            </div>

            {/* Name & Title */}
            <div className="mb-12 mt-2">
              <h1 className="text-[32px] font-bold text-gray-900 mb-3 tracking-tight">{cardData.name}</h1>
              <p className="text-[15px] font-semibold text-gray-600 tracking-[0.08em] uppercase">{cardData.title}</p>
            </div>

            {/* Contact Info */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <span className="inline-block h-5 w-[1px] border-l border-[#94a3b8] border-l-[1px]" />
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#1e293b" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6.62 10.79C8.06 13.62 10.38 15.93 13.21 17.38L15.41 15.18C15.68 14.91 16.08 14.82 16.43 14.94C17.55 15.31 18.76 15.51 20 15.51C20.55 15.51 21 15.96 21 16.51V20C21 20.55 20.55 21 20 21C10.61 21 3 13.39 3 4C3 3.45 3.45 3 4 3H7.5C8.05 3 8.5 3.45 8.5 4C8.5 5.25 8.7 6.45 9.07 7.57C9.18 7.92 9.1 8.31 8.82 8.59L6.62 10.79Z" />
                </svg>
                <span className="text-[15px] text-gray-800 font-medium tracking-wide">{cardData.phone}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="inline-block h-5 w-[1px] border-l border-[#94a3b8] border-l-[1px]" />
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#1e293b" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z" />
                </svg>
                <span className="text-[15px] text-gray-800 font-medium tracking-wide">{cardData.email}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="inline-block h-5 w-[1px] border-l border-[#94a3b8] border-l-[1px]" />
                <Globe className="w-[18px] h-[18px] text-[#1e293b]" />
                <span className="text-[15px] text-gray-800 font-medium tracking-wide">{cardData.website}</span>
              </div>
            </div>

            {/* QR Code */}
            <div className="absolute bottom-12 right-12">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="QR Code"
                  className="w-24 h-24"
                />
              ) : (
                <div className="w-24 h-24 bg-[#e2e8f0] text-[10px] text-[#334155] flex items-center justify-center text-center">
                  QR 생성 실패
                </div>
              )}
            </div>

            {/* Bottom Line */}
            <div className="absolute bottom-12 left-12 right-[168px] flex items-center">
              <div className="w-24 h-px border-t-[2px] border-[#0f172a]"></div>
              <div className="flex-1 h-px border-t border-gray-300"></div>
            </div>
          </div>

          {/* Back side: centered logo + wordmark */}
          <div className="w-full max-w-[640px] h-[360px] bg-white rounded-xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] relative overflow-hidden print-card-back" style={{ backgroundImage: 'linear-gradient(140deg, #ffffff 0%, #f9fbfd 45%, #f7f9fb 100%)' }}>
            {/* Diagonal corner accents */}
            <span className="absolute top-[70px] right-[-30px] w-[200px] h-[2px] bg-[#bfdbfe] rotate-45" />
            <span className="absolute bottom-[70px] left-[-30px] w-[200px] h-[2px] bg-[#bfdbfe] rotate-45" />

            {/* Centered brand block */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-5">
              <div className="flex items-center gap-4">
                <img
                  src="/keiailab-symbol.png"
                  alt="KEIAILAB logo"
                  className="w-16 h-16 object-contain"
                />
                <span className="text-[44px] font-black text-[#0f172a] tracking-wide leading-none">KEIAILAB</span>
              </div>
              <div className="w-20 h-[3px] rounded-full bg-[#2563eb]" />
            </div>
          </div>
        </section>
      </div>
    </div>
    </>
  );
}
