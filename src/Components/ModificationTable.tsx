import './definition-batch-modify-table.scss';

import React from 'react';

export interface ModificationInstruction {
  type: string;
  name: string;
  activityId: string;
  activityInstanceIds: string[];
}

export interface Props {
  instructions: ModificationInstruction[];
  setInstructions: any;
  batch: boolean;
  getActivityInstancesByActivityId?: (activityId: string) => any[];
}

const ModificationTable: React.FC<Props> = ({
  instructions,
  setInstructions,
  batch,
  getActivityInstancesByActivityId,
}) => {
  function removeInstruction(index: number) {
    const updatedInstructions = [...instructions];
    updatedInstructions.splice(index, 1);
    setInstructions(updatedInstructions);
  }

  function changeInstructionType(index: number, event: any) {
    const updatedInstructions = instructions.map((instruction: any, i: number) => {
      if (i === index) {
        instruction.type = event.target.value;
      }
      return instruction;
    });
    setInstructions(updatedInstructions);
  }

  function moveItemUp(index: number) {
    const updatedInstructions = [...instructions];
    const temp = updatedInstructions[index - 1];
    updatedInstructions[index - 1] = updatedInstructions[index];
    updatedInstructions[index] = temp;
    setInstructions(updatedInstructions);
  }

  function moveItemDown(index: number) {
    const updatedInstructions = [...instructions];
    const temp = updatedInstructions[index + 1];
    updatedInstructions[index + 1] = updatedInstructions[index];
    updatedInstructions[index] = temp;
    setInstructions(updatedInstructions);
  }

  function removeActivityInstanceId(instructionIndex: number, activityIndex: number) {
    const updatedInstructions = instructions.map((instruction: any, i: number) => {
      if (i === instructionIndex) {
        instruction.activityInstanceIds.splice(activityIndex, 1);
      }
      return instruction;
    });

    setInstructions(updatedInstructions);
  }

  function setAllActivityInstances(index: number) {
    if (getActivityInstancesByActivityId) {
      const updatedInstructions = instructions.map((instruction: any, i: number) => {
        if (i === index) {
          instruction.activityInstanceIds = getActivityInstancesByActivityId(instruction.activityId);
        }
        return instruction;
      });

      setInstructions(updatedInstructions);
    }
  }

  return (
    <table className="cam-table modification-table">
      <thead>
        <tr>
          <th>Remove</th>
          <th>Order</th>
          <th>Instruction</th>
        </tr>
      </thead>
      <tbody>
        {instructions.map((instruction: ModificationInstruction, index: number) => (
          <tr key={index}>
            <td className="remove">
              <div>
                <button className="btn btn-danger" onClick={() => removeInstruction(index)}>
                  <span className="glyphicon glyphicon-trash"></span>
                </button>
              </div>
            </td>
            <td className="order">
              {index > 0 && (
                <button className="btn btn-sm btn-default arrow-up" onClick={() => moveItemUp(index)}>
                  <span className="glyphicon glyphicon-arrow-up"></span>
                </button>
              )}
              {index < instructions.length - 1 && (
                <button className="btn btn-sm btn-default arrow-down" onClick={() => moveItemDown(index)}>
                  <span className="glyphicon glyphicon-arrow-down"></span>
                </button>
              )}
            </td>
            <td className={`instruction ${instruction.type === 'cancel' ? 'color-cancel' : 'color-move'}`}>
              <div className="color-bar"></div>
              <div className="instruction-container">
                <div className="instruction-container-row">
                  <select
                    className="form-control"
                    style={{ width: '200px' }}
                    value={instruction.type}
                    onChange={(event: any) => changeInstructionType(index, event)}
                  >
                    <option value="cancel">cancel</option>
                    <option value="startBeforeActivity">start before</option>
                    <option value="startAfterActivity">start after</option>
                  </select>
                  <span>{instruction.name}</span>
                </div>
                {!batch && (
                  <div className="instruction-container-row" style={{ marginTop: '5px' }}>
                    <table>
                      <tbody>
                        <tr>
                          <td></td>
                          <td style={{ paddingBottom: '10px', paddingTop: '10px' }}>
                            Affected instances{' '}
                            <a style={{ marginLeft: '15px' }} href="#" onClick={(e) => {
                              e.preventDefault();
                              setAllActivityInstances(index);
                            }}>
                              All +
                            </a>
                          </td>
                        </tr>
                        {instruction.activityInstanceIds.map((activityInstanceId: string, activityIndex: number) => (
                          <tr key={activityIndex}>
                            <td>
                              <a
                                href="#"
                                onClick={e => {
                                  e.preventDefault();
                                  removeActivityInstanceId(index, activityIndex);
                                }}
                              >
                                <span className="glyphicon glyphicon-remove"></span>
                              </a>
                            </td>
                            <td>
                              <code>{activityInstanceId}</code>
                              <a style={{ marginLeft: '10px' }} title="Show variables" href="#">
                                <span className="glyphicon glyphicon-eye-open"></span>
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default ModificationTable;
