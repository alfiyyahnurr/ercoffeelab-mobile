import { Platform, ViewStyle } from 'react-native';

export function getShadowStyle(
  color: string,
  offsetY: number,
  opacity: number,
  radius: number,
  elevation: number = 4
): ViewStyle {
  if (Platform.OS === 'web') {
    let rgbaColor = color;
    if (color === '#181F4B') {
      rgbaColor = `rgba(24, 31, 75, ${opacity})`;
    } else if (color === '#C9A876') {
      rgbaColor = `rgba(201, 168, 118, ${opacity})`;
    } else {
      rgbaColor = `rgba(0, 0, 0, ${opacity})`;
    }
    return {
      boxShadow: `0px ${offsetY}px ${radius}px ${rgbaColor}`,
    } as any;
  }

  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: offsetY },
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation,
  };
}
