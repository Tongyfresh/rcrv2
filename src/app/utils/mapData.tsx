// import { getImageUrl } from './contentProcessor';
// import { DrupalResponse } from './drupalFetcher';

// export async function fetchMapData(baseUrl: string) {
//   try {
//     const response = await fetch(
//       `${baseUrl}/jsonapi/node/map_data?include=field_states,field_locations`
//     );

//     if (!response.ok) {
//       throw new Error('Failed to fetch map data');
//     }

//     return await response.json();
//   } catch (error) {
//     console.error('Error fetching map data:', error);
//     return null;
//   }
// }

// export function processMapData(data: DrupalResponse, baseUrl: string) {
//   if (!data?.data) return null;

//   // Extract states data
//   const states =
//     data.included
//       ?.filter((item) => item.type === 'paragraph--state')
//       .map((state) => ({
//         id: state.id,
//         name: state.attributes?.field_state_name,
//         path: state.attributes?.field_svg_path,
//         mediaId: state.relationships?.field_state_image?.data?.id,
//       })) || [];

//   // Extract locations data
//   const locations =
//     data.included
//       ?.filter((item) => item.type === 'paragraph--location')
//       .map((loc) => ({
//         id: loc.id,
//         name: loc.attributes?.field_location_name,
//         state: loc.relationships?.field_related_state?.data?.id,
//         x: loc.attributes?.field_x_coordinate,
//         y: loc.attributes?.field_y_coordinate,
//         mediaId: loc.relationships?.field_location_image?.data?.id,
//       })) || [];

//   // Get image URLs
//   const statesWithImages = states.map((state) => ({
//     ...state,
//     imageUrl: state.mediaId ? getImageUrl(data, state.mediaId, baseUrl) : null,
//   }));

//   const locationsWithImages = locations.map((loc) => ({
//     ...loc,
//     imageUrl: loc.mediaId ? getImageUrl(data, loc.mediaId, baseUrl) : null,
//   }));

//   return {
//     states: statesWithImages,
//     locations: locationsWithImages,
//   };
// }
