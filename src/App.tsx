/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Phone, Mail, Globe } from 'lucide-react';

export default function App() {
  const [cardData, setCardData] = useState({
    name: '박태환',
    title: 'CTO / Chief Technology Officer',
    phone: '010-9945-8395',
    email: 'phil@keiailab.com',
    website: 'www.keiailab.com',
  });

  function updateField(key: keyof typeof cardData, value: string) {
    setCardData((prev) => ({ ...prev, [key]: value }));
  }

  function handleSavePdf() {
    window.print();
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

          .print-grid {
            display: block !important;
            gap: 0 !important;
            width: 86mm !important;
            height: auto !important;
            margin: 0 auto !important;
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
          </div>
        </section>

        {/* Right: Business card */}
        <section className="w-full relative print-card-shell">
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
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://${cardData.website.replace(/^https?:\/\//, '')}`} 
                alt="QR Code"
                className="w-24 h-24"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Bottom Line */}
            <div className="absolute bottom-12 left-12 right-[168px] flex items-center">
              <div className="w-24 h-px border-t-[2px] border-[#0f172a]"></div>
              <div className="flex-1 h-px border-t border-gray-300"></div>
            </div>
          </div>
        </section>
      </div>
    </div>
    </>
  );
}
