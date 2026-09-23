import React from 'react';

interface NotFoundPageProps {
  navigate: (path: string) => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ navigate }) => {
  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center space-y-6">
      <div className="text-6xl font-black text-slate-300 font-mono">४०४</div>
      <h1 className="text-3xl font-black text-slate-900">पृष्ठ भेटिएन</h1>
      <p className="text-sm text-slate-600 leading-relaxed">
        तपाईंले खोज्नुभएको पृष्ठ उपलब्ध छैन वा सारिएको हुन सक्छ।
      </p>
      <div>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl shadow transition cursor-pointer"
        >
          गृहपृष्ठमा फर्कनुहोस्
        </button>
      </div>
    </div>
  );
};
