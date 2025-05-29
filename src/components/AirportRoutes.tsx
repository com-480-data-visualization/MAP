import React from 'react';
import { useMapContext } from 'react-simple-maps';

interface AirportRoutesProps {
  routes: Array<{ Origin: string; Destination: string; AverageDelay: string; NumFlights: string; }>;
  airports: Array<{ code: string; coordinates: [number, number]; }>;
  getDelayColor: (delay: number) => string;
}

const AirportRoutes: React.FC<AirportRoutesProps> = ({ routes, airports, getDelayColor }) => {
  const { projection } = useMapContext();

  const airportMap = new Map(airports.map(airport => [airport.code, airport.coordinates]));

  return (
    <>
      {routes.map((route, idx) => {
        const originCoords = airportMap.get(route.Origin);
        const destinationCoords = airportMap.get(route.Destination);
        if (!originCoords) return null; 
        if (!destinationCoords) return null;

        const originProjected = projection(originCoords);
        const destinationProjected = projection(destinationCoords);
        if (!originProjected) return null;
        if (!destinationProjected) return null;

        const [x1, y1] = originProjected;
        const [x2, y2] = destinationProjected;

        return (
          <line key={idx}
            x1={x1} y1={y1} x2={x2} y2={y2}
            opacity={0.6}
            stroke={getDelayColor(Number(route.AverageDelay))}
            strokeWidth={Math.max(0.5, Math.min(2, Number(route.NumFlights) / 300))}
            strokeDasharray="4,4"
          />
        );
      })}
    </>
  );
};

export default AirportRoutes; 
