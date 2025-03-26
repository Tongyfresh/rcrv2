// import { useState } from 'react';

// export default function InteractiveMap() {
//   const [activeState, setActiveState] = useState(null);
//   const [activeLocation, setActiveLocation] = useState(null);

//   // Sample data - replace with your actual state paths and locations
//   const states = [
//     {
//       id: 'colorado',
//       name: 'Colorado',
//       path: 'M100,200 L150,200 L150,250 L100,250 Z',
//     },
//     { id: 'utah', name: 'Utah', path: 'M160,200 L210,200 L210,250 L160,250 Z' },
//     // Add more states as needed
//   ];

//   const locations = [
//     { id: 'denver', name: 'Denver', state: 'colorado', x: 125, y: 225 },
//     { id: 'salt-lake', name: 'Salt Lake City', state: 'utah', x: 185, y: 225 },
//     // Add more locations as needed
//   ];

//   return (
//     <div className="relative mx-auto w-full max-w-4xl">
//       <svg
//         viewBox="0 0 300 300"
//         className="h-auto w-full rounded-lg border border-gray-200 shadow-lg"
//       >
//         {/* States */}
//         {states.map((state) => (
//           <path
//             key={state.id}
//             id={state.id}
//             d={state.path}
//             className={`cursor-pointer transition-all duration-300 ${activeState === state.id ? 'fill-blue-400 stroke-blue-600' : 'fill-gray-200 stroke-gray-400'} hover:fill-blue-300 hover:stroke-blue-500`}
//             strokeWidth="1"
//             onMouseEnter={() => setActiveState(state.id)}
//             onMouseLeave={() => setActiveState(null)}
//           />
//         ))}

//         {/* Location markers */}
//         {locations.map((location) => (
//           <g
//             key={location.id}
//             className="cursor-pointer"
//             transform={`translate(${location.x}, ${location.y})`}
//             onMouseEnter={() => setActiveLocation(location.id)}
//             onMouseLeave={() => setActiveLocation(null)}
//           >
//             <circle
//               r="5"
//               className={`transition-all duration-300 ${activeLocation === location.id ? 'scale-150 fill-yellow-400' : 'fill-yellow-500'}`}
//             />
//             <text
//               y="-10"
//               textAnchor="middle"
//               className={`text-xs font-semibold transition-opacity duration-300 ${activeLocation === location.id ? 'opacity-100' : 'opacity-0'}`}
//             >
//               {location.name}
//             </text>
//           </g>
//         ))}

//         {/* State name labels (optional) */}
//         {states.map((state) => (
//           <text
//             key={`label-${state.id}`}
//             x="50%"
//             y="50%"
//             textAnchor="middle"
//             className={`text-lg font-bold transition-opacity duration-300 ${activeState === state.id ? 'opacity-100' : 'opacity-0'}`}
//           >
//             {state.name}
//           </text>
//         ))}
//       </svg>
//     </div>
//   );
// }
