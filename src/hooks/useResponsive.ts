import { useState, useEffect } from 'react';

export interface ResponsiveState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenWidth: number;
  screenHeight: number;
  orientation: 'portrait' | 'landscape';
}

export interface ResponsiveBreakpoints {
  mobile: number;
  tablet: number;
  desktop: number;
}

const DEFAULT_BREAKPOINTS: ResponsiveBreakpoints = {
  mobile: 768,
  tablet: 1024,
  desktop: 1024,
};

export const useResponsive = (breakpoints: ResponsiveBreakpoints = DEFAULT_BREAKPOINTS): ResponsiveState => {
  const [state, setState] = useState<ResponsiveState>(() => {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        screenWidth: 1024,
        screenHeight: 768,
        orientation: 'landscape',
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    
    return {
      isMobile: width < breakpoints.mobile,
      isTablet: width >= breakpoints.mobile && width < breakpoints.desktop,
      isDesktop: width >= breakpoints.desktop,
      screenWidth: width,
      screenHeight: height,
      orientation: width > height ? 'landscape' : 'portrait',
    };
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setState({
        isMobile: width < breakpoints.mobile,
        isTablet: width >= breakpoints.mobile && width < breakpoints.desktop,
        isDesktop: width >= breakpoints.desktop,
        screenWidth: width,
        screenHeight: height,
        orientation: width > height ? 'landscape' : 'portrait',
      });
    };

    const handleOrientationChange = () => {
      // Delay to ensure accurate measurements after orientation change
      setTimeout(handleResize, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [breakpoints]);

  return state;
};

export const useCanvasSize = () => {
  const responsive = useResponsive();
  
  const getCanvasSize = (): { width: number; height: number } => {
    if (responsive.isMobile) {
      // On mobile, calculate available space more carefully
      const horizontalPadding = 16; // 1rem = 16px padding on sides
      const verticalReservedSpace = 220; // Space for HP panel (~120px) + safe areas + padding
      
      const availableWidth = responsive.screenWidth - horizontalPadding;
      const availableHeight = responsive.screenHeight - verticalReservedSpace;
      
      // Make canvas square, using the smaller dimension
      const maxSize = Math.min(availableWidth, availableHeight);
      
      // Ensure minimum size for usability
      const finalSize = Math.max(280, maxSize);
      
      return { width: finalSize, height: finalSize };
    }
    
    if (responsive.isTablet) {
      // On tablet, use a moderate size
      const maxSize = Math.min(500, responsive.screenWidth * 0.6);
      return { width: maxSize, height: maxSize };
    }
    
    // Desktop - use default size
    return { width: 600, height: 600 }; // Default ARENA_SIZE
  };

  return {
    ...responsive,
    canvasSize: getCanvasSize(),
  };
};