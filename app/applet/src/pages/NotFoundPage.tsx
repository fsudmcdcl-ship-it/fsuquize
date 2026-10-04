import React from 'react';

interface NotFoundPageProps {
  navigate?: (path: string) => void;
  requestedPath?: string;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ navigate }) => {
  return (
    <div className="fixed inset-0 z-[99999] min-h-screen w-full bg-white flex flex-col items-center justify-center p-6 text-center select-none font-sans">
      <div className="space-y-4 max-w-md w-full">
        <h1 className="text-7xl sm:text-9xl font-black text-slate-900 tracking-tight">
          404
        </h1>
        <p className="text-base sm:text-lg font-medium text-slate-700">
          404 error no pages found
        </p>
        {navigate && (
          <div className="pt-6">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs sm:text-sm rounded-xl border border-slate-300 transition-colors shadow-2xs cursor-pointer"
            >
              ← मुख्य पृष्ठमा फर्कनुहोस् (Home)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
