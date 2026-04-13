import React, { useEffect, useState } from 'react';

import { API } from '../types';
import { post } from '../utils/api';
import CamundaFilterBox, {
  Expression,
  ExpressionDefinition,
  Operator,
  castValue,
  getExpressionValues,
  isValidExpression,
} from './FilterBox/CamundaFilterBox';
import { MigrationState } from './MigrationWizard';

interface Props {
  api: API;
  state: MigrationState;
  updateState: (partial: Partial<MigrationState>) => void;
}

interface ProcessInstance {
  id: string;
  businessKey: string;
  checked: boolean;
}

const expressionDefinitions: ExpressionDefinition[] = [
  {
    label: 'Business Key',
    type: 'businessKey',
    availableOperators: [Operator.eq],
    defaultOperator: Operator.eq,
    requiresValue: true,
    requiresName: false,
  } as ExpressionDefinition,
  {
    label: 'Activity ID',
    type: 'activityIdIn',
    availableOperators: [Operator.eq],
    defaultOperator: Operator.eq,
    requiresValue: true,
    requiresName: false,
  } as ExpressionDefinition,
  {
    label: 'With Incidents',
    type: 'withIncident',
    availableOperators: [Operator.eq],
    defaultOperator: Operator.eq,
    defaultValue: 'true',
    requiresValue: false,
    requiresName: false,
  } as ExpressionDefinition,
  {
    label: 'Variable',
    type: 'variable',
    availableOperators: [
      Operator.eq,
      Operator.neq,
      Operator.gt,
      Operator.gteq,
      Operator.lt,
      Operator.lteq,
      Operator.like,
    ],
    defaultOperator: Operator.eq,
    requiresValue: true,
    requiresName: true,
  } as ExpressionDefinition,
];

const MigrationStep3Instances: React.FC<Props> = ({ api, state, updateState }) => {
  const [query, setQuery] = useState<Record<string, any>>({});
  const [expressions, setExpressions] = useState<Expression[]>([]);
  const [instances, setInstances] = useState<ProcessInstance[]>([]);

  useEffect(() => {
    (async () => {
      const items = await post(
        api,
        '/process-instance',
        {},
        JSON.stringify({
          ...query,
          processDefinitionId: state.sourceProcessDefinitionId,
        })
      );
      const mapped: ProcessInstance[] = (items || []).map((item: any) => ({
        id: item.id,
        businessKey: item.businessKey,
        checked: state.selectionType === 'query' || state.selectedInstanceIds.includes(item.id),
      }));
      setInstances(mapped);
    })();
  }, [query, state.sourceProcessDefinitionId]);

  useEffect(() => {
    const validExpressions = expressions.filter(e => isValidExpression(e));

    const variableExpressions = getExpressionValues(validExpressions, 'variable', (e: Expression) => ({
      name: e.name,
      operator: e.operator as string,
      value: castValue(e.value),
    }));

    const activityIdInExpressions: string[] = getExpressionValues(
      validExpressions,
      'activityIdIn',
      (e: Expression) => e.value
    );

    const rest = validExpressions.filter(e => e.definition.type !== 'variable' && e.definition.type !== 'activityIdIn');

    const newQuery: any = {};
    rest.forEach(e => {
      newQuery[e.definition.type] = castValue(e.value);
    });
    if (activityIdInExpressions.length > 0) newQuery.activityIdIn = activityIdInExpressions;
    if (variableExpressions.length > 0) newQuery.variables = variableExpressions;

    if (JSON.stringify(newQuery) !== JSON.stringify(query)) {
      setQuery(newQuery);
    }
  }, [expressions]);

  const toggleChecked = (id: string) => {
    const updated = instances.map(i => (i.id === id ? { ...i, checked: !i.checked } : i));
    setInstances(updated);
    updateState({
      selectedInstanceIds: updated.filter(i => i.checked).map(i => i.id),
    });
  };

  const toggleCheckedAll = (checked: boolean) => {
    const updated = instances.map(i => ({ ...i, checked }));
    setInstances(updated);
    updateState({
      selectedInstanceIds: checked ? updated.map(i => i.id) : [],
    });
  };

  const changeSelectionType = (type: 'instances' | 'query') => {
    if (type === 'query') {
      const updated = instances.map(i => ({ ...i, checked: true }));
      setInstances(updated);
      updateState({
        selectionType: type,
        instanceQuery: { processDefinitionId: state.sourceProcessDefinitionId, ...query },
      });
    } else {
      const updated = instances.map(i => ({ ...i, checked: false }));
      setInstances(updated);
      updateState({ selectionType: type, instanceQuery: null, selectedInstanceIds: [] });
    }
  };

  return (
    <div className="migration-instances">
      <h4>Choose selection type</h4>
      <div style={{ marginBottom: '15px' }}>
        <label className="radio-inline">
          <input
            type="radio"
            name="selectionType"
            checked={state.selectionType === 'instances'}
            onChange={() => changeSelectionType('instances')}
          />
          <strong>Instances</strong>
        </label>
        <label className="radio-inline">
          <input
            type="radio"
            name="selectionType"
            checked={state.selectionType === 'query'}
            onChange={() => changeSelectionType('query')}
          />
          <strong>Query</strong>
        </label>
      </div>

      <h4>Filter for running process instances</h4>
      <CamundaFilterBox
        expressions={expressions}
        setExpressions={setExpressions}
        availableExpressions={expressionDefinitions}
        placeholder="Filter available instances..."
      >
        <span title="Process Instance Count">{instances.length}</span>
      </CamundaFilterBox>

      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        <table className="cam-table">
          <thead>
            <tr>
              {state.selectionType === 'instances' && (
                <th>
                  <input
                    type="checkbox"
                    checked={instances.length > 0 && instances.every(i => i.checked)}
                    onChange={e => toggleCheckedAll(e.target.checked)}
                  />
                </th>
              )}
              <th>ID</th>
              <th>Business Key</th>
            </tr>
          </thead>
          <tbody>
            {instances.map(instance => (
              <tr key={instance.id}>
                {state.selectionType === 'instances' && (
                  <td>
                    <input type="checkbox" checked={instance.checked} onChange={() => toggleChecked(instance.id)} />
                  </td>
                )}
                <td>
                  <a href={`#/process-instance/${instance.id}`} target="_blank">
                    {instance.id}
                  </a>
                </td>
                <td>{instance.businessKey}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MigrationStep3Instances;
