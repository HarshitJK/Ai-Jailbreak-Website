interface StageProgressProps {
  currentStage: number;
  totalStages: number;
  round: number;
  onNext: () => void;
}

export function StageProgress({ currentStage, totalStages, round, onNext }: StageProgressProps) {
  return (
    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-md mb-4">
      <h3 className="font-medium text-blue-800">Round {round} - Stage {currentStage} of {totalStages}</h3>
      <button onClick={onNext} className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
        Next Stage
      </button>
    </div>
  );
}