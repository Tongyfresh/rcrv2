'use client';

import React, { useState } from 'react';

type TwoColumnLayoutProps = {
  leftColumn: React.ReactNode;
  rightColumn: React.ReactNode;
};

const TwoColumnLayout: React.FC<TwoColumnLayoutProps> = ({
  leftColumn,
  rightColumn,
}) => {
  const [isDescriptionVisible, setIsDescriptionVisible] = useState(false);

  return (
    <div className="relative flex flex-col gap-8 md:flex-row">
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${isDescriptionVisible ? 'md:pr-[400px]' : 'md:pr-0'} `}
      >
        <div className="w-full overflow-hidden">{leftColumn}</div>
      </div>

      <div
        className="shrink-0 md:w-[300px]"
        onMouseEnter={() => setIsDescriptionVisible(true)}
        onMouseLeave={() => setIsDescriptionVisible(false)}
      >
        {rightColumn}
      </div>
    </div>
  );
};

export default TwoColumnLayout;
