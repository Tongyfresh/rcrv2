'use client'

import React, { useState } from 'react'

type TwoColumnLayoutProps = {
  leftColumn: React.ReactNode
  rightColumn: React.ReactNode
}

const TwoColumnLayout: React.FC<TwoColumnLayoutProps> = ({ leftColumn, rightColumn }) => {
  const [isDescriptionVisible, setIsDescriptionVisible] = useState(false)

  return (
    <div className="relative flex flex-col md:flex-row gap-8">
      <div className={`
        flex-1 transition-all duration-300 ease-in-out
        ${isDescriptionVisible ? 'md:pr-[400px]' : 'md:pr-0'}
      `}>
        <div className="w-full overflow-hidden">
          {leftColumn}
        </div>
      </div>
      
      <div className="md:w-[300px] shrink-0" 
        onMouseEnter={() => setIsDescriptionVisible(true)}
        onMouseLeave={() => setIsDescriptionVisible(false)}
      >
        {rightColumn}
      </div>
    </div>
  )
}

export default TwoColumnLayout