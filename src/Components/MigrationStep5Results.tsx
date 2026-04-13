import React from 'react';

import { MigrationStep } from './MigrationStepProgress';
import { MigrationState } from './MigrationWizard';

interface Props {
  state: MigrationState;
  setCurrentStep: (step: MigrationStep) => void;
}

const MigrationStep5Results: React.FC<Props> = ({ state, setCurrentStep }) => {
  const result = state.result;

  if (!result) {
    return <div>No results yet.</div>;
  }

  if (result.success) {
    return (
      <div className="migration-results" style={{ textAlign: 'center', padding: '40px 0' }}>
        <div style={{ fontSize: '48px', color: '#5cb85c' }}>&#x2714;</div>
        {result.batchId ? (
          <>
            <h3>Migration is being executed. A new batch with ID {result.batchId} has been created.</h3>
            <h3>
              <a
                href={`#/batch?searchQuery=%5B%5D&details=${result.batchId}&type=runtime`}
                onClick={e => {
                  e.preventDefault();
                  window.location.href = `#/batch?searchQuery=%5B%5D&details=${result.batchId}&type=runtime`;
                }}
              >
                Observe Progress
              </a>
            </h3>
          </>
        ) : (
          <h3>Migration was executed successfully.</h3>
        )}
      </div>
    );
  }

  return (
    <div className="migration-results" style={{ textAlign: 'center', padding: '40px 0' }}>
      <div style={{ fontSize: '48px', color: '#d9534f' }}>&#x2716;</div>
      <h3>Migration failed</h3>
      <p className="text-danger">{result.error}</p>
      <button className="btn btn-danger" onClick={() => setCurrentStep('MAPPING')}>
        Back to Define Mapping
      </button>
    </div>
  );
};

export default MigrationStep5Results;
