import React, { useState } from 'react';
import { X, SplitSquareVertical, Columns } from 'lucide-react';

const ImageCompareModal = ({ beforeImage, afterImage, title, onClose }) => {
  const [mode, setMode] = useState('sideBySide'); // 'sideBySide' | 'slider'
  const [sliderPosition, setSliderPosition] = useState(50);

  if (!beforeImage && !afterImage) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-900 text-sm md:text-base">
              Resolution Verification: Before vs After
            </h3>
            <p className="text-xs text-slate-500 truncate max-w-md">{title}</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-200/80 rounded-lg p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setMode('sideBySide')}
                className={`px-2.5 py-1 rounded-md font-medium flex items-center gap-1 transition-all ${
                  mode === 'sideBySide' ? 'bg-white shadow text-blue-600' : 'text-slate-600'
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                Side by Side
              </button>
              <button
                type="button"
                onClick={() => setMode('slider')}
                className={`px-2.5 py-1 rounded-md font-medium flex items-center gap-1 transition-all ${
                  mode === 'slider' ? 'bg-white shadow text-blue-600' : 'text-slate-600'
                }`}
              >
                <SplitSquareVertical className="w-3.5 h-3.5" />
                Interactive Slider
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 flex-1 overflow-y-auto flex flex-col items-center justify-center">
          {mode === 'sideBySide' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              {/* Before Image */}
              <div className="flex flex-col items-center">
                <div className="mb-2 px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                  BEFORE (Reported Issue)
                </div>
                <div className="w-full h-72 md:h-96 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-inner flex items-center justify-center">
                  {beforeImage ? (
                    <img
                      src={beforeImage}
                      alt="Before Resolution"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-slate-400">No before image recorded</span>
                  )}
                </div>
              </div>

              {/* After Image */}
              <div className="flex flex-col items-center">
                <div className="mb-2 px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                  AFTER (Resolved Proof)
                </div>
                <div className="w-full h-72 md:h-96 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-inner flex items-center justify-center">
                  {afterImage ? (
                    <img
                      src={afterImage}
                      alt="After Resolution"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-slate-400">Resolution in progress</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Interactive Comparison Slider */
            <div className="w-full max-w-2xl flex flex-col items-center">
              <div className="relative w-full h-80 md:h-[420px] rounded-xl overflow-hidden select-none border border-slate-200 shadow-md">
                {/* After Image (Background) */}
                <img
                  src={afterImage || beforeImage}
                  alt="After"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <span className="absolute bottom-3 right-3 px-2.5 py-1 bg-emerald-600/90 text-white font-bold text-xs rounded-md shadow">
                  AFTER
                </span>

                {/* Before Image (Clipped Foreground) */}
                <div
                  className="absolute inset-y-0 left-0 overflow-hidden"
                  style={{ width: `${sliderPosition}%` }}
                >
                  <img
                    src={beforeImage || afterImage}
                    alt="Before"
                    className="absolute inset-0 w-full h-full object-cover max-w-none"
                    style={{ width: '100%' }}
                  />
                  <span className="absolute bottom-3 left-3 px-2.5 py-1 bg-red-600/90 text-white font-bold text-xs rounded-md shadow">
                    BEFORE
                  </span>
                </div>

                {/* Slider Divider Line */}
                <div
                  className="absolute inset-y-0 w-1 bg-white cursor-ew-resize shadow-[0_0_10px_rgba(0,0,0,0.5)] flex items-center justify-center"
                  style={{ left: `${sliderPosition}%` }}
                >
                  <div className="w-7 h-7 rounded-full bg-white text-slate-800 flex items-center justify-center shadow-lg border border-slate-300 text-xs font-bold">
                    ↔
                  </div>
                </div>
              </div>

              {/* Range input controller */}
              <div className="w-full mt-4 flex items-center gap-3">
                <span className="text-xs font-semibold text-red-600">Before</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sliderPosition}
                  onChange={(e) => setSliderPosition(e.target.value)}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <span className="text-xs font-semibold text-emerald-600">After</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageCompareModal;
