import './camunda-filter-box.scss';

import React, { forwardRef, useState } from 'react';
import Dropdown from 'react-bootstrap/Dropdown';

import CamundaFilterBoxSelectValue from './CamundaFilterBoxSelectValue';
import CamundaFilterBoxTextValue from './CamundaFilterBoxTextValue';

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
  defaultValue?: string;
  requiresName: boolean;
  requiresValue: boolean;
}

export interface Expression {
  definition: ExpressionDefinition;
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

export interface CamundaFilterBoxProps {
  placeholder?: string;
  availableExpressions: ExpressionDefinition[];
  expressions: Expression[];
  setExpressions: (expressions: Expression[]) => void;
}

const CamundaFilterBox: React.FC<CamundaFilterBoxProps> = ({ placeholder, availableExpressions, expressions, setExpressions }) => {

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
      onKeyDown={e => {
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

    const definition = availableExpressions.find(def => def.type === type);
    if (!definition) {
      return;
    }

    setExpressions([
      ...expressions,
      {
        definition,
        operator: definition.defaultOperator,
        name: '',
        value: value ?? definition.defaultValue ?? '',
      } as Expression,
    ]);
  }

  function updateExpression(index: number, expression: Expression) {
    setExpressions(expressions.map((e, i) => (i === index ? expression : e)));
  }

  function changeExpressionType(index: number, expression: Expression, newType: string) {
    const definition = availableExpressions.find(def => def.type === newType);
    if (!definition) {
      return;
    }
    expression.definition = definition;
    expression.operator = definition.defaultOperator;
    expression.name = definition.requiresName ? expression.name : '';
    expression.value = definition.requiresValue ? expression.value : '';

    updateExpression(index, expression);
  }

  function removeExpression(index: number) {
    setExpressions(expressions.filter((e, i) => i !== index));
  }

  return (
    <div className="camunda-filter-box-container form-control">
      {expressions.map((expression, index) => (
        <div className={`expression ${!isValidExpression(expression) ? 'invalid' : ''}`} key={index}>
          <span className="glyphicon glyphicon-remove" onClick={() => removeExpression(index)}></span>
          <CamundaFilterBoxSelectValue
            options={availableExpressions.map(def => def.type)}
            defaultValue={expression.definition.type}
            translator={(value: string) => availableExpressions.find(def => def.type === value)?.label ?? value}
            updateExpression={(changed, newValue) => changeExpressionType(index, expression, newValue)}
          />
          {(expression.name || expression.definition.requiresName) && (
            <>
              <span className="non-editable">:</span>
              <CamundaFilterBoxTextValue
                expression={expression}
                field="name"
                updateExpression={changed => updateExpression(index, changed)}
              />
            </>
          )}
          {expression.definition.requiresValue && (
            <>
              {expression.definition.availableOperators.length === 1 ? (
                <span className="non-editable">{operatorToText(expression.operator)}</span>
              ) : (
                <CamundaFilterBoxSelectValue
                  options={expression.definition.availableOperators}
                  expression={expression}
                  field="operator"
                  translator={operatorToText}
                  updateExpression={changed => updateExpression(index, changed)}
                />
              )}
              <CamundaFilterBoxTextValue
                openEditing={expression.value === ''}
                expression={expression}
                field="value"
                updateExpression={changed => updateExpression(index, changed)}
              />
            </>
          )}
        </div>
      ))}
      <Dropdown onSelect={(eventKey: string | null) => addExpression(eventKey)}>
        <Dropdown.Toggle as={CustomToggle} />
        <Dropdown.Menu>
          {availableExpressions.map((definition: ExpressionDefinition, index: number) => (
            <Dropdown.Item key={index} eventKey={definition.type}>
              {definition.label}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>
    </div>
  );
};

export default CamundaFilterBox;
