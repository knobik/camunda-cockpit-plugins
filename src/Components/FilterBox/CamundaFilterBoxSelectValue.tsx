import React from 'react';
import Dropdown from 'react-bootstrap/Dropdown';

import { Expression, ExpressionDefinition } from './CamundaFilterBox';

export interface Props {
  field?: string;
  expression?: Expression;
  updateExpression: (expression: Expression, newValue: string) => void;
  options: any[];
  translator?: any;
  defaultValue?: string;
}

const CamundaFilterBoxSelectValue: React.FC<Props> = ({
  expression,
  field,
  updateExpression,
  options,
  translator,
  defaultValue
}) => {

  let value: string = '';

  if (defaultValue) {
    value = defaultValue;
  }
  if (expression && field) {
    value = (expression as any)[field];
  }

  const CustomToggle = React.forwardRef<
    HTMLSpanElement,
    {
      children: React.ReactNode;
      onClick: (e: React.MouseEvent) => void;
    }
  >(({ children, onClick }, ref) => (
    <span
      ref={ref}
      onClick={e => {
        e.preventDefault();
        onClick(e);
      }}
    >
      {children}
    </span>
  ));

  function submitChange(newValue: string) {
    if (expression && field) {
      (expression as any)[field] = newValue;
    }
    updateExpression(expression as Expression, newValue);
  }

  return (
    <>
      <Dropdown onSelect={(eventKey: string | null) => submitChange(eventKey as string)}>
        <Dropdown.Toggle as={CustomToggle}>
          {value !== '' ? (translator ? translator(value as string) : value as string) : '??'}
        </Dropdown.Toggle>
        <Dropdown.Menu>
          {options.map((option: any, index: number) => (
            <Dropdown.Item key={index} eventKey={option}>
              {translator ? translator(option as string) : option as string}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>
    </>
  );
};

export default CamundaFilterBoxSelectValue;
