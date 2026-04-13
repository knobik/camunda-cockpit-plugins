import React from 'react';

export type MigrationStep = 'MAPPING' | 'VARIABLES' | 'INSTANCES' | 'CONFIRM' | 'RESULTS';

const STEPS: { key: MigrationStep; label: string }[] = [
  { key: 'MAPPING', label: '1. Define Mapping' },
  { key: 'VARIABLES', label: '2. Set Variables' },
  { key: 'INSTANCES', label: '3. Select Instances' },
  { key: 'CONFIRM', label: '4. Confirm' },
  { key: 'RESULTS', label: '5. Results' },
];

interface Props {
  currentStep: MigrationStep;
  onStepClick: (step: MigrationStep) => void;
}

const MigrationStepProgress: React.FC<Props> = ({ currentStep, onStepClick }) => {
  const currentIndex = STEPS.findIndex(s => s.key === currentStep);

  return (
    <div className="migration-step-progress">
      {STEPS.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isClickable = index < currentIndex;

        return (
          <React.Fragment key={step.key}>
            {index > 0 && <span className={`migration-step-line ${isCompleted || isCurrent ? 'active' : ''}`} />}
            <span
              className={`migration-step-label ${isCurrent ? 'current' : ''} ${isCompleted ? 'completed' : ''} ${
                isClickable ? 'clickable' : ''
              }`}
              onClick={() => isClickable && onStepClick(step.key)}
            >
              {step.label}
            </span>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default MigrationStepProgress;
