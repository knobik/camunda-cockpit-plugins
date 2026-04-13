import React, { useEffect, useState } from 'react';

import { API, MigrationInstructionDto, MigrationPlanReportDto, ProcessDefinitionDto, VariableValueDto } from '../types';
import { get } from '../utils/api';
import MigrationStep1Mapping from './MigrationStep1Mapping';
import MigrationStep2Variables from './MigrationStep2Variables';
import MigrationStep3Instances from './MigrationStep3Instances';
import MigrationStep4Confirm from './MigrationStep4Confirm';
import MigrationStep5Results from './MigrationStep5Results';
import MigrationStepProgress, { MigrationStep } from './MigrationStepProgress';

interface Props {
  api: API;
  processDefinitionKey: string;
}

export interface MigrationState {
  sourceProcessDefinitionId: string;
  targetProcessDefinitionId: string;
  sourceVersions: ProcessDefinitionDto[];
  sourceDiagramXML: string;
  targetDiagramXML: string;
  instructions: MigrationInstructionDto[];
  validationReport: MigrationPlanReportDto | null;
  variables: Record<string, VariableValueDto>;
  selectionType: 'instances' | 'query';
  selectedInstanceIds: string[];
  instanceQuery: Record<string, any> | null;
  asynchronous: boolean;
  skipCustomListeners: boolean;
  skipIoMappings: boolean;
  result: { success: true; batchId?: string } | { success: false; error: string } | null;
}

const MigrationWizard: React.FC<Props> = ({ api, processDefinitionKey }) => {
  const [currentStep, setCurrentStep] = useState<MigrationStep>('MAPPING');
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<MigrationState>({
    sourceProcessDefinitionId: '',
    targetProcessDefinitionId: '',
    sourceVersions: [],
    sourceDiagramXML: '',
    targetDiagramXML: '',
    instructions: [],
    validationReport: null,
    variables: {},
    selectionType: 'instances',
    selectedInstanceIds: [],
    instanceQuery: null,
    asynchronous: true,
    skipCustomListeners: false,
    skipIoMappings: false,
    result: null,
  });

  useEffect(() => {
    (async () => {
      const versions: ProcessDefinitionDto[] = await get(api, '/process-definition', {
        key: processDefinitionKey,
        sortBy: 'version',
        sortOrder: 'desc',
      });
      if (versions.length > 0) {
        const target = versions[0]; // latest version
        const source = versions.length > 1 ? versions[1] : versions[0]; // previous version
        const [sourceXml, targetXml] = await Promise.all([
          get(api, `/process-definition/${source.id}/xml`),
          get(api, `/process-definition/${target.id}/xml`),
        ]);
        setState(prev => ({
          ...prev,
          sourceVersions: versions,
          sourceProcessDefinitionId: source.id,
          targetProcessDefinitionId: target.id,
          sourceDiagramXML: sourceXml.bpmn20Xml,
          targetDiagramXML: targetXml.bpmn20Xml,
        }));
      }
      setLoading(false);
    })();
  }, [processDefinitionKey]);

  const handleStepClick = (step: MigrationStep) => {
    setCurrentStep(step);
  };

  const updateState = (partial: Partial<MigrationState>) => {
    setState(prev => ({ ...prev, ...partial }));
  };

  if (loading) {
    return <div style={{ padding: '2em', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div className="migration-wizard">
      <MigrationStepProgress currentStep={currentStep} onStepClick={handleStepClick} />

      <div className="migration-step-content">
        {currentStep === 'MAPPING' && <MigrationStep1Mapping api={api} state={state} updateState={updateState} />}
        {currentStep === 'VARIABLES' && <MigrationStep2Variables api={api} state={state} updateState={updateState} />}
        {currentStep === 'INSTANCES' && <MigrationStep3Instances api={api} state={state} updateState={updateState} />}
        {currentStep === 'CONFIRM' && (
          <MigrationStep4Confirm api={api} state={state} updateState={updateState} setCurrentStep={setCurrentStep} />
        )}
        {currentStep === 'RESULTS' && <MigrationStep5Results state={state} setCurrentStep={setCurrentStep} />}
      </div>

      {currentStep !== 'RESULTS' && currentStep !== 'CONFIRM' && (
        <div className="migration-nav-buttons">
          <button
            className="btn btn-danger"
            onClick={() => {
              const steps: MigrationStep[] = ['MAPPING', 'VARIABLES', 'INSTANCES', 'CONFIRM', 'RESULTS'];
              const idx = steps.indexOf(currentStep);
              if (idx > 0) setCurrentStep(steps[idx - 1]);
              else window.location.href = '#/processes/';
            }}
          >
            Back
          </button>
          <button
            className="btn btn-default"
            onClick={() => {
              const steps: MigrationStep[] = ['MAPPING', 'VARIABLES', 'INSTANCES', 'CONFIRM', 'RESULTS'];
              const idx = steps.indexOf(currentStep);
              if (idx < steps.length - 1) setCurrentStep(steps[idx + 1]);
            }}
          >
            {currentStep === 'MAPPING' && 'Set Variables'}
            {currentStep === 'VARIABLES' && 'Select Instances'}
            {currentStep === 'INSTANCES' && 'Migrate Instances'}
          </button>
        </div>
      )}
    </div>
  );
};

export default MigrationWizard;
