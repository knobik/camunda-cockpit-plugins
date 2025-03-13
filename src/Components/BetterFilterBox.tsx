import './react-filter-box.scss';
import './react-datepicker.scss';

import React, { useEffect, useState } from 'react';

const BetterFilterBox = (props: any) => {
  return (
      <div className="form-container">
        <input className="form-control" placeholder="Add criteria..." />
      </div>
  );
};

export default BetterFilterBox;
