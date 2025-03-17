import React from 'react';
import { Expression } from './CamundaFilterBox';

export interface CamundaFilterBoxTextValueProps {
  field: string;
  expression: Expression;
  updateExpression: (expression: Expression, newValue: string) => void;
}

const CamundaFilterBoxTextValue: React.FC<CamundaFilterBoxTextValueProps> = ({ expression, field, updateExpression }) => {
  const [isEditing, setIsEditing] = React.useState(false);

  const value: string = (expression as any)[field];

  function submitChange(newValue: string) {
    setIsEditing(false);
    (expression as any)[field] = newValue;
    updateExpression(expression as Expression, newValue);
  }

  return (
    <>
      {isEditing ? (
        <input
          autoFocus
          defaultValue={value}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              submitChange(e.currentTarget.value);
            }
          }}
        />
      ) : (
        <span onClick={() => setIsEditing(true)}>{value !== '' ? value : '??'}</span>
      )}
    </>
  );
};

export default CamundaFilterBoxTextValue;
