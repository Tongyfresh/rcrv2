import { DrupalResponse } from '@/types/drupal';
import Link from 'next/link';
import VideoPlayer from './components/videoPlayer/videoPlayer';

export default async function Home() {
  const baseUrl = process.env.DRUPAL_API_URL?.split('/jsonapi')[0];

  if (!baseUrl) {
    throw new Error('DRUPAL_API_URL is not defined');
  }

  // Only request specific fields to avoid relationship issues
  const apiUrl = `${baseUrl}/jsonapi/node/home_page?fields[node--home_page]=title,body`;
  console.log('Requesting URL:', apiUrl);

  try {
    const res = await fetch(apiUrl, {
      next: { revalidate: 3600 },
      headers: {
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        'Authorization': `Basic ${process.env.DRUPAL_AUTH_TOKEN}`,
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Response Headers:', Object.fromEntries(res.headers.entries()));
      console.error('Response Status:', res.status);
      console.error('Error Text:', errorText);
      throw new Error(`Failed to fetch data: ${res.status} - ${errorText}`);
    }

    const data: DrupalResponse = await res.json();

    if (!data.data?.[0]) {
      return (
        <div className="container mx-auto px-4 py-8">
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
            Homepage content not found
          </div>
        </div>
      );
    }

    const homePage = data.data[0];
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between gap-8">
          {/* Left Column - Existing Content */}
          <article className="prose max-w-[640px] flex-1">
            {/* Title */}
            <h1 className="font-title flex justify-start mb-6 text-4xl text-primary uppercase text-pretty">
              {homePage.attributes.title}
            </h1>

            {/* Body Content */}
            {homePage.attributes.body && homePage.attributes.body.value ? (
              <div
                dangerouslySetInnerHTML={{ __html: homePage.attributes.body.value }}
                className="mt-4 mb-50 text-black text-pretty"  
              />
            ) : (
              <p className="text-secondary">No content available</p>
            )}
          </article>

            {/* Right Column - Buttons */}
            <div className="flex flex-col gap-4 mt-8 max-w-[600px] relative">
              {/* RCR Toolbox Button with Description */}
              <div className="relative group w-full">
                <Link 
                  href="/toolbox"
                  className="block w-full bg-primary text-white px-6 py-3 rounded-lg transition-colors hover:bg-white hover:text-primary border-2 border-primary text-center"
                >
                  RCR Toolbox
                </Link>
                
                {/* RCR Description Box - Left Pop-out */}
                <div className="absolute right-full top-0 w-[400px] mr-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
                  <div className="border-2 border-primary bg-white text-primary p-4 rounded-lg shadow-lg">
                    <h3 className="font-semibold mb-2">RCR Toolbox</h3>
                    <p className="text-sm">
                      The RCR Toolbox is a curated collection of downloadable resources designed to support and facilitate research initiatives in rural communities.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Research button - Left pop-out */}
              <div className="relative group w-full">
                <Link 
                  href="/research"
                  className="block w-full bg-secondary text-white px-6 py-3 rounded-lg transition-colors hover:bg-white hover:text-secondary text-center hover:border-secondary border-2 border-secondary"
                >
                  Research Plebotomy Collective Sites
                </Link>
                
                {/* Research Description Box - Left Pop-out */}
                <div className="absolute right-full top-0 w-[400px] mr-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
                  <div className="border-2 border-secondary bg-white text-secondary p-4 rounded-lg shadow-lg">
                    <h3 className="font-semibold mb-2">Research</h3>
                    <p className="text-sm">
                      Learn more about the research initiatives and projects that are currently underway in rural communities.
                    </p>
                  </div>
                </div>
              </div>
              
                {/* Partner Button */} 
                <div className="relative group w-full">
                  <Link
                    href="/partners"
                    className="block w-full bg-white  text-primary px-6 py-3 rounded-lg transition-colors hover:bg-primary/10 hover:text-highlight text-center border-2 border-primary"
                  >
                    Partners
                  </Link>
                  
                  {/* Partner Description Box - Left Pop-out */}
                  <div className="absolute  right-full top-0 w-[400px] mr-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
                    <div className="border-2 border-highlight bg-white text-highlight p-4 rounded-lg shadow-lg">
                      <h3 className="font-semibold mb-2">Partners</h3>
                      <p className="text-sm">
                        Discover the organizations and institutions that are collaborating with RCR to support research in rural communities.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

        <VideoPlayer 
          videoId="Kieha1QED1U"
          title=""
          imageName="rcr_wheat.png"
        />

        {/* Quick Links Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-body text-primary mb-4">
            Quick Links
          </h2>
          <ul className="space-y-2">
            <li>
              <a
                href="/locations"
                className="text-black hover:text-highlight transition-colors"
              >
                Locations
              </a>
            </li>
            <li>
              <a
                href="/toolbox"
                className="text-black hover:text-highlight transition-colors"
              >
                Toolbox Resources
              </a>
            </li>
          </ul>
        </div>
        
      </main>
    );
  } catch (error) {
    console.error('Error fetching data:', error);
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error loading homepage content
        </div>
      </div>
    );
  }
}