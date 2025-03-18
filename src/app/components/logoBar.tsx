'use client'

import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import { fetchDrupalImage } from '../utils/imageFetcher'

type Partner = {
  id: number
  name: string
  url: string
  logoName: string
}

type LogoBarProps = {
  partners: Partner[]
}

const LogoBar: React.FC<LogoBarProps> = ({ partners }) => {
  const [logoUrls, setLogoUrls] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    const loadImages = async () => {
      const urls: { [key: string]: string } = {}
      
      for (const partner of partners) {
        const url = await fetchDrupalImage(partner.logoName)
        if (url) {
          urls[partner.logoName] = url
        }
      }
      
      setLogoUrls(urls)
    }

    loadImages()
  }, [partners])

  return (
    <div className="w-full py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-body text-primary text-center mb-8">
          Our Partners
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center justify-items-center">
          {partners.map((partner) => (
            logoUrls[partner.logoName] ? (
              <a 
                key={partner.id}
                href={partner.url}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-transform hover:scale-105"
              >
                <Image
                  src={logoUrls[partner.logoName]}
                  alt={partner.name}
                  width={150}
                  height={75}
                  className="object-contain h-16"
                />
              </a>
            ) : (
              <div key={partner.id} className="animate-pulse bg-gray-200 h-16 w-32" />
            )
          ))}
        </div>
      </div>
    </div>
  )
}

export default LogoBar