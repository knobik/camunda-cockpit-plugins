import './camunda-filter-box.scss';

import React, { forwardRef, ReactElement, useState } from 'react';
import Dropdown from 'react-bootstrap/Dropdown';

import CamundaFilterBoxSelectValue from './CamundaFilterBoxSelectValue';
import CamundaFilterBoxTextValue from './CamundaFilterBoxTextValue';
import CamundaFilterBoxDatetimeValue from './CamundaFilterBoxDatetimeValue';

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
  fieldType?: string;
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

export function castValue(value: string): any {
  let result: any = value;

  if (!isNaN(Number(value))) {
    result = Number(value);
  }

  // cast boolean
  if (value === 'true' || value === 'false') {
    result = value === 'true';
  }

  return result;
}

export function operatorToText(o: Operator): string {
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

export function isValidExpression(expression: Expression): boolean {
  if (expression.definition.requiresValue && expression.value === '') {
    return false;
  }

  if (expression.definition.requiresName && expression.name === '') {
    return false;
  }

  return true;
}

export interface CamundaFilterBoxProps {
  children?: ReactElement | ReactElement[];
  placeholder?: string;
  availableExpressions: ExpressionDefinition[];
  expressions: Expression[];
  setExpressions: (expressions: Expression[]) => void;
}

const CamundaFilterBox: React.FC<CamundaFilterBoxProps> = ({ children, placeholder, availableExpressions, expressions, setExpressions }) => {

  const CustomToggle = React.forwardRef<
    HTMLInputElement,
    {
      onClick: (e: React.MouseEvent<HTMLInputElement>) => void;
    }
  >(({ onClick }, ref) => (
    <input
      ref={ref}
      autoComplete="off"
      className="search-input"
      placeholder={placeholder ?? 'Add criteria...'}
      onClick={e => {
        e.preventDefault();
        onClick(e);
      }}
      onKeyDown={e => {
        if (e.key === 'Enter') {
          addExpression(availableExpressions[0].label, e.currentTarget.value);
        }
      }}
    />
  ));

  function addExpression(label: string | null, value?: string) {
    if (!label) {
      return;
    }

    const definition = availableExpressions.find(def => def.label === label);
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

  function changeExpressionDefinition(index: number, expression: Expression, newDefinitionLabel: string) {
    const definition = availableExpressions.find(def => def.label === newDefinitionLabel);
    if (!definition) {
      return;
    }
    expression.definition = definition;
    expression.operator = definition.defaultOperator;
    expression.name = definition.requiresName ? expression.name : '';
    expression.value = definition.requiresValue ? expression.value : (definition.defaultValue ?? '');

    updateExpression(index, expression);
  }

  function removeExpression(index: number) {
    setExpressions(expressions.filter((_, i) => i !== index));
  }

  return (
    <div className="camunda-filter-box-container form-control">
      <div className="actions">
        {children}
      </div>
      {expressions.map((expression, index) => (
        <div className={`expression ${!isValidExpression(expression) ? 'invalid' : ''}`} key={index}>
          <span className="glyphicon glyphicon-remove" onClick={() => removeExpression(index)}></span>
          <CamundaFilterBoxSelectValue
            options={availableExpressions.map(def => def.label)}
            defaultValue={expression.definition.label}
            updateExpression={(_, newValue) => changeExpressionDefinition(index, expression, newValue)}
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
              {(!expression.definition.fieldType || expression.definition.fieldType === 'text') &&
                <CamundaFilterBoxTextValue
                  openEditing={expression.value === ''}
                  expression={expression}
                  field="value"
                  updateExpression={changed => updateExpression(index, changed)}
                />
              }
              {expression.definition.fieldType === 'datetime' &&
                <CamundaFilterBoxDatetimeValue
                  openEditing={expression.value === ''}
                  expression={expression}
                  field="value"
                  updateExpression={changed => updateExpression(index, changed)}
                />
              }
            </>
          )}
        </div>
      ))}
      <Dropdown onSelect={(eventKey: string | null) => addExpression(eventKey)}>
        <Dropdown.Toggle as={CustomToggle} />
        <Dropdown.Menu>
          {availableExpressions.map((definition: ExpressionDefinition, index: number) => (
            <Dropdown.Item key={index} eventKey={definition.label}>
              {definition.label}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>
    </div>
  );
};

export default CamundaFilterBox;
