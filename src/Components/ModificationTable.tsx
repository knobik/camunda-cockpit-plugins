import './definition-batch-modify-table.scss';
import React from 'react';

export interface ModificationInstruction {
  type: string;
  name: string;
  activityId: string;
}

export interface ModificationTableProps {
  instructions: ModificationInstruction[];
  setInstructions: any;
}

const ModificationTable: React.FC<ModificationTableProps> = ({ instructions, setInstructions }) => {
  function removeInstruction(activityId: string) {
    setInstructions(instructions.filter((instruction: ModificationInstruction) => instruction.activityId !== activityId));
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
                <button className="btn btn-danger" onClick={() => removeInstruction(instruction.activityId)}>
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
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default ModificationTable;
