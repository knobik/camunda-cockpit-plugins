import './camunda-filter-box.scss';

import React, { useEffect, useState } from 'react';
import Dropdown from 'react-bootstrap/Dropdown';

export interface CamundaFilterBoxProps {
  placeholder?: string;
}

export enum Operator {
  eq = 'eq', // =
  neq = 'neq', // !=
  gt = 'gt', // >
  gteq = 'gteq', // >=
  lt = 'lt', // <
  lteq = 'lteq', // <=
  like = 'like', // like
}

export interface Expression {
  label: string;
  type: string;
  availableOperators: Operator[];
  operator: Operator;
  value: string;
  name: string;
  requiresName: boolean;
  requiresValue: boolean;
}

function operatorToText(operator: Operator): string {
  switch (operator) {
    case Operator.eq:
      return '=';
    case Operator.neq:
      return '!=';
    case Operator.gt:
      return '>';
    case Operator.gteq:
      return '>=';
    case Operator.lt:
      return '<';
    case Operator.lteq:
      return '<=';
    case Operator.like:
      return 'like';
    default:
      return '';
  }
}

function isValidExpression(expression: Expression): boolean {
  if (expression.requiresValue && expression.value === '') {
    return false;
  }

  if (expression.requiresName && expression.name === '') {
    return false;
  }

  return true;
}

const CamundaFilterBox: React.FC<CamundaFilterBoxProps> = ({ placeholder }) => {
  const [expressions, setExpressions] = useState([
    {
      label: 'Activity ID',
      type: 'activityIdIn',
      name: '',
      availableOperators: [Operator.eq],
      operator: Operator.eq,
      value: 'prepareBankTransfer',
      requiresValue: true,
      requiresName: false,
    } as Expression,
    {
      label: 'Activity ID',
      type: 'activityIdIn',
      name: '',
      availableOperators: [Operator.eq],
      operator: Operator.eq,
      value: '',
      requiresValue: true,
      requiresName: false,
    } as Expression,
    {
      label: 'With Incidents',
      type: 'withIncidents',
      name: '',
      availableOperators: [Operator.eq],
      operator: Operator.eq,
      value: '',
      requiresValue: false,
      requiresName: false,
    } as Expression,
    {
      label: 'Variable',
      type: 'variable',
      name: 'dupa',
      availableOperators: [
        Operator.eq,
        Operator.neq,
        Operator.gt,
        Operator.gteq,
        Operator.lt,
        Operator.lteq,
        Operator.like,
      ],
      operator: Operator.eq,
      value: 'some value',
      requiresValue: true,
      requiresName: true,
    } as Expression,
    {
      label: 'Variable',
      type: 'variable',
      name: '',
      availableOperators: [
        Operator.eq,
        Operator.neq,
        Operator.gt,
        Operator.gteq,
        Operator.lt,
        Operator.lteq,
        Operator.like,
      ],
      operator: Operator.eq,
      value: '',
      requiresValue: true,
      requiresName: true,
    } as Expression,
    {
      label: 'Variable',
      type: 'variable',
      name: '',
      availableOperators: [
        Operator.eq,
        Operator.neq,
        Operator.gt,
        Operator.gteq,
        Operator.lt,
        Operator.lteq,
        Operator.like,
      ],
      operator: Operator.eq,
      value: 'some value',
      requiresValue: true,
      requiresName: true,
    } as Expression,
  ] as Expression[]);

  const CustomToggle = React.forwardRef<
    HTMLInputElement,
    {
      children: React.ReactNode;
      onClick: (e: React.MouseEvent<HTMLInputElement>) => void;
    }
  >(({ children, onClick }, ref) => (
    <input
      ref={ref}
      className="search-input"
      defaultValue={children as string}
      placeholder={placeholder ?? 'Add criteria...'}
      onClick={e => {
        e.preventDefault();
        onClick(e);
      }}
    />
  ));

  function removeExpression(index: number) {
    setExpressions(expressions.filter((_, i) => i !== index));
  }

  return (
    <div className="camunda-filter-box-container form-control">
      {expressions.map((expression, index) => (
        <div className={`expression ${!isValidExpression(expression) ? 'invalid' : ''}`} key={index}>
          <span className="glyphicon glyphicon-remove" onClick={() => removeExpression(index)}></span>
          <span>
            {expression.label}
          </span>
          {(expression.name || expression.requiresName) && (
            <>
              <span className="non-editable">:</span>
              <span>
                {expression.name !== '' ? expression.name : '??'}
              </span>
            </>
          )}
          {expression.requiresValue &&
            <>
              <span className={`${expression.availableOperators.length === 1 ? 'non-editable' : ''}`}>
                {operatorToText(expression.operator)}
              </span>
              <span>
                {expression.value !== '' ? expression.value : '??'}
              </span>
            </>
          }
        </div>
      ))}
      <Dropdown>
        <Dropdown.Toggle as={CustomToggle}></Dropdown.Toggle>
        <Dropdown.Menu>
          <Dropdown.Item eventKey="1">Red</Dropdown.Item>
          <Dropdown.Item eventKey="2">Blue</Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    </div>
  );
};

export default CamundaFilterBox;
