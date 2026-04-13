import React, { useEffect, useState } from 'react';

import { API, MigrationExecutionDto } from '../types';
import { headers } from '../utils/api';
import { post } from '../utils/api';
import { MigrationStep } from './MigrationStepProgress';
import { MigrationState } from './MigrationWizard';

interface Props {
  api: API;
  state: MigrationState;
  updateState: (partial: Partial<MigrationState>) => void;
  setCurrentStep: (step: MigrationStep) => void;
}

const MigrationStep4Confirm: React.FC<Props> = ({ api, state, updateState, setCurrentStep }) => {
  const [instanceCount, setInstanceCount] = useState<number | null>(null);
  const [executing, setExecuting] = useState(false);

  useEffect(() => {
    (async () => {
      if (state.selectionType === 'instances') {
        setInstanceCount(state.selectedInstanceIds.length);
      } else {
        const result = await post(
          api,
          '/process-instance/count',
          {},
          JSON.stringify({
            processDefinitionId: state.sourceProcessDefinitionId,
            ...(state.instanceQuery || {}),
          })
        );
        setInstanceCount(result?.count ?? 0);
      }
    })();
  }, []);

  const handleExecute = async () => {
    setExecuting(true);
    try {
      const payload: MigrationExecutionDto = {
        migrationPlan: {
          sourceProcessDefinitionId: state.sourceProcessDefinitionId,
          targetProcessDefinitionId: state.targetProcessDefinitionId,
          instructions: state.instructions,
          variables: Object.keys(state.variables).length > 0 ? state.variables : undefined,
        },
        processInstanceIds: state.selectionType === 'instances' ? state.selectedInstanceIds : undefined,
        processInstanceQuery:
          state.selectionType === 'query'
            ? { processDefinitionId: state.sourceProcessDefinitionId, ...(state.instanceQuery || {}) }
            : undefined,
        skipCustomListeners: state.skipCustomListeners,
        skipIoMappings: state.skipIoMappings,
      };

      const endpoint = state.asynchronous ? '/migration/executeAsync' : '/migration/execute';
      const response = await fetch(`${api.engineApi}${endpoint}`, {
        method: 'POST',
        headers: headers(api),
        body: JSON.stringify(payload),
      });

      if (state.asynchronous) {
        if (response.ok) {
          const batch = await response.json();
          updateState({ result: { success: true, batchId: batch.id } });
        } else {
          const error = await response.json();
          updateState({ result: { success: false, error: error.message || 'Migration failed' } });
        }
      } else {
        if (response.status === 204) {
          updateState({ result: { success: true } });
        } else {
          const error = await response.json();
          updateState({ result: { success: false, error: error.message || 'Migration failed' } });
        }
      }
      setCurrentStep('RESULTS');
    } catch (e: any) {
      updateState({ result: { success: false, error: e.message || 'Migration failed' } });
      setCurrentStep('RESULTS');
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="migration-confirm">
      <h4>Options</h4>
      <div style={{ marginBottom: '20px' }}>
        <label className="checkbox-inline">
          <input
            type="checkbox"
            checked={state.asynchronous}
            onChange={e => updateState({ asynchronous: e.target.checked })}
          />
          Asynchronous
        </label>
        <label className="checkbox-inline" style={{ marginLeft: '20px' }}>
          <input
            type="checkbox"
            checked={state.skipCustomListeners}
            onChange={e => updateState({ skipCustomListeners: e.target.checked })}
          />
          Skip Custom Listeners
        </label>
        <label className="checkbox-inline" style={{ marginLeft: '20px' }}>
          <input
            type="checkbox"
            checked={state.skipIoMappings}
            onChange={e => updateState({ skipIoMappings: e.target.checked })}
          />
          Skip IO Mappings
        </label>
      </div>

      <h4>Summary</h4>
      <p>
        You are about to migrate {instanceCount !== null ? <strong>{instanceCount}</strong> : '...'} instance(s) from
        the process definition with ID <strong>{state.sourceProcessDefinitionId}</strong> to the process definition with
        ID <strong>{state.targetProcessDefinitionId}</strong>.
      </p>

      <h4>Migration Plan</h4>
      <p>The following flow nodes will be mapped:</p>
      <table className="cam-table">
        <thead>
          <tr>
            <th>Source Activity</th>
            <th>Target Activity</th>
          </tr>
        </thead>
        <tbody>
          {state.instructions.map((instruction, index) => (
            <tr key={index}>
              <td>{instruction.sourceActivityIds.join(', ')}</td>
              <td>{instruction.targetActivityIds.join(', ')}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="migration-nav-buttons" style={{ borderTop: 'none', marginTop: '30px' }}>
        <button className="btn btn-danger" onClick={() => setCurrentStep('INSTANCES')}>
          Back
        </button>
        <button className="btn btn-danger" onClick={handleExecute} disabled={executing}>
          {executing ? (
            <>
              <span className="loader" style={{ marginRight: '8px' }} /> Executing...
            </>
          ) : (
            'Execute Migration'
          )}
        </button>
      </div>
    </div>
  );
};

export default MigrationStep4Confirm;
