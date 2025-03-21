import React, { useState } from 'react';
import ReactDatePicker from 'react-datepicker';

import { Expression } from './CamundaFilterBox';
import moment from 'moment';

export interface Props {
  field: string;
  expression: Expression;
  updateExpression: (expression: Expression, newValue: string) => void;
  openEditing?: boolean;
}


const CamundaFilterBoxDatetimeValue: React.FC<Props> = ({
  expression,
  field,
  updateExpression,
  openEditing,
}) => {
  const [isEditing, setIsEditing] = useState(openEditing ?? true);
  const initialValue = (expression as any)[field];
  const [value, setValue] = useState(initialValue);

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
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                submitChange(value);
              }
            }}
          />
          <div
            className="btn-group"
            style={{ position: 'absolute', right: '0', top: '0', transform: 'translateY(-100%)' }}
          >
            <button className="btn btn-default btn-xs" onClick={() => submitChange(value)}>
              <span className="glyphicon glyphicon-ok"></span>
            </button>
            <button className="btn btn-default btn-xs" onClick={() => setIsEditing(false)}>
              <span className="glyphicon glyphicon-remove"></span>
            </button>
          </div>
          <div className="datetime-picker">
            <ReactDatePicker
              selected={!isNaN(new Date(value).getTime()) ? new Date(value) : new Date()}
              onChange={(date: Date) => {
                const dateString = date ? moment(date).format('YYYY-MM-DDTHH:mm:ss') : '';
                setValue(dateString);
                submitChange(dateString);
              }}
              inline
            />
          </div>
        </div>
      ) : (
        <span onClick={() => setIsEditing(true)}>{initialValue !== '' ? initialValue : '??'}</span>
      )}
    </>
  );
};

export default CamundaFilterBoxDatetimeValue;
