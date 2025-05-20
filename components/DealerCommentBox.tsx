import React from 'react';

interface DealerCommentBoxProps {
  comment: string;
  isLoading: boolean;
}

const DealerCommentBox: React.FC<DealerCommentBoxProps> = ({ comment, isLoading }) => {
  if (!comment && !isLoading) return null;

  return (
    <div className="my-3 p-3 bg-slate-700 border border-slate-600/50 rounded-md shadow-sm w-full max-w-md mx-auto min-h-[3rem] flex items-center justify-center animate-fade-in-up"
      role="log"
      aria-live="polite"
      style={{animationDelay: '0.15s'}} // Slightly delay after status message
    >
      {isLoading ? (
        <p className="text-sm italic text-indigo-400 animate-pulse">Dealer is thinking...</p>
      ) : (
        <p className="text-sm italic text-indigo-300 text-center">
          <span className="font-semibold text-indigo-400">Dealer:</span> "{comment}"
        </p>
      )}
    </div>
  );
};

export default DealerCommentBox;