import React, { useState } from 'react';

import { Expression } from './CamundaFilterBox';

export interface Props {
  field: string;
  expression: Expression;
  updateExpression: (expression: Expression, newValue: string) => void;
  openEditing?: boolean;
}

const CamundaFilterBoxTextValue: React.FC<Props> = ({
  expression,
  field,
  updateExpression,
  openEditing,
}) => {
  const [isEditing, setIsEditing] = useState(openEditing ?? true);
  const value = (expression as any)[field];
  const [newValue, setNewValue] = useState('');

  function submitChange(changed: string) {
    setIsEditing(false);
    (expression as any)[field] = changed;
    updateExpression(expression as Expression, changed);
  }

  return (
    <>
      {isEditing ? (
        <div style={{ display: 'inline-block', position: 'relative' }}>
          <input
            autoFocus
            defaultValue={value}
            onChange={e => setNewValue(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                submitChange(newValue);
              }
            }}
          />
          <div
            className="btn-group"
            style={{ position: 'absolute', right: '0', top: '0', transform: 'translateY(-100%)' }}
          >
            <button className="btn btn-default btn-xs" onClick={() => submitChange(newValue)}>
              <span className="glyphicon glyphicon-ok"></span>
            </button>
            <button className="btn btn-default btn-xs" onClick={() => setIsEditing(false)}>
              <span className="glyphicon glyphicon-remove"></span>
            </button>
          </div>
        </div>
      ) : (
        <span onClick={() => setIsEditing(true)}>{value !== '' ? value : '??'}</span>
      )}
    </>
  );
};

export default CamundaFilterBoxTextValue;
