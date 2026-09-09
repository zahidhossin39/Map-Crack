'use client';

import React, { useEffect, useRef } from 'react';
import { useMap } from '@vis.gl/react-google-maps';

interface RadiusCircleProps {
  center: { lat: number; lng: number };
  radiusMeters: number;
}

export const RadiusCircle: React.FC<RadiusCircleProps> = ({ center, radiusMeters }) => {
  const map = useMap();
  const circleRef = useRef<google.maps.Circle | null>(null);

  useEffect(() => {
    if (!map) return;

    if (!circleRef.current) {
      circleRef.current = new google.maps.Circle({
        map,
        center,
        radius: radiusMeters,
        strokeColor: '#10b981',
        strokeOpacity: 0.95,
        strokeWeight: 2.5,
        fillColor: '#10b981',
        fillOpacity: 0.07,
        clickable: false,
      });
    } else {
      circleRef.current.setCenter(center);
      circleRef.current.setRadius(radiusMeters);
    }

    return () => {
      if (circleRef.current) {
        circleRef.current.setMap(null);
        circleRef.current = null;
      }
    };
  }, [map, center.lat, center.lng, radiusMeters]);

  return null;
};
