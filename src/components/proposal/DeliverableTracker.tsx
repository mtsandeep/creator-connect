// ============================================
// DELIVERABLE TRACKER COMPONENT
// ============================================

interface DeliverableTrackerProps {
  deliverables: string[];
  completedDeliverables?: string[];
  onToggle?: (deliverable: string) => void;
  editable?: boolean;
}

export default function DeliverableTracker({
  deliverables,
  completedDeliverables = [],
  onToggle,
  editable = false,
}: DeliverableTrackerProps) {
  const completedCount = deliverables.filter(d => completedDeliverables.includes(d)).length;
  const progress = deliverables.length > 0 ? Math.round((completedCount / deliverables.length) * 100 * 100) / 100 : 0;

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
      {/* Progress Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
        <div className="flex items-center gap-3 flex-1">
          <h3 className="text-[11px] font-semibold text-gray-200 uppercase tracking-wider">Deliverables</h3>
          <div className="h-px flex-1 bg-white/10" />
        </div>
        <span className="text-sm text-gray-400 ml-3">
          {completedCount}/{deliverables.length} completed
        </span>
      </div>

      <div className="p-4">

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-400">Work Progress</p>
            <p className="text-sm font-semibold text-white">{progress}%</p>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Deliverables List */}
        <div className="space-y-2">
          {deliverables.map((deliverable, index) => {
            const isCompleted = completedDeliverables.includes(deliverable);

            return (
              <div
                key={index}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${isCompleted ? 'bg-[#B8FF00]/10' : 'bg-white/5'} ${editable ? 'cursor-pointer hover:bg-white/10' : ''}`}
                onClick={() => editable && onToggle?.(deliverable)}
              >
                {/* Checkbox */}
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${isCompleted
                    ? 'bg-[#B8FF00] border-[#B8FF00]'
                    : 'border-gray-500'
                  }`}>
                  {isCompleted && (
                    <svg className="w-3 h-3 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>

                {/* Text */}
                <span className={`flex-1 text-sm ${isCompleted ? 'text-gray-400 line-through' : 'text-white'}`}>
                  {deliverable}
                </span>

                {/* Status indicator */}
                {isCompleted && (
                  <svg className="w-5 h-5 text-[#B8FF00] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            );
          })}
        </div>

        {deliverables.length === 0 && (
          <div className="text-center py-4">
            <p className="text-gray-500 text-sm">No deliverables defined yet</p>
          </div>
        )}

      </div>
    </div>
  );
}
