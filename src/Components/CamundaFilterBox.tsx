import './camunda-filter-box.scss';

import React, { forwardRef, useState } from 'react';
import Dropdown from 'react-bootstrap/Dropdown';

export enum Operator {
  eq = 'eq', // =
  neq = 'neq', // !=
  gt = 'gt', // >
  gteq = 'gteq', // >=
  lt = 'lt', // <
  lteq = 'lteq', // <=
  like = 'like',
  before = 'before',
  after = 'after',
}

export interface ExpressionDefinition {
  label: string;
  type: string;
  availableOperators: Operator[];
  defaultOperator: Operator;
  requiresName: boolean;
  requiresValue: boolean;
}

export interface Expression {
  definition: ExpressionDefinition,
  name: string;
  operator: Operator;
  value: string;
}


function operatorToText(o: Operator): string {
  switch (o) {
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
      return Operator[o];
  }
}

function isValidExpression(expression: Expression): boolean {
  if (expression.definition.requiresValue && expression.value === '') {
    return false;
  }

  if (expression.definition.requiresName && expression.name === '') {
    return false;
  }

  return true;
}

const hooks: Record<string, any> = {
  customToggle: () => forwardRef((props, ref) => null),
};

export interface CamundaFilterBoxProps {
  placeholder?: string;
  availableExpressions: ExpressionDefinition[];
}

const CamundaFilterBox: React.FC<CamundaFilterBoxProps> = ({ placeholder, availableExpressions }) => {
  const [expressions, setExpressions] = useState([] as Expression[]);

  const CustomToggle = React.forwardRef<
    HTMLInputElement,
    {
      onClick: (e: React.MouseEvent<HTMLInputElement>) => void;
    }
  >(({ onClick }, ref) => (
    <input
      ref={ref}
      className="search-input"
      placeholder={placeholder ?? 'Add criteria...'}
      onClick={e => {
        e.preventDefault();
        onClick(e);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          addExpression(availableExpressions[0].type, e.currentTarget.value);
        }
      }}
    />
  ));

  function addExpression(type: string | null, value?: string) {
    if (!type) {
      return;
    }

    const definition = availableExpressions.find((def) => def.type === type);
    if (!definition) {
      return;
    }

    setExpressions([
      ...expressions,
      {
        definition,
        operator: definition.defaultOperator,
        name: '',
        value: value ?? '',
      } as Expression,
    ]);
  }

  function removeExpression(index: number) {
    setExpressions(expressions.filter((_, i) => i !== index));
  }

  return (
    <div className="camunda-filter-box-container form-control">
      {expressions.map((expression, index) => (
        <div className={`expression ${!isValidExpression(expression) ? 'invalid' : ''}`} key={index}>
          <span className="glyphicon glyphicon-remove" onClick={() => removeExpression(index)}></span>
          <span>
            {expression.definition.label}
          </span>
          {(expression.name || expression.definition.requiresName) && (
            <>
              <span className="non-editable">:</span>
              <span>
                {expression.name !== '' ? expression.name : '??'}
              </span>
            </>
          )}
          {expression.definition.requiresValue &&
            <>
              <span className={`${expression.definition.availableOperators.length === 1 ? 'non-editable' : ''}`}>
                {operatorToText(expression.operator)}
              </span>
              <span>
                {expression.value !== '' ? expression.value : '??'}
              </span>
            </>
          }
        </div>
      ))}
      <Dropdown
        onSelect={(eventKey: string | null) => addExpression(eventKey)}
      >
        <Dropdown.Toggle as={CustomToggle} />
        <Dropdown.Menu>
          {availableExpressions.map((definition: ExpressionDefinition, index: number) => (
            <Dropdown.Item key={index} eventKey={definition.type}>{definition.label}</Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>
    </div>
  );
};

export default CamundaFilterBox;
