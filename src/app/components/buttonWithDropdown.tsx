'use client'

import { useState } from 'react'
import Link from 'next/link'

type ButtonWithDropdownProps = {
  href: string
  buttonText: string
  buttonClass: string
  descriptionText: string
  descriptionBorderClass: string
  descriptionTextClass: string
}

const ButtonWithDropdown: React.FC<ButtonWithDropdownProps> = ({
  href,
  buttonText,
  buttonClass,
  descriptionText,
  descriptionBorderClass,
  descriptionTextClass
}) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative group w-full inline-flex">
      <Link 
        href={href}
        className={`${buttonClass} w-full inline-flex justify-center items-center`}
        onClick={(e) => {
          if (window.innerWidth < 768) {
            e.preventDefault()
            setIsOpen(!isOpen)
          }
        }}
      >
        <span className="whitespace-nowrap">{buttonText}</span>
      </Link>
      
      <div className={`
        absolute w-full md:w-[400px]
        ${isOpen ? 'block' : 'hidden'} md:block
        md:invisible md:group-hover:visible
        top-full md:top-0
        left-0 md:-left-[420px]
        mt-2 md:mt-0
        z-10
        transition-all duration-300 ease-in-out
        transform
        opacity-0 md:group-hover:opacity-100
        translate-x-8 md:group-hover:translate-x-0
      `}>
        <div className={`
          ${descriptionBorderClass}
          transition-all duration-300 ease-in-out
          transform
          scale-95 md:group-hover:scale-100
          opacity-0 md:group-hover:opacity-100
        `}>
          <p className={descriptionTextClass}>{descriptionText}</p>
        </div>
      </div>
    </div>
  )
}

export default ButtonWithDropdown